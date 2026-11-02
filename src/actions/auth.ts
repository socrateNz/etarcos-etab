"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@/schemas/auth";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import * as Sentry from "@sentry/nextjs";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

/**
 * Action de connexion
 */
export async function loginAction(values: LoginInput) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Données invalides." };
  }

  const { email, password } = validatedFields.data;

  try {
    const result = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, result };
  } catch (error) {
    return { error: "Erreur d'authentification serveur." };
  }
}

/**
 * Action de déconnexion
 */
export async function logoutAction() {
  await nextAuthSignOut({ redirectTo: "/login" });
}

/** Établissement « système » auquel sont rattachés les comptes propriétaires (cf. superadmin). */
const SYSTEM_ESTABLISHMENT_ID = "00000000-0000-0000-0000-000000000000";

/** Message unique pour tous les échecs : n'expose ni détail technique ni existence d'un email. */
const REGISTER_FAILED = "Impossible de créer le compte. Vérifiez vos informations ou réessayez plus tard.";

/**
 * Action d'inscription publique d'un propriétaire.
 *
 * - Désactivable via `DISABLE_PUBLIC_REGISTRATION=true` (comptes créés
 *   uniquement par le superadmin).
 * - Limitée à 3 inscriptions par heure et par IP (Upstash).
 * - Si une étape échoue, les enregistrements déjà créés sont supprimés pour
 *   ne pas laisser de compte orphelin dans Supabase Auth.
 */
export async function registerAction(values: RegisterInput) {
  if (process.env.DISABLE_PUBLIC_REGISTRATION === "true") {
    return { error: "Les inscriptions publiques sont fermées. Contactez l'administrateur de la plateforme." };
  }

  const validatedFields = registerSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Données invalides." };
  }

  const ip = getClientIp(await headers());
  const { allowed } = await checkRateLimit("register", ip);
  if (!allowed) {
    return { error: "Trop de tentatives d'inscription. Réessayez plus tard." };
  }

  const name = validatedFields.data.name.trim();
  const email = validatedFields.data.email.trim().toLowerCase();
  const { password } = validatedFields.data;

  const supabase = (await createAdminClient()) as unknown as SupabaseClient<Database>;
  let userId: string | null = null;
  let ownerId: string | null = null;

  const rollback = async () => {
    if (ownerId) await supabase.from("owners").delete().eq("id", ownerId);
    if (userId) {
      await supabase.from("users").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
    }
  };

  try {
    // 1. Compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      return { error: REGISTER_FAILED };
    }
    // Email déjà utilisé : selon la config Supabase, signUp renvoie un
    // utilisateur factice sans identité plutôt qu'une erreur.
    if (authData.user.identities && authData.user.identities.length === 0) {
      return { error: REGISTER_FAILED };
    }
    userId = authData.user.id;

    // 2. Fiche utilisateur
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email,
      name,
      establishment_id: SYSTEM_ESTABLISHMENT_ID,
      is_active: true,
      email_verified: false,
    });
    if (userError) throw userError;

    // 3. Profil propriétaire
    const { data: owner, error: ownerError } = await supabase
      .from("owners")
      .insert({ user_id: userId, name, email, status: "active" })
      .select("id")
      .single();
    if (ownerError || !owner) throw ownerError ?? new Error("owner insert returned no row");
    ownerId = owner.id;

    // 4. Rôle propriétaire (obligatoire : sans rôle le compte serait inutilisable)
    const { data: role, error: roleLookupError } = await supabase
      .from("roles")
      .select("id")
      .eq("slug", "owner")
      .eq("is_system", true)
      .single();
    if (roleLookupError || !role) throw roleLookupError ?? new Error("system role 'owner' not found");

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: role.id,
      establishment_id: SYSTEM_ESTABLISHMENT_ID,
    });
    if (roleError) throw roleError;

    return { success: true, message: "Inscription réussie. Vous pouvez vous connecter." };
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "register" } });
    console.error("[register] Échec de l'inscription:", error);
    await rollback().catch((e) => console.error("[register] Échec du rollback:", e));
    return { error: REGISTER_FAILED };
  }
}

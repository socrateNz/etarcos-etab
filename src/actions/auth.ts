"use server";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@/schemas/auth";
import { AuthUser, SystemRole } from "@/types/auth";
import { getPermissionsForRole } from "@/types/permissions";

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

/**
 * Action d'inscription initiale d'un propriétaire
 */
export async function registerAction(values: RegisterInput) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Données invalides." };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const supabase = (await createAdminClient()) as any;

    // 1. Sign up user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Erreur lors de la création du compte." };
    }

    const defaultEstId = "00000000-0000-0000-0000-000000000000";

    // 2. Insert Owner profile
    const { data: owner, error: ownerError } = await supabase
      .from("owners")
      .insert({
        user_id: authData.user.id,
        name,
        email,
        status: "active",
      })
      .select()
      .single();

    if (ownerError) {
      return { error: "Erreur lors de la création du profil propriétaire." };
    }

    // 3. Create system user record
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      name,
      establishment_id: defaultEstId,
      is_active: true,
      email_verified: false,
    });

    if (userError) {
      return { error: "Erreur lors de la création de la fiche utilisateur." };
    }

    // 4. Assign Owner role
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("slug", "owner")
      .eq("is_system", true)
      .single();

    if (role) {
      await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role_id: role.id,
        establishment_id: defaultEstId,
      });
    }

    return { success: true, message: "Inscription réussie. Vous pouvez vous connecter." };
  } catch (error) {
    return { error: "Erreur lors de l'enregistrement." };
  }
}

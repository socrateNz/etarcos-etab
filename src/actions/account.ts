"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth/config";
import type { Database } from "@/types/supabase";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  createResetToken,
  generateResetNonce,
  nonceMatches,
  verifyResetToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/auth/reset-token";
import { sendPasswordResetLinkEmail } from "@/lib/email";

// Client service role sans session (jamais partagé avec une session utilisateur).
function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Client anon sans session, uniquement pour vérifier un mot de passe actuel.
function anonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const newPasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe est trop long (72 caractères maximum).");

// --------------------------------------------------------------------------
// Profil
// --------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  // URL renvoyée par /api/upload (Cloudinary) : https uniquement.
  avatar_url: z
    .string()
    .url()
    .max(500)
    .refine((u) => u.startsWith("https://"), "URL de photo invalide.")
    .optional()
    .nullable(),
});

export async function updateMyProfileAction(values: z.input<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorisé." };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const { name, phone, address, avatar_url } = parsed.data;
  const changes: Record<string, string | null> = { name, phone: phone || null, address: address || null };
  if (avatar_url !== undefined) changes.avatar_url = avatar_url;

  try {
    const db = adminClient();
    const { error } = await db
      .from("users")
      .update(changes as never)
      .eq("id", session.user.id);
    if (error) throw error;

    // Garde le nom affiché par Supabase Auth cohérent (sans écraser le reste).
    const { data: authUser } = await db.auth.admin.getUserById(session.user.id);
    await db.auth.admin.updateUserById(session.user.id, {
      user_metadata: { ...(authUser?.user?.user_metadata ?? {}), name },
    });

    return { success: true as const, data: changes };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "updateMyProfile" } });
    return { error: "Impossible d'enregistrer le profil. Réessayez plus tard." };
  }
}

// --------------------------------------------------------------------------
// Changement de mot de passe (connecté)
// --------------------------------------------------------------------------

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis."),
  newPassword: newPasswordSchema,
});

export async function changeMyPasswordAction(values: z.input<typeof changePasswordSchema>) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return { error: "Non autorisé." };

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return { error: "Le nouveau mot de passe doit être différent de l'actuel." };
  }

  const { allowed } = await checkRateLimit("password_change", session.user.id);
  if (!allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };

  try {
    // Vérifie le mot de passe actuel sans toucher à la session NextAuth.
    const { error: signInError } = await anonClient().auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });
    if (signInError) return { error: "Mot de passe actuel incorrect." };

    const db = adminClient();
    const { data: authUser } = await db.auth.admin.getUserById(session.user.id);
    const { error } = await db.auth.admin.updateUserById(session.user.id, {
      password: newPassword,
      user_metadata: { ...(authUser?.user?.user_metadata ?? {}), requires_password_change: false },
    });
    if (error) throw error;

    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "changeMyPassword" } });
    return { error: "Impossible de changer le mot de passe. Réessayez plus tard." };
  }
}

// --------------------------------------------------------------------------
// Mot de passe oublié
// --------------------------------------------------------------------------

/** Réponse identique que le compte existe ou non (pas d'énumération d'emails). */
const RESET_REQUESTED =
  "Si un compte existe pour cette adresse, un email contenant un lien de réinitialisation vient d'être envoyé.";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function requestPasswordResetAction(values: { email: string }) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(values);
  if (!parsed.success) return { error: "Adresse email invalide." };
  const email = parsed.data.email;

  const ip = getClientIp(await headers());
  const { allowed } = await checkRateLimit("password_reset", `${ip}:${email}`);
  if (!allowed) return { error: "Trop de demandes. Réessayez dans quelques minutes." };

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    Sentry.captureMessage("AUTH_SECRET absent : réinitialisation impossible", "error");
    return { error: "Service momentanément indisponible." };
  }

  try {
    const db = adminClient();
    const { data: user } = await db
      .from("users")
      .select("id, name, is_active")
      .eq("email", email)
      .maybeSingle();

    const row = user as { id: string; name: string | null; is_active: boolean | null } | null;
    if (!row || row.is_active === false) return { success: true as const, message: RESET_REQUESTED };

    const { data: authUser, error: getError } = await db.auth.admin.getUserById(row.id);
    if (getError || !authUser?.user) return { success: true as const, message: RESET_REQUESTED };

    // Un nouveau nonce invalide tout lien envoyé précédemment.
    const nonce = generateResetNonce();
    const { error: updError } = await db.auth.admin.updateUserById(row.id, {
      app_metadata: { ...(authUser.user.app_metadata ?? {}), password_reset_nonce: nonce },
    });
    if (updError) throw updError;

    const token = createResetToken({ userId: row.id, nonce }, secret);
    const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    const sent = await sendPasswordResetLinkEmail({
      email,
      name: row.name || email,
      resetUrl,
      minutes: Math.round(RESET_TOKEN_TTL_MS / 60_000),
    });
    if (!sent.sent) {
      Sentry.captureMessage(`Email de réinitialisation non envoyé (${sent.reason})`, "warning");
    }

    return { success: true as const, message: RESET_REQUESTED };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "requestPasswordReset" } });
    return { success: true as const, message: RESET_REQUESTED };
  }
}

const INVALID_LINK = "Ce lien est invalide ou a expiré. Faites une nouvelle demande.";

export async function resetPasswordWithTokenAction(values: { token: string; newPassword: string }) {
  const parsed = z.object({ token: z.string().min(1), newPassword: newPasswordSchema }).safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const ip = getClientIp(await headers());
  const { allowed } = await checkRateLimit("password_reset", `${ip}:token`);
  if (!allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };

  const secret = process.env.AUTH_SECRET;
  const payload = secret ? verifyResetToken(parsed.data.token, secret) : null;
  if (!payload) return { error: INVALID_LINK };

  try {
    const db = adminClient();
    const { data: authUser, error: getError } = await db.auth.admin.getUserById(payload.userId);
    if (getError || !authUser?.user) return { error: INVALID_LINK };

    const appMeta = (authUser.user.app_metadata ?? {}) as Record<string, unknown>;
    if (!nonceMatches(appMeta.password_reset_nonce, payload.nonce)) return { error: INVALID_LINK };

    // Nonce effacé : le lien ne peut servir qu'une fois.
    const { error } = await db.auth.admin.updateUserById(payload.userId, {
      password: parsed.data.newPassword,
      app_metadata: { ...appMeta, password_reset_nonce: null },
      user_metadata: { ...(authUser.user.user_metadata ?? {}), requires_password_change: false },
    });
    if (error) throw error;

    return { success: true as const };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "resetPasswordWithToken" } });
    return { error: "Impossible de réinitialiser le mot de passe. Réessayez plus tard." };
  }
}

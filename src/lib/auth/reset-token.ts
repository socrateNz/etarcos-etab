import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Jetons de réinitialisation de mot de passe, sans table dédiée.
 *
 * Format : base64url(`userId.nonce.exp`) + "." + HMAC-SHA256(payload, secret).
 *
 * - La signature (AUTH_SECRET) empêche de forger un jeton.
 * - `exp` limite sa durée de vie (30 min par défaut).
 * - Le `nonce` est aussi stocké dans `app_metadata` de l'utilisateur
 *   (non modifiable par lui) : il est effacé après usage, ce qui rend le
 *   jeton à usage unique, et une nouvelle demande invalide la précédente.
 */

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export type ResetTokenPayload = { userId: string; nonce: string; exp: number };

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function generateResetNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function createResetToken(
  { userId, nonce }: { userId: string; nonce: string },
  secret: string,
  now: number = Date.now(),
  ttlMs: number = RESET_TOKEN_TTL_MS
): string {
  if (!secret) throw new Error("Secret manquant pour signer le jeton.");
  const payload = `${userId}.${nonce}.${now + ttlMs}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Retourne le contenu du jeton s'il est bien signé et non expiré, sinon null. */
export function verifyResetToken(
  token: string,
  secret: string,
  now: number = Date.now()
): ResetTokenPayload | null {
  if (!secret || typeof token !== "string" || token.length > 512) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  const expected = Buffer.from(sign(encoded, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  const [userId, nonce, expRaw] = decoded.split(".");
  const exp = Number(expRaw);
  if (!userId || !nonce || !Number.isFinite(exp)) return null;
  if (exp <= now) return null;

  return { userId, nonce, exp };
}

/** Comparaison en temps constant du nonce du jeton et de celui stocké. */
export function nonceMatches(stored: unknown, given: string): boolean {
  if (typeof stored !== "string" || stored.length === 0) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

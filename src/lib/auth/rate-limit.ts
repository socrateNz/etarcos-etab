import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Seuils par usage. Chaque bucket a son propre préfixe Redis, donc ses
 * propres compteurs.
 */
const BUCKETS = {
  /** Tentatives de connexion — identifiant typique : `ip:email`. */
  login: { limit: 5, window: "5 m" },
  /** Créations de compte publiques — identifiant : IP. */
  register: { limit: 3, window: "1 h" },
  /** Téléversements de fichiers — identifiant : id utilisateur. */
  upload: { limit: 30, window: "10 m" },
  /** Demandes « mot de passe oublié » — identifiant : `ip:email`. */
  password_reset: { limit: 3, window: "15 m" },
  /** Changement de mot de passe depuis le profil — identifiant : id utilisateur. */
  password_change: { limit: 5, window: "15 m" },
  /** Messages à l'assistant IA (coût Gemini) — identifiant : id utilisateur. */
  ai: { limit: 40, window: "1 h" },
} as const satisfies Record<string, { limit: number; window: `${number} ${"s" | "m" | "h"}` }>;

export type RateLimitBucket = keyof typeof BUCKETS;

let redis: Redis | null | undefined;
const limiters = new Map<RateLimitBucket, Ratelimit>();
let warned = false;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents — " +
          "le rate limiting est désactivé (dégradation gracieuse). " +
          "À configurer avant la mise en production (déploiement serverless)."
      );
      warned = true;
    }
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(bucket: RateLimitBucket): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  let rl = limiters.get(bucket);
  if (!rl) {
    const { limit, window } = BUCKETS[bucket];
    rl = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `etarcos:${bucket}`,
    });
    limiters.set(bucket, rl);
  }
  return rl;
}

/**
 * Rate limiting générique, adossé à Upstash Redis pour fonctionner entre
 * instances serverless (un compteur en mémoire se réinitialiserait par
 * instance).
 *
 * Échec ouvert si Upstash n'est pas configuré ou injoignable : un rate
 * limiter ne doit jamais être la raison pour laquelle des utilisateurs
 * légitimes sont bloqués hors d'une application qui fonctionne.
 */
export async function checkRateLimit(
  bucket: RateLimitBucket,
  identifier: string
): Promise<{ allowed: boolean }> {
  const rl = getLimiter(bucket);
  if (!rl) return { allowed: true };

  try {
    const { success } = await rl.limit(identifier);
    return { allowed: success };
  } catch (err) {
    console.error(`[rate-limit:${bucket}] Upstash indisponible, échec ouvert:`, err);
    return { allowed: true };
  }
}

/** Tentatives de connexion : 5 par fenêtre de 5 min et par identifiant (`ip:email`). */
export function checkLoginRateLimit(identifier: string): Promise<{ allowed: boolean }> {
  return checkRateLimit("login", identifier);
}

/** IP du client derrière le proxy Vercel / un reverse proxy. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

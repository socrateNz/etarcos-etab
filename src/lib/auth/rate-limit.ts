import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;
let warned = false;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents — " +
          "le rate limiting du login est désactivé (dégradation gracieuse). " +
          "À configurer avant la mise en production (déploiement serverless)."
      );
      warned = true;
    }
    limiter = null;
    return limiter;
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "5 m"),
    prefix: "etarcos:login",
  });
  return limiter;
}

/**
 * Rate-limits login attempts (5 per 5 min window per identifier — typically
 * `ip:email`). Backed by Upstash Redis so it works across serverless
 * instances (unlike an in-memory counter, which resets per instance).
 *
 * Degrades gracefully to "always allowed" if Upstash isn't configured yet,
 * or if Upstash itself is unreachable — a rate limiter should never be the
 * reason legitimate users get locked out of a working app.
 */
export async function checkLoginRateLimit(identifier: string): Promise<{ allowed: boolean }> {
  const rl = getLimiter();
  if (!rl) return { allowed: true };

  try {
    const { success } = await rl.limit(identifier);
    return { allowed: success };
  } catch (err) {
    console.error("[rate-limit] Upstash indisponible, échec ouvert:", err);
    return { allowed: true };
  }
}

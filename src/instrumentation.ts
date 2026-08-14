import * as Sentry from "@sentry/nextjs";

// Graceful degradation, same pattern as lib/auth/rate-limit.ts and
// lib/email/mailer.ts: without a DSN, this is a no-op — Sentry is simply
// never initialized, so there's no overhead and nothing to break in
// dev/preview environments that haven't been configured yet.
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
import * as Sentry from "@sentry/nextjs";

// Same graceful-degradation pattern as the server side (see instrumentation.ts):
// no NEXT_PUBLIC_SENTRY_DSN means Sentry is never initialized in the browser.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
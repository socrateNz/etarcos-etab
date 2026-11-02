"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Remplace le layout racine quand celui-ci (ou ses Providers) plante : doit
// définir ses propres <html>/<body> et ne reçoit pas les styles globaux, d'où
// les styles inline volontairement minimalistes.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b0f19",
          color: "#e5e7eb",
          padding: 16,
        }}
      >
        <title>Erreur | Etarcos Etab</title>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>L&apos;application a rencontré un problème</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.6, marginBottom: 24 }}>
            Réessayez dans un instant. Si le problème persiste, contactez le support
            {error.digest ? (
              <>
                {" "}en indiquant le code <code>{error.digest}</code>
              </>
            ) : null}
            .
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "#111827",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

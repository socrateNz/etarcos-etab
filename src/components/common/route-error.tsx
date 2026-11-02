"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorState } from "@/components/common/error-state";

interface RouteErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
  className?: string;
}

/**
 * Contenu partagé des fichiers `error.tsx` : signale l'erreur à Sentry et
 * propose de réessayer. En production, le message des erreurs serveur est
 * masqué par Next.js ; on affiche seulement le `digest` pour le support.
 */
export function RouteError({ error, unstable_retry, className }: RouteErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorState
      className={className}
      title="Une erreur inattendue est survenue"
      description={
        "La page n'a pas pu s'afficher. Réessayez ; si le problème persiste, contactez le support" +
        (error.digest ? ` en indiquant le code ${error.digest}.` : ".")
      }
      onRetry={() => unstable_retry()}
    />
  );
}

"use client";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Composition de tous les providers de l'application.
 * Ordre important : ThemeProvider d'abord (pour ToastProvider).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  );
}

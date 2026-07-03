"use client";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, SystemRole } from "@/types/auth";

/**
 * Hook principal pour accéder à la session et l'utilisateur authentifié.
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const { activeEstablishment, setActiveEstablishment } = useAuthStore();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        image: session.user.image ?? null,
        role: session.user.role as SystemRole,
        establishment_id: session.user.establishment_id ?? null,
        permissions: session.user.permissions ?? [],
        roles: session.user.roles ?? [],
      }
    : null;

  return {
    user,
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    activeEstablishment,
    setActiveEstablishment,
    role: user?.role ?? null,
    permissions: user?.permissions ?? [],
  };
}

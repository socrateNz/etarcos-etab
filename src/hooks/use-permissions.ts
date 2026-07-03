"use client";

import { useAuth } from "./use-auth";
import { hasPermission } from "@/types/permissions";
import type { ModuleKey, ActionKey } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";

/**
 * Hook de vérification des permissions RBAC.
 */
export function usePermissions() {
  const { permissions, role } = useAuth();

  /**
   * Vérifie si l'utilisateur a une permission spécifique.
   */
  function can(module: ModuleKey, action: ActionKey): boolean {
    if (role === "super_admin") return true;
    return hasPermission(permissions, module, action);
  }

  /**
   * Vérifie si l'utilisateur peut accéder à un module (au moins une action).
   */
  function canAccessModule(module: ModuleKey): boolean {
    if (role === "super_admin") return true;
    return permissions.some((p) => p.startsWith(`${module}:`));
  }

  /**
   * Vérifie si l'utilisateur a le rôle indiqué ou un rôle supérieur.
   */
  function hasRole(requiredRole: SystemRole): boolean {
    if (!role) return false;
    const levels: Record<SystemRole, number> = {
      super_admin: 0, owner: 1, director: 2, censor: 3,
      accountant: 4, teacher: 5, secretary: 6, librarian: 7,
      lab_manager: 8, parent: 9, student: 10,
    };
    return levels[role] <= levels[requiredRole];
  }

  /**
   * Vérifie si l'utilisateur est exactement ce rôle.
   */
  function isRole(checkRole: SystemRole): boolean {
    return role === checkRole;
  }

  /**
   * Vérifie plusieurs permissions (toutes requises).
   */
  function canAll(checks: Array<[ModuleKey, ActionKey]>): boolean {
    return checks.every(([module, action]) => can(module, action));
  }

  /**
   * Vérifie plusieurs permissions (au moins une requise).
   */
  function canAny(checks: Array<[ModuleKey, ActionKey]>): boolean {
    return checks.some(([module, action]) => can(module, action));
  }

  return {
    can,
    canAccessModule,
    hasRole,
    isRole,
    canAll,
    canAny,
    role,
    permissions,
    isSuperAdmin: role === "super_admin",
    isOwner: role === "owner",
    isDirector: role === "director",
    isTeacher: role === "teacher",
    isStudent: role === "student",
    isParent: role === "parent",
    isAccountant: role === "accountant",
  };
}

// ==================================================
// Etarcos Etab – Auth Types
// ==================================================

import type { DefaultSession } from "next-auth";
import "next-auth/jwt";
import type { Role, Establishment } from "./database";

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
      role: SystemRole;
      establishment_id: string | null;
      establishment?: Establishment;
      roles: Role[];
      permissions: string[];
      requires_password_change?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: SystemRole;
    establishment_id: string | null;
    requires_password_change?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: SystemRole;
    establishment_id: string | null;
    permissions: string[];
    requires_password_change?: boolean;
  }
}

// ============================================
// SYSTEM ROLES
// ============================================

export type SystemRole =
  | "super_admin"
  | "owner"
  | "director"
  | "censor"
  | "accountant"
  | "teacher"
  | "secretary"
  | "librarian"
  | "lab_manager"
  | "parent"
  | "student";

export const SYSTEM_ROLES: Record<SystemRole, RoleMeta> = {
  super_admin: {
    label: "Super Administrateur",
    description: "Accès total à la plateforme",
    level: 0,
    color: "#ef4444",
    badge: "red",
  },
  owner: {
    label: "Propriétaire",
    description: "Propriétaire d'établissement",
    level: 1,
    color: "#f59e0b",
    badge: "amber",
  },
  director: {
    label: "Directeur",
    description: "Directeur général de l'établissement",
    level: 2,
    color: "#8b5cf6",
    badge: "violet",
  },
  censor: {
    label: "Censeur",
    description: "Directeur des études",
    level: 3,
    color: "#6366f1",
    badge: "indigo",
  },
  accountant: {
    label: "Comptable",
    description: "Gestion financière",
    level: 4,
    color: "#06b6d4",
    badge: "cyan",
  },
  teacher: {
    label: "Enseignant",
    description: "Personnel enseignant",
    level: 5,
    color: "#22c55e",
    badge: "green",
  },
  secretary: {
    label: "Secrétaire",
    description: "Secrétariat et administration",
    level: 6,
    color: "#84cc16",
    badge: "lime",
  },
  librarian: {
    label: "Bibliothécaire",
    description: "Gestion de la bibliothèque",
    level: 7,
    color: "#a855f7",
    badge: "purple",
  },
  lab_manager: {
    label: "Responsable Labo",
    description: "Gestion du laboratoire",
    level: 8,
    color: "#f97316",
    badge: "orange",
  },
  parent: {
    label: "Parent",
    description: "Parent ou tuteur d'élève",
    level: 9,
    color: "#64748b",
    badge: "slate",
  },
  student: {
    label: "Élève",
    description: "Élève inscrit",
    level: 10,
    color: "#94a3b8",
    badge: "slate",
  },
};

export interface RoleMeta {
  label: string;
  description: string;
  level: number;
  color: string;
  badge: string;
}

// ============================================
// AUTH STATE
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: SystemRole;
  establishment_id: string | null;
  establishment?: Establishment;
  permissions: string[];
  roles: Role[];
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: SystemRole;
}

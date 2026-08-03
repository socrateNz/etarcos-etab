// ==================================================
// Etarcos Etab – Permissions & RBAC System
// ==================================================

import type { SystemRole } from "./auth";

// ============================================
// MODULES
// ============================================

export type ModuleKey =
  | "dashboard"
  | "establishments"
  | "users"
  | "owners"
  | "staff"
  | "students"
  | "parents"
  | "classes"
  | "cycles"
  | "tracks"
  | "subjects"
  | "rooms"
  | "timetables"
  | "grades"
  | "exams"
  | "report_cards"
  | "payments"
  | "accounting"
  | "expenses"
  | "revenues"
  | "library"
  | "inventory"
  | "hr"
  | "attendance"
  | "discipline"
  | "documents"
  | "diplomas"
  | "reports"
  | "settings"
  | "ai_assistant"
  | "news";

// ============================================
// ACTIONS
// ============================================

export type ActionKey =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "print"
  | "approve";

// ============================================
// PERMISSION SLUG FORMAT: module:action
// Example: students:create, payments:approve
// ============================================

export type PermissionSlug = `${ModuleKey}:${ActionKey}`;

// ============================================
// ROLE PERMISSION MATRIX
// ============================================

export type RolePermissions = Record<SystemRole, PermissionSlug[]>;

// Full permission wildcard
const ALL_PERMISSIONS: PermissionSlug[] = (
  [
    "dashboard", "establishments", "users", "owners", "staff", "students",
    "parents", "classes", "cycles", "tracks", "subjects", "rooms", "timetables",
    "grades", "exams", "report_cards", "payments", "accounting", "expenses",
    "revenues", "library", "inventory", "hr", "attendance", "discipline",
    "documents", "diplomas", "reports", "settings", "ai_assistant", "news",
  ] as ModuleKey[]
).flatMap((mod) =>
  (["view", "create", "edit", "delete", "export", "print", "approve"] as ActionKey[]).map(
    (action) => `${mod}:${action}` as PermissionSlug
  )
);

export const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: ALL_PERMISSIONS,

  owner: [
    "dashboard:view",
    "establishments:view", "establishments:create", "establishments:edit",
    "users:view", "users:create", "users:edit", "users:delete",
    "staff:view", "staff:create", "staff:edit", "staff:delete",
    "students:view", "students:create", "students:edit",
    "parents:view",
    "classes:view", "classes:create", "classes:edit", "classes:delete",
    "cycles:view", "cycles:create", "cycles:edit", "cycles:delete",
    "tracks:view", "tracks:create", "tracks:edit",
    "subjects:view", "subjects:create", "subjects:edit",
    "payments:view", "payments:approve",
    "accounting:view", "accounting:export",
    "expenses:view", "expenses:create", "expenses:approve",
    "revenues:view",
    "reports:view", "reports:export",
    "settings:view", "settings:edit",
    "hr:view",
    "news:view", "news:create", "news:edit", "news:delete",
  ],

  director: [
    "dashboard:view",
    "establishments:view",
    "users:view", "users:create", "users:edit",
    "staff:view", "staff:create", "staff:edit",
    "students:view", "students:create", "students:edit", "students:delete",
    "parents:view", "parents:create", "parents:edit",
    "classes:view", "classes:create", "classes:edit", "classes:delete",
    "cycles:view", "cycles:create", "cycles:edit", "cycles:delete",
    "tracks:view", "tracks:create", "tracks:edit",
    "subjects:view", "subjects:create", "subjects:edit",
    "rooms:view", "rooms:create", "rooms:edit",
    "timetables:view", "timetables:create", "timetables:edit",
    "grades:view", "grades:create", "grades:edit",
    "exams:view", "exams:create", "exams:edit",
    "report_cards:view", "report_cards:create", "report_cards:edit", "report_cards:print",
    "attendance:view", "attendance:create", "attendance:edit", "attendance:delete",
    "discipline:view", "discipline:create", "discipline:edit",
    "documents:view", "documents:create", "documents:print",
    "diplomas:view", "diplomas:create", "diplomas:print",
    "reports:view", "reports:export", "reports:print",
    "payments:view",
    "library:view",
    "inventory:view",
    "settings:view",
    "hr:view", "hr:create", "hr:edit",
    "news:view", "news:create", "news:edit", "news:delete",
  ],

  censor: [
    "dashboard:view",
    "students:view", "students:edit",
    "parents:view",
    "classes:view", "classes:edit",
    "tracks:view",
    "subjects:view",
    "timetables:view", "timetables:create", "timetables:edit",
    "grades:view", "grades:create", "grades:edit",
    "exams:view", "exams:create", "exams:edit",
    "report_cards:view", "report_cards:create", "report_cards:print",
    "attendance:view", "attendance:create", "attendance:edit", "attendance:delete",
    "discipline:view", "discipline:create", "discipline:edit",
    "documents:view", "documents:print",
    "reports:view", "reports:print",
  ],

  accountant: [
    "dashboard:view",
    "students:view",
    "payments:view", "payments:create", "payments:edit", "payments:export", "payments:print",
    "accounting:view", "accounting:create", "accounting:edit", "accounting:export", "accounting:print",
    "expenses:view", "expenses:create", "expenses:edit", "expenses:export",
    "revenues:view", "revenues:create", "revenues:edit", "revenues:export",
    "reports:view", "reports:export", "reports:print",
  ],

  teacher: [
    "dashboard:view",
    "students:view",
    "classes:view",
    "subjects:view",
    "timetables:view",
    "grades:view", "grades:create", "grades:edit",
    "attendance:view", "attendance:create", "attendance:edit", "attendance:delete",
    "discipline:view", "discipline:create",
  ],

  secretary: [
    "dashboard:view",
    "students:view", "students:create", "students:edit",
    "parents:view", "parents:create", "parents:edit",
    "classes:view",
    "documents:view", "documents:create", "documents:print",
    "payments:view", "payments:create",
    "attendance:view",
  ],

  librarian: [
    "dashboard:view",
    "library:view", "library:create", "library:edit", "library:delete",
    "students:view",
  ],

  lab_manager: [
    "dashboard:view",
    "inventory:view", "inventory:create", "inventory:edit",
    "rooms:view", "rooms:edit",
  ],

  parent: [
    "dashboard:view",
    "students:view",
    "grades:view",
    "report_cards:view", "report_cards:print",
    "attendance:view",
    "payments:view",
    "timetables:view",
    "discipline:view",
  ],

  student: [
    "dashboard:view",
    "grades:view",
    "report_cards:view",
    "timetables:view",
    "attendance:view",
    "library:view",
  ],
};

// ============================================
// PERMISSION HELPERS
// ============================================

export function hasPermission(
  userPermissions: string[],
  module: ModuleKey,
  action: ActionKey
): boolean {
  return userPermissions.includes(`${module}:${action}`);
}

export function getPermissionsForRole(role: SystemRole): PermissionSlug[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function canAccess(role: SystemRole, module: ModuleKey): boolean {
  return ROLE_PERMISSIONS[role]?.some((p) => p.startsWith(`${module}:`)) ?? false;
}

export function isHigherOrEqualRole(role1: SystemRole, role2: SystemRole): boolean {
  const levels: Record<SystemRole, number> = {
    super_admin: 0, owner: 1, director: 2, censor: 3,
    accountant: 4, teacher: 5, secretary: 6, librarian: 7,
    lab_manager: 8, parent: 9, student: 10,
  };
  return levels[role1] <= levels[role2];
}

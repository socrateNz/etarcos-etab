// ==================================================
// Etarcos Etab – Modules Configuration
// ==================================================

import type { ModuleKey, ActionKey } from "@/types/permissions";
import type { SystemRole } from "@/types/auth";

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  path: string;
  group: NavGroup;
  roles: SystemRole[];
  actions: ActionKey[];
  isImplemented: boolean;
  badge?: string;
  isNew?: boolean;
}

export type NavGroup =
  | "overview"
  | "academic"
  | "students"
  | "financial"
  | "administration"
  | "resources"
  | "reports"
  | "system";

export const NAV_GROUPS: Record<NavGroup, { label: string; order: number }> = {
  overview: { label: "Vue d'ensemble", order: 1 },
  academic: { label: "Académique", order: 2 },
  students: { label: "Élèves & Parents", order: 3 },
  financial: { label: "Finance", order: 4 },
  administration: { label: "Administration", order: 5 },
  resources: { label: "Ressources", order: 6 },
  reports: { label: "Rapports & IA", order: 7 },
  system: { label: "Système", order: 8 },
};

export const MODULES: ModuleConfig[] = [
  // ========== OVERVIEW ==========
  {
    key: "dashboard",
    label: "Tableau de bord",
    description: "Vue d'ensemble de l'établissement",
    icon: "LayoutDashboard",
    path: "/dashboard",
    group: "overview",
    roles: ["super_admin", "owner", "director", "censor", "accountant", "teacher", "secretary", "librarian", "lab_manager", "parent", "student"],
    actions: ["view"],
    isImplemented: true,
  },

  // ========== ACADEMIC ==========
  {
    key: "classes",
    label: "Classes",
    description: "Gestion des classes",
    icon: "School",
    path: "/classes",
    group: "academic",
    roles: ["super_admin", "owner", "director", "censor", "secretary", "teacher"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "cycles",
    label: "Cycles & Niveaux",
    description: "Cycles scolaires et niveaux",
    icon: "GitBranch",
    path: "/cycles",
    group: "academic",
    roles: ["super_admin", "owner", "director", "censor"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: true,
  },
  {
    key: "tracks",
    label: "Filières",
    description: "Spécialités et filières d'enseignement",
    icon: "Route",
    path: "/tracks",
    group: "academic",
    roles: ["super_admin", "owner", "director", "censor"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "subjects",
    label: "Matières",
    description: "Programme et matières enseignées",
    icon: "BookOpen",
    path: "/subjects",
    group: "academic",
    roles: ["super_admin", "owner", "director", "censor", "teacher"],
    actions: ["view", "create", "edit"],
    isImplemented: false,
  },
  {
    key: "timetables",
    label: "Emplois du temps",
    description: "Planning hebdomadaire",
    icon: "CalendarDays",
    path: "/timetables",
    group: "academic",
    roles: ["super_admin", "owner", "director", "censor", "teacher", "parent", "student"],
    actions: ["view", "create", "edit", "print"],
    isImplemented: false,
  },
  {
    key: "grades",
    label: "Notes",
    description: "Saisie et consultation des notes",
    icon: "ClipboardList",
    path: "/grades",
    group: "academic",
    roles: ["super_admin", "director", "censor", "teacher", "parent", "student"],
    actions: ["view", "create", "edit", "export", "print"],
    isImplemented: false,
  },
  {
    key: "exams",
    label: "Examens",
    description: "Planification des examens",
    icon: "PenLine",
    path: "/exams",
    group: "academic",
    roles: ["super_admin", "director", "censor", "teacher"],
    actions: ["view", "create", "edit", "print"],
    isImplemented: false,
  },
  {
    key: "report_cards",
    label: "Bulletins",
    description: "Bulletins scolaires",
    icon: "FileText",
    path: "/report-cards",
    group: "academic",
    roles: ["super_admin", "director", "censor", "teacher", "parent", "student"],
    actions: ["view", "create", "edit", "print", "export"],
    isImplemented: false,
    isNew: true,
  },

  // ========== STUDENTS ==========
  {
    key: "students",
    label: "Élèves",
    description: "Dossiers élèves",
    icon: "GraduationCap",
    path: "/students",
    group: "students",
    roles: ["super_admin", "owner", "director", "censor", "secretary", "teacher", "accountant"],
    actions: ["view", "create", "edit", "delete", "export", "print"],
    isImplemented: false,
  },
  {
    key: "parents",
    label: "Parents",
    description: "Contacts parents et tuteurs",
    icon: "Users",
    path: "/parents",
    group: "students",
    roles: ["super_admin", "owner", "director", "censor", "secretary"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "attendance",
    label: "Présences",
    description: "Suivi des présences",
    icon: "CalendarCheck",
    path: "/attendance",
    group: "students",
    roles: ["super_admin", "director", "censor", "teacher", "secretary", "parent", "student"],
    actions: ["view", "create", "edit", "export"],
    isImplemented: false,
  },
  {
    key: "discipline",
    label: "Discipline",
    description: "Conseil de discipline",
    icon: "ShieldAlert",
    path: "/discipline",
    group: "students",
    roles: ["super_admin", "director", "censor", "teacher"],
    actions: ["view", "create", "edit"],
    isImplemented: false,
  },

  // ========== FINANCIAL ==========
  {
    key: "payments",
    label: "Paiements",
    description: "Scolarités et frais",
    icon: "CreditCard",
    path: "/payments",
    group: "financial",
    roles: ["super_admin", "owner", "director", "accountant", "secretary", "parent"],
    actions: ["view", "create", "edit", "approve", "export", "print"],
    isImplemented: false,
  },
  {
    key: "accounting",
    label: "Comptabilité",
    description: "Bilan et journaux comptables",
    icon: "Calculator",
    path: "/accounting",
    group: "financial",
    roles: ["super_admin", "owner", "accountant"],
    actions: ["view", "create", "edit", "export", "print"],
    isImplemented: false,
  },
  {
    key: "expenses",
    label: "Dépenses",
    description: "Suivi des dépenses",
    icon: "TrendingDown",
    path: "/expenses",
    group: "financial",
    roles: ["super_admin", "owner", "director", "accountant"],
    actions: ["view", "create", "edit", "approve", "export"],
    isImplemented: false,
  },
  {
    key: "revenues",
    label: "Recettes",
    description: "Suivi des recettes",
    icon: "TrendingUp",
    path: "/revenues",
    group: "financial",
    roles: ["super_admin", "owner", "accountant"],
    actions: ["view", "create", "edit", "export"],
    isImplemented: false,
  },

  // ========== ADMINISTRATION ==========
  {
    key: "staff",
    label: "Personnel",
    description: "Gestion du personnel",
    icon: "Briefcase",
    path: "/staff",
    group: "administration",
    roles: ["super_admin", "owner", "director"],
    actions: ["view", "create", "edit", "delete", "export"],
    isImplemented: false,
  },
  {
    key: "hr",
    label: "Ressources Humaines",
    description: "RH et congés",
    icon: "UserCog",
    path: "/hr",
    group: "administration",
    roles: ["super_admin", "owner", "director"],
    actions: ["view", "create", "edit", "approve"],
    isImplemented: false,
  },
  {
    key: "rooms",
    label: "Salles",
    description: "Gestion des salles",
    icon: "Building2",
    path: "/rooms",
    group: "administration",
    roles: ["super_admin", "owner", "director", "censor"],
    actions: ["view", "create", "edit"],
    isImplemented: false,
  },
  {
    key: "documents",
    label: "Documents",
    description: "Documents officiels",
    icon: "FolderOpen",
    path: "/documents",
    group: "administration",
    roles: ["super_admin", "director", "censor", "secretary"],
    actions: ["view", "create", "print", "export"],
    isImplemented: false,
  },
  {
    key: "diplomas",
    label: "Diplômes",
    description: "Attestations et diplômes",
    icon: "Award",
    path: "/diplomas",
    group: "administration",
    roles: ["super_admin", "director", "censor", "secretary"],
    actions: ["view", "create", "print"],
    isImplemented: false,
  },

  // ========== RESOURCES ==========
  {
    key: "library",
    label: "Bibliothèque",
    description: "Gestion du fonds documentaire",
    icon: "Library",
    path: "/library",
    group: "resources",
    roles: ["super_admin", "director", "librarian", "student"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "inventory",
    label: "Inventaire",
    description: "Matériel et fournitures",
    icon: "Package",
    path: "/inventory",
    group: "resources",
    roles: ["super_admin", "owner", "director", "lab_manager"],
    actions: ["view", "create", "edit", "export"],
    isImplemented: false,
  },

  // ========== REPORTS & AI ==========
  {
    key: "reports",
    label: "Rapports",
    description: "Statistiques et analyses",
    icon: "BarChart3",
    path: "/reports",
    group: "reports",
    roles: ["super_admin", "owner", "director", "censor", "accountant"],
    actions: ["view", "export", "print"],
    isImplemented: false,
  },
  {
    key: "ai_assistant",
    label: "Assistant IA",
    description: "Intelligence artificielle (Gemini)",
    icon: "Sparkles",
    path: "/ai-assistant",
    group: "reports",
    roles: ["super_admin", "owner", "director"],
    actions: ["view"],
    isImplemented: false,
    isNew: true,
    badge: "Bientôt",
  },

  // ========== SYSTEM ==========
  {
    key: "establishments",
    label: "Établissements",
    description: "Gestion des établissements",
    icon: "Building",
    path: "/establishments",
    group: "system",
    roles: ["super_admin", "owner"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: true,
  },
  {
    key: "users",
    label: "Utilisateurs",
    description: "Comptes et accès",
    icon: "UsersRound",
    path: "/users",
    group: "system",
    roles: ["super_admin", "owner", "director"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "owners",
    label: "Propriétaires",
    description: "Propriétaires d'établissements",
    icon: "Crown",
    path: "/owners",
    group: "system",
    roles: ["super_admin"],
    actions: ["view", "create", "edit", "delete"],
    isImplemented: false,
  },
  {
    key: "settings",
    label: "Paramètres",
    description: "Configuration de l'application",
    icon: "Settings",
    path: "/settings",
    group: "system",
    roles: ["super_admin", "owner", "director"],
    actions: ["view", "edit"],
    isImplemented: false,
  },
];

// Helper: get module by key
export function getModule(key: ModuleKey): ModuleConfig | undefined {
  return MODULES.find((m) => m.key === key);
}

// Helper: get modules by group
export function getModulesByGroup(group: NavGroup): ModuleConfig[] {
  return MODULES.filter((m) => m.group === group);
}

// Helper: get modules accessible by role
export function getModulesForRole(role: SystemRole): ModuleConfig[] {
  return MODULES.filter((m) => m.roles.includes(role));
}

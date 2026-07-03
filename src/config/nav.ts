import { ModuleKey, ActionKey } from "@/types/permissions";
import { SystemRole } from "@/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  moduleKey?: ModuleKey;
  action?: ActionKey;
  roles?: SystemRole[];
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [
      {
        title: "Tableau de bord",
        href: "/dashboard",
        icon: "LayoutDashboard",
        moduleKey: "dashboard",
        action: "view",
      },
    ],
  },
  {
    title: "Académique",
    items: [
      {
        title: "Classes",
        href: "/classes",
        icon: "School",
        moduleKey: "classes",
        action: "view",
      },
      {
        title: "Cycles & Niveaux",
        href: "/cycles",
        icon: "GitBranch",
        moduleKey: "cycles",
        action: "view",
      },
      {
        title: "Filières",
        href: "/tracks",
        icon: "Route",
        moduleKey: "tracks",
        action: "view",
      },
      {
        title: "Matières",
        href: "/subjects",
        icon: "BookOpen",
        moduleKey: "subjects",
        action: "view",
      },
      {
        title: "Emplois du temps",
        href: "/timetables",
        icon: "CalendarDays",
        moduleKey: "timetables",
        action: "view",
      },
      {
        title: "Notes",
        href: "/grades",
        icon: "ClipboardList",
        moduleKey: "grades",
        action: "view",
      },
      {
        title: "Examens",
        href: "/exams",
        icon: "PenLine",
        moduleKey: "exams",
        action: "view",
      },
      {
        title: "Bulletins",
        href: "/report-cards",
        icon: "FileText",
        moduleKey: "report_cards",
        action: "view",
      },
    ],
  },
  {
    title: "Élèves & Parents",
    items: [
      {
        title: "Élèves",
        href: "/students",
        icon: "GraduationCap",
        moduleKey: "students",
        action: "view",
      },
      {
        title: "Parents",
        href: "/parents",
        icon: "Users",
        moduleKey: "parents",
        action: "view",
      },
      {
        title: "Présences",
        href: "/attendance",
        icon: "CalendarCheck",
        moduleKey: "attendance",
        action: "view",
      },
      {
        title: "Discipline",
        href: "/discipline",
        icon: "ShieldAlert",
        moduleKey: "discipline",
        action: "view",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        title: "Paiements",
        href: "/payments",
        icon: "CreditCard",
        moduleKey: "payments",
        action: "view",
      },
      {
        title: "Comptabilité",
        href: "/accounting",
        icon: "Calculator",
        moduleKey: "accounting",
        action: "view",
      },
      {
        title: "Dépenses",
        href: "/expenses",
        icon: "TrendingDown",
        moduleKey: "expenses",
        action: "view",
      },
      {
        title: "Recettes",
        href: "/revenues",
        icon: "TrendingUp",
        moduleKey: "revenues",
        action: "view",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Personnel",
        href: "/staff",
        icon: "Briefcase",
        moduleKey: "staff",
        action: "view",
      },
      {
        title: "RH",
        href: "/hr",
        icon: "UserCog",
        moduleKey: "hr",
        action: "view",
      },
      {
        title: "Salles",
        href: "/rooms",
        icon: "Building2",
        moduleKey: "rooms",
        action: "view",
      },
      {
        title: "Documents",
        href: "/documents",
        icon: "FolderOpen",
        moduleKey: "documents",
        action: "view",
      },
      {
        title: "Diplômes",
        href: "/diplomas",
        icon: "Award",
        moduleKey: "diplomas",
        action: "view",
      },
    ],
  },
  {
    title: "Ressources & Rapports",
    items: [
      {
        title: "Bibliothèque",
        href: "/library",
        icon: "Library",
        moduleKey: "library",
        action: "view",
      },
      {
        title: "Inventaire",
        href: "/inventory",
        icon: "Package",
        moduleKey: "inventory",
        action: "view",
      },
      {
        title: "Rapports",
        href: "/reports",
        icon: "BarChart3",
        moduleKey: "reports",
        action: "view",
      },
      {
        title: "Assistant IA",
        href: "/ai-assistant",
        icon: "Sparkles",
        moduleKey: "ai_assistant",
        action: "view",
        badge: "Bientôt",
      },
    ],
  },
  {
    title: "Système",
    items: [
      {
        title: "Établissements",
        href: "/establishments",
        icon: "Building",
        moduleKey: "establishments",
        action: "view",
      },
      {
        title: "Utilisateurs",
        href: "/users",
        icon: "UsersRound",
        moduleKey: "users",
        action: "view",
      },
      {
        title: "Paramètres",
        href: "/settings",
        icon: "Settings",
        moduleKey: "settings",
        action: "view",
      },
    ],
  },
];

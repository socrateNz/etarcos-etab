"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, School, BookOpen, CalendarDays,
  ClipboardList, PenLine, FileText, GraduationCap, Users,
  CalendarCheck, ShieldAlert, CreditCard, Calculator,
  TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles,
  Building, UsersRound, Crown, Settings, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Zap, Bell, HelpCircle, Megaphone,
  FileCode, LogOut, GitBranch, Route, Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebarStore } from "@/store/sidebar-store";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { MODULES, NAV_GROUPS, type NavGroup } from "@/config/modules";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons mapping for standard modules
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, School, BookOpen, CalendarDays,
  ClipboardList, PenLine, FileText, GraduationCap, Users,
  CalendarCheck, ShieldAlert, CreditCard, Calculator,
  TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles,
  Building, UsersRound, Crown, Settings, Bell, HelpCircle, Megaphone, FileCode,
  GitBranch, Route
};

// Variants
const sidebarVariants = {
  expanded: { width: 256, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
  collapsed: { width: 60, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

const textVariants = {
  expanded: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.2 } },
  collapsed: { opacity: 0, x: -10, transition: { duration: 0.1 } },
};

// Super Admin Menu Structure Specification
const SUPER_ADMIN_NAV = [
  {
    group: "PLATEFORME",
    items: [
      { key: "sa-dash", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    group: "LOCATAIRES",
    items: [
      { key: "sa-est", label: "Établissements", path: "/establishments", icon: School },
      { key: "sa-own", label: "Propriétaires", path: "/owners", icon: Building },
      { key: "sa-usr", label: "Utilisateurs", path: "/users", icon: Users },
    ]
  },
  {
    group: "COMMERCIAL",
    items: [
      { key: "sa-subs", label: "Abonnements", path: "/settings", icon: Crown },
      { key: "sa-tx", label: "Transactions", path: "/payments", icon: CreditCard },
      { key: "sa-anal", label: "Analyses", path: "/reports", icon: BarChart3 },
    ]
  },
  {
    group: "MAINTENANCE",
    items: [
      { key: "sa-ai", label: "Etarcos IA", path: "/ai-assistant", icon: Sparkles },
      { key: "sa-notif", label: "Notifications", path: "/notifications", icon: Bell },
      { key: "sa-supp", label: "Support Tickets", path: "/support", icon: HelpCircle },
      { key: "sa-news", label: "Actualités", path: "/news", icon: Megaphone },
      { key: "sa-sett", label: "Paramètres", path: "/settings", icon: Settings },
      { key: "sa-logs", label: "Journaux & Audit", path: "/logs", icon: FileText },
    ]
  }
];

const OWNER_NAV = [
  {
    group: "PLATEFORME",
    items: [
      { key: "own-dash", label: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    group: "LOCATAIRES",
    items: [
      {
        key: "own-est",
        label: "Mes établissements",
        icon: School,
        subItems: [
          { key: "own-est-all", label: "Tous les établissements", path: "/establishments" },
          { key: "own-est-add", label: "Ajouter un établissement", path: "/establishments?action=create" },
          { key: "own-est-change", label: "Changer d'établissement", path: "/dashboard?action=change-etab" },
        ]
      }
    ]
  },
  {
    group: "PERSONNEL",
    items: [
      {
        key: "own-staff",
        label: "Personnel",
        icon: Users,
        subItems: [
          { key: "own-staff-dir", label: "Directeurs", path: "/staff?role=director" },
          { key: "own-staff-adm", label: "Administrateurs", path: "/staff?role=admin" },
          { key: "own-staff-acc", label: "Comptables", path: "/staff?role=accountant" },
          { key: "own-staff-tch", label: "Enseignants", path: "/staff?role=teacher" },
          { key: "own-staff-oth", label: "Autres employés", path: "/staff?role=other" },
        ]
      },
      {
        key: "own-stud",
        label: "Élèves",
        icon: GraduationCap,
        subItems: [
          { key: "own-stud-eff", label: "Effectif", path: "/students" },
          { key: "own-stud-adm", label: "Admissions", path: "/students?tab=admissions" },
          { key: "own-stud-stat", label: "Statistiques", path: "/students?tab=stats" },
        ]
      }
    ]
  },
  {
    group: "ACADÉMIQUE",
    items: [
      {
        key: "own-acad",
        label: "Académique",
        icon: BookOpen,
        subItems: [
          { key: "own-acad-years", label: "Années scolaires", path: "/cycles" },
          { key: "own-acad-cls", label: "Classes", path: "/classes" },
          { key: "own-acad-sub", label: "Matières", path: "/subjects" },
          { key: "own-acad-time", label: "Emplois du temps", path: "/timetables" },
          { key: "own-acad-cards", label: "Bulletins", path: "/report-cards" },
          { key: "own-acad-res", label: "Résultats", path: "/grades" },
        ]
      }
    ]
  },
  {
    group: "FINANCES",
    items: [
      {
        key: "own-fin",
        label: "Finances",
        icon: CreditCard,
        subItems: [
          { key: "own-fin-dash", label: "Tableau financier", path: "/accounting" },
          { key: "own-fin-pay", label: "Paiements", path: "/payments" },
          { key: "own-fin-exp", label: "Dépenses", path: "/expenses" },
          { key: "own-fin-rev", label: "Recettes", path: "/revenues" },
          { key: "own-fin-sal", label: "Salaires", path: "/hr" },
          { key: "own-fin-rep", label: "Rapports financiers", path: "/reports?tab=financial" },
        ]
      }
    ]
  },
  {
    group: "RESSOURCES",
    items: [
      {
        key: "own-res",
        label: "Ressources",
        icon: Package,
        subItems: [
          { key: "own-res-inv", label: "Inventaire", path: "/inventory" },
          { key: "own-res-lib", label: "Bibliothèque", path: "/library" },
          { key: "own-res-rooms", label: "Salles", path: "/rooms" },
          { key: "own-res-eq", label: "Équipements", path: "/inventory?tab=equipments" },
        ]
      }
    ]
  },
  {
    group: "RAPPORTS",
    items: [
      {
        key: "own-rep",
        label: "Rapports",
        icon: BarChart3,
        subItems: [
          { key: "own-rep-acad", label: "Académiques", path: "/reports?tab=academic" },
          { key: "own-rep-fin", label: "Financiers", path: "/reports?tab=financial" },
          { key: "own-rep-rh", label: "RH", path: "/reports?tab=hr" },
          { key: "own-rep-att", label: "Fréquentation", path: "/reports?tab=attendance" },
          { key: "own-rep-ai", label: "IA", path: "/reports?tab=ai" },
        ]
      }
    ]
  },
  {
    group: "ASSISTANT & INFOS",
    items: [
      { key: "own-ai", label: "Assistant IA", path: "/ai-assistant", icon: Sparkles },
      { key: "own-notif", label: "Notifications", path: "/notifications", icon: Bell },
      {
        key: "own-sett",
        label: "Paramètres",
        icon: Settings,
        subItems: [
          { key: "own-sett-acc", label: "Mon compte", path: "/settings?tab=account" },
          { key: "own-sett-owners", label: "Mes propriétaires", path: "/settings?tab=owners" },
          { key: "own-sett-sub", label: "Mon abonnement", path: "/settings?tab=subscription" },
          { key: "own-sett-brand", label: "Branding", path: "/settings?tab=branding" },
          { key: "own-sett-custom", label: "Personnalisation", path: "/settings?tab=customization" },
          { key: "own-sett-sec", label: "Sécurité", path: "/settings?tab=security" },
        ]
      },
      { key: "own-supp", label: "Support", path: "/support", icon: HelpCircle },
    ]
  }
];

const DIRECTOR_NAV = [
  {
    group: "VUE D'ENSEMBLE",
    items: [
      { key: "dir-dash", label: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    group: "MON ÉTABLISSEMENT",
    items: [
      { key: "dir-staff", label: "Personnel & RH", path: "/staff", icon: Users },
      { key: "dir-rooms", label: "Infrastructures & Salles", path: "/rooms", icon: Building2 },
    ]
  },
  {
    group: "ÉLÈVES & PARENTS",
    items: [
      { key: "dir-stud", label: "Élèves", path: "/students", icon: GraduationCap },
      { key: "dir-parents", label: "Parents", path: "/parents", icon: Users },
      { key: "dir-att", label: "Présences & Retards", path: "/attendance", icon: CalendarCheck },
      { key: "dir-disc", label: "Discipline", path: "/discipline", icon: ShieldAlert },
    ]
  },
  {
    group: "ACADÉMIQUE",
    items: [
      { key: "dir-cls", label: "Classes", path: "/classes", icon: School },
      { key: "dir-cycles", label: "Cycles & Niveaux", path: "/cycles", icon: GitBranch },
      { key: "dir-tracks", label: "Filières / Séries", path: "/tracks", icon: Route },
      { key: "dir-sub", label: "Matières", path: "/subjects", icon: BookOpen },
      { key: "dir-time", label: "Emplois du temps", path: "/timetables", icon: CalendarDays },
      { key: "dir-grades", label: "Notes & Examens", path: "/grades", icon: ClipboardList },
      { key: "dir-cards", label: "Bulletins scolaires", path: "/report-cards", icon: FileText },
      { key: "dir-docs", label: "Documents & Diplômes", path: "/documents", icon: FolderOpen },
    ]
  },
  {
    group: "FINANCES (SUIVI)",
    items: [
      { key: "dir-pay", label: "Paiements", path: "/payments", icon: CreditCard },
      { key: "dir-exp", label: "Dépenses", path: "/expenses", icon: TrendingDown },
    ]
  },
  {
    group: "RESSOURCES & RAPPORTS",
    items: [
      { key: "dir-inv", label: "Inventaire", path: "/inventory", icon: Package },
      { key: "dir-lib", label: "Bibliothèque", path: "/library", icon: Library },
      { key: "dir-rep", label: "Rapports & Bilans", path: "/reports", icon: BarChart3 },
      { key: "dir-ai", label: "Assistant IA", path: "/ai-assistant", icon: Sparkles },
      { key: "dir-sett", label: "Paramètres", path: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const isOwner = session?.user?.role === "owner";
  const isDirector = session?.user?.role === "director";

  const currentNav = isSuperAdmin ? SUPER_ADMIN_NAV : isOwner ? OWNER_NAV : isDirector ? DIRECTOR_NAV : null;

  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  const toggleSubMenu = (key: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  useEffect(() => {
    const parent = OWNER_NAV.flatMap((g) => g.items).find((item) =>
      item.subItems?.some(
        (sub) =>
          pathname === sub.path ||
          pathname.startsWith(sub.path + "?") ||
          pathname.startsWith(sub.path + "/")
      )
    );
    if (parent && !openSubMenus.includes(parent.key)) {
      setOpenSubMenus((prev) => [...prev, parent.key]);
    }
  }, [pathname]);

  const { isCollapsed, toggleCollapsed, expandedGroups, toggleGroup } = useSidebarStore();
  const { canAccessModule } = usePermissions();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter accessible modules for standard view
  const accessibleModules = MODULES.filter((m) => canAccessModule(m.key));

  // Group modules for standard view
  const groupedModules = Object.entries(NAV_GROUPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([groupKey, groupMeta]) => ({
      key: groupKey as NavGroup,
      label: groupMeta.label,
      modules: accessibleModules.filter((m) => m.group === groupKey),
    }))
    .filter((g) => g.modules.length > 0);

  return (
    <TooltipProvider delay={0}>
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        className="relative flex flex-col h-screen border-r border-sidebar-border bg-sidebar-background overflow-hidden flex-shrink-0 z-30"
        style={{ backgroundColor: "hsl(var(--sidebar-background))" }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b border-sidebar-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-sidebar-background" />
            </div>
            <motion.div
              variants={textVariants}
              animate={isCollapsed ? "collapsed" : "expanded"}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-sidebar-foreground leading-none">Etarcos</p>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Etab Platform</p>
            </motion.div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {currentNav ? (
            /* Render Structured Role Menu (Super Admin, Owner, Director) */
            currentNav.map((group) => (
              <div key={group.group} className="mb-4">
                {!isCollapsed && (
                  <div className="px-4 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/70">
                    {group.group}
                  </div>
                )}
                {group.items.map((item: any) => {
                  const Icon = item.icon;
                  const hasSubItems = !!item.subItems;
                  const isSubOpen = openSubMenus.includes(item.key);
                  const isParentActive = item.subItems
                    ? item.subItems.some((sub: any) => pathname === sub.path || pathname.startsWith(sub.path + "?") || pathname.startsWith(sub.path + "/"))
                    : pathname === item.path;

                  const itemContent = hasSubItems ? (
                    <button
                      onClick={() => toggleSubMenu(item.key)}
                      className={cn(
                        "flex items-center justify-between w-[calc(100%-16px)] mx-2 px-2 py-2 rounded-lg transition-all duration-150 group relative text-left",
                        isParentActive
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        isSubOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                        )
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.path!}
                      className={cn(
                        "flex items-center gap-3 mx-2 px-2 py-2 rounded-lg transition-all duration-150 group relative",
                        isParentActive
                          ? "bg-primary text-primary-foreground shadow-brand-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );

                  return (
                    <div key={item.key} className="flex flex-col gap-0.5">
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger render={itemContent} />
                          <TooltipContent side="right" className="font-medium">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        itemContent
                      )}

                      {/* Submenu Items */}
                      {!isCollapsed && hasSubItems && isSubOpen && (
                        <div className="flex flex-col pl-9 pr-2 py-0.5 gap-0.5 border-l border-sidebar-border/30 ml-4 animate-in slide-in-from-top-1 duration-150">
                          {item.subItems!.map((sub: any) => {
                            const isSubActive = pathname === sub.path || pathname.startsWith(sub.path + "?");
                            return (
                              <Link
                                key={sub.key}
                                href={sub.path}
                                className={cn(
                                  "text-xs py-1.5 px-2 rounded-md transition-colors font-medium truncate",
                                  isSubActive
                                    ? "text-primary bg-primary/5 font-semibold"
                                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            /* Render Standard School Menu */
            groupedModules.map(({ key: groupKey, label, modules }) => (
              <div key={groupKey} className="mb-1">
                {/* Group header */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between px-3 py-1.5 mb-1"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                      {label}
                    </span>
                    {expandedGroups.includes(groupKey) ? (
                      <ChevronDown className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                )}

                {/* Group items */}
                <AnimatePresence initial={false}>
                  {(isCollapsed || expandedGroups.includes(groupKey)) && (
                    <motion.div
                      initial={!isCollapsed ? { opacity: 0, height: 0 } : {}}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={!isCollapsed ? { opacity: 0, height: 0 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      {modules.map((module) => {
                        const Icon = ICON_MAP[module.icon] ?? LayoutDashboard;
                        const isActive =
                          pathname === module.path ||
                          pathname.startsWith(`${module.path}/`);

                        const itemContent = (
                          <Link
                            href={module.path}
                            className={cn(
                              "flex items-center gap-3 mx-2 px-2 py-2 rounded-lg transition-all duration-150 group relative",
                              isActive
                                ? "bg-primary text-white font-bold shadow-brand-sm"
                                : "text-slate-700 dark:text-slate-300 font-medium hover:bg-sidebar-accent hover:text-slate-900 dark:hover:text-white",
                              !module.isImplemented && "opacity-75"
                            )}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"
                              />
                            )}

                            <Icon
                              className={cn(
                                "w-4 h-4 flex-shrink-0",
                                isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
                              )}
                            />

                            <motion.div
                              variants={textVariants}
                              animate={isCollapsed ? "collapsed" : "expanded"}
                              className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
                            >
                              <span className="text-sm font-medium truncate">
                                {module.label}
                              </span>
                              {module.badge && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-[9px] py-0 px-1.5 h-4"
                                >
                                  {module.badge}
                                </Badge>
                              )}
                              {module.isNew && !module.badge && (
                                <Badge className="ml-2 text-[9px] py-0 px-1.5 h-4 bg-cyan-500/20 text-cyan-400 border-0">
                                  Nouveau
                                </Badge>
                              )}
                            </motion.div>
                          </Link>
                        );

                        if (isCollapsed) {
                          return (
                            <Tooltip key={module.key}>
                              <TooltipTrigger render={itemContent} />
                              <TooltipContent side="right" className="font-medium">
                                {module.label}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return <div key={module.key}>{itemContent}</div>;
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Separator between groups */}
                {!isCollapsed && (
                  <div className="mx-3 mt-2 mb-1 border-t border-sidebar-border/50" />
                )}
              </div>
            ))
          )}
        </nav>

        {/* Footer actions: Theme Toggle & Collapse button */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {/* Theme Toggle Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all cursor-pointer"
                />
              }
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              )}
              <motion.span
                variants={textVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                className="text-xs font-semibold overflow-hidden whitespace-nowrap"
              >
                {mounted && theme === "dark" ? "Mode Clair" : "Mode Sombre"}
              </motion.span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {mounted && theme === "dark" ? "Basculer en Mode Clair" : "Basculer en Mode Sombre"}
            </TooltipContent>
          </Tooltip>

          {/* Collapse toggle button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={toggleCollapsed}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all cursor-pointer"
                />
              }
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
              )}
              <motion.span
                variants={textVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                className="text-xs font-semibold overflow-hidden whitespace-nowrap"
              >
                Réduire
              </motion.span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Étendre la barre" : "Réduire la barre"}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, School, BookOpen, CalendarDays, ClipboardList, PenLine,
  FileText, GraduationCap, Users, CalendarCheck, ShieldAlert, CreditCard,
  Calculator, TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles, Building,
  UsersRound, Crown, Settings, GitBranch, Route, User, Moon, Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODULES, NAV_GROUPS, type NavGroup } from "@/config/modules";
import { usePermissions } from "@/hooks/use-permissions";
import { useUIStore } from "@/store/ui-store";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, School, BookOpen, CalendarDays, ClipboardList, PenLine,
  FileText, GraduationCap, Users, CalendarCheck, ShieldAlert, CreditCard,
  Calculator, TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles, Building,
  UsersRound, Crown, Settings, GitBranch, Route,
};

const QUICK_ACTIONS = [
  { label: "Mon profil", path: "/profile", icon: User },
  { label: "Paramètres", path: "/settings", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isCommandOpen, setCommandOpen } = useUIStore();
  const { canAccessModule } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accessibleModules = MODULES.filter((m) => canAccessModule(m.key));

  const groupedModules = Object.entries(NAV_GROUPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([groupKey, groupMeta]) => ({
      key: groupKey as NavGroup,
      label: groupMeta.label,
      modules: accessibleModules.filter((m) => m.group === groupKey),
    }))
    .filter((g) => g.modules.length > 0);

  function navigate(path: string) {
    setCommandOpen(false);
    router.push(path);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
    setCommandOpen(false);
  }

  return (
    <Dialog open={isCommandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Palette de commandes</DialogTitle>
          <DialogDescription>
            Rechercher un module ou une action
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Rechercher un module, une page ou une action…" />
          <CommandList>
            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

            <CommandGroup heading="Actions rapides">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.path}
                    value={action.label}
                    onSelect={() => navigate(action.path)}
                  >
                    <Icon className="size-4" />
                    {action.label}
                  </CommandItem>
                );
              })}
              <CommandItem value="Basculer le thème" onSelect={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
                <CommandShortcut>⌘T</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {groupedModules.map((group) => (
              <CommandGroup key={group.key} heading={group.label}>
                {group.modules.map((module) => {
                  const Icon = ICON_MAP[module.icon] ?? LayoutDashboard;
                  return (
                    <CommandItem
                      key={module.key}
                      value={`${module.label} ${module.description}`}
                      onSelect={() => navigate(module.path)}
                    >
                      <Icon className="size-4" />
                      <span>{module.label}</span>
                      {module.badge && (
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {module.badge}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

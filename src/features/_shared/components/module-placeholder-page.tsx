"use client";

import {
  LayoutDashboard, School, BookOpen, CalendarDays, ClipboardList, PenLine,
  FileText, GraduationCap, Users, CalendarCheck, ShieldAlert, CreditCard,
  Calculator, TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles, Building,
  UsersRound, Crown, Settings, GitBranch, Route,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { getModule } from "@/config/modules";
import type { ModuleKey } from "@/types/permissions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, School, BookOpen, CalendarDays, ClipboardList, PenLine,
  FileText, GraduationCap, Users, CalendarCheck, ShieldAlert, CreditCard,
  Calculator, TrendingDown, TrendingUp, Briefcase, UserCog, Building2,
  FolderOpen, Award, Library, Package, BarChart3, Sparkles, Building,
  UsersRound, Crown, Settings, GitBranch, Route,
};

interface ModulePlaceholderPageProps {
  moduleKey: ModuleKey;
}

/**
 * Page coquille standard pour les modules non encore implémentés (Phase 2).
 */
export function ModulePlaceholderPage({ moduleKey }: ModulePlaceholderPageProps) {
  const module = getModule(moduleKey);

  if (!module) {
    return null;
  }

  const Icon = (ICON_MAP[module.icon] ?? LayoutDashboard) as LucideIcon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.label}
        description={module.description}
        icon={Icon}
        actions={
          module.badge ? (
            <Badge variant="secondary">{module.badge}</Badge>
          ) : undefined
        }
      />

      <div className="bg-card rounded-xl border border-border">
        <EmptyState
          icon={Icon}
          title={`${module.label} – Phase 2`}
          description="Ce module est configuré (navigation, permissions RBAC, schéma Supabase). Le développement métier complet débutera en Phase 2."
        />
      </div>
    </div>
  );
}

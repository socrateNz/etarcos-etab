import type { EstablishmentPlan, EstablishmentStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ESTABLISHMENT_PLAN_LABELS,
  ESTABLISHMENT_STATUS_LABELS,
} from "../types";

const STATUS_STYLES: Record<EstablishmentStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/15 text-destructive border-destructive/20",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/20",
};

const PLAN_STYLES: Record<EstablishmentPlan, string> = {
  free: "bg-slate-500/10 text-slate-600",
  starter: "bg-cyan-500/15 text-cyan-600",
  professional: "bg-brand-500/15 text-brand-600",
  enterprise: "bg-violet-500/15 text-violet-600",
};

export function EstablishmentStatusBadge({
  status,
  className,
}: {
  status: EstablishmentStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize border", STATUS_STYLES[status], className)}
    >
      {ESTABLISHMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function EstablishmentPlanBadge({
  plan,
  className,
}: {
  plan: EstablishmentPlan;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 capitalize", PLAN_STYLES[plan], className)}
    >
      {ESTABLISHMENT_PLAN_LABELS[plan]}
    </Badge>
  );
}

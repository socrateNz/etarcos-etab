import type {
  Establishment,
  EstablishmentPlan,
  EstablishmentStatus,
} from "@/types/database";

export type { Establishment, EstablishmentPlan, EstablishmentStatus };

export interface EstablishmentListItem extends Establishment {
  owners_count?: number;
}

export interface EstablishmentsListResult {
  data: EstablishmentListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export const ESTABLISHMENT_STATUS_LABELS: Record<EstablishmentStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  pending: "En attente",
};

export const ESTABLISHMENT_PLAN_LABELS: Record<EstablishmentPlan, string> = {
  free: "Gratuit",
  starter: "Starter",
  professional: "Professionnel",
  enterprise: "Entreprise",
};

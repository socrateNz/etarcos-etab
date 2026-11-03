import type { SystemRole } from "@/types/auth";

export type TicketStatus = "open" | "pending" | "resolved";
export type TicketCategory = "bug" | "question" | "billing" | "feature" | "other";

export type SupportTicket = {
  id: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  establishment_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: { name: string | null; email: string | null } | null;
  establishment?: { name: string | null } | null;
};

export type SupportTicketMessage = {
  id: string;
  body: string;
  is_staff_reply: boolean;
  created_at: string;
  author?: { name: string | null } | null;
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Ouvert",
  pending: "En attente de votre réponse",
  resolved: "Résolu",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug: "Problème technique",
  question: "Question d'utilisation",
  billing: "Facturation / abonnement",
  feature: "Suggestion",
  other: "Autre",
};

/**
 * Le support plateforme sert le personnel des établissements. Les parents
 * et élèves s'adressent à leur établissement ; le super-admin répond.
 */
export function canOpenTickets(role: SystemRole | undefined | null): boolean {
  return !!role && role !== "super_admin" && role !== "parent" && role !== "student";
}

type Viewer = { userId: string; role: SystemRole; establishmentId: string | null };
type TicketOwnerFields = { created_by: string; establishment_id: string | null };

/** Super-admin : tout. Directeur : son établissement. Autres : leurs tickets. */
export function canAccessTicket(viewer: Viewer, ticket: TicketOwnerFields): boolean {
  if (viewer.role === "super_admin") return true;
  if (!canOpenTickets(viewer.role)) return false;
  if (ticket.created_by === viewer.userId) return true;
  return (
    viewer.role === "director" &&
    !!viewer.establishmentId &&
    ticket.establishment_id === viewer.establishmentId
  );
}

/** Réponse du support → en attente du demandeur ; réponse du demandeur → rouvert. */
export function nextStatusAfterReply(isStaffReply: boolean): TicketStatus {
  return isStaffReply ? "pending" : "open";
}

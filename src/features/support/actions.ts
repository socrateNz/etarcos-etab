"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import type { SystemRole } from "@/types/auth";
import {
  canAccessTicket,
  canOpenTickets,
  nextStatusAfterReply,
  type SupportTicket,
  type SupportTicketMessage,
  type TicketStatus,
} from "./rules";

type Result<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const TABLE_MISSING = "Le support n'est pas encore activé sur cette installation (migration 009 à appliquer).";

async function context() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role as SystemRole,
    establishmentId: session.user.establishment_id ?? null,
    name: session.user.name ?? session.user.email ?? "Utilisateur",
    email: session.user.email ?? null,
  };
}

function friendly(err: unknown, action: string): string {
  const code = (err as { code?: string })?.code;
  if (code === "42P01" || code === "PGRST205") return TABLE_MISSING;
  Sentry.captureException(err, { tags: { action } });
  return "Une erreur est survenue. Réessayez plus tard.";
}

const TICKET_COLUMNS =
  "id, reference, subject, category, status, establishment_id, created_by, created_at, updated_at, " +
  "author:users!support_tickets_created_by_fkey(name, email), establishment:establishments(name)";

// --------------------------------------------------------------------------
// Lecture
// --------------------------------------------------------------------------

export async function listSupportTicketsAction(filter?: { status?: TicketStatus | "all" }): Promise<Result<SupportTicket[]>> {
  const ctx = await context();
  if (!ctx) return { error: "Non autorisé." };
  if (ctx.role !== "super_admin" && !canOpenTickets(ctx.role)) return { error: "Permission refusée." };

  try {
    const db = (await createAdminClient()) as any;
    let query = db.from("support_tickets").select(TICKET_COLUMNS).order("updated_at", { ascending: false }).limit(200);

    if (ctx.role === "director" && ctx.establishmentId) {
      // Le directeur voit les tickets de son établissement et les siens.
      query = query.or(`created_by.eq.${ctx.userId},establishment_id.eq.${ctx.establishmentId}`);
    } else if (ctx.role !== "super_admin") {
      query = query.eq("created_by", ctx.userId);
    }
    if (filter?.status && filter.status !== "all") query = query.eq("status", filter.status);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as SupportTicket[] };
  } catch (err) {
    return { error: friendly(err, "listSupportTickets") };
  }
}

export async function getSupportTicketAction(
  id: string
): Promise<Result<{ ticket: SupportTicket; messages: SupportTicketMessage[] }>> {
  const ctx = await context();
  if (!ctx) return { error: "Non autorisé." };
  if (!z.string().uuid().safeParse(id).success) return { error: "Ticket introuvable." };

  try {
    const db = (await createAdminClient()) as any;
    const { data: ticket, error } = await db.from("support_tickets").select(TICKET_COLUMNS).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!ticket || !canAccessTicket(ctx, ticket)) return { error: "Ticket introuvable." };

    const { data: messages, error: msgError } = await db
      .from("support_ticket_messages")
      .select("id, body, is_staff_reply, created_at, author:users(name)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });
    if (msgError) throw msgError;

    return { data: { ticket, messages: (messages ?? []) as SupportTicketMessage[] } };
  } catch (err) {
    return { error: friendly(err, "getSupportTicket") };
  }
}

/** Compteurs pour le tableau de bord super-admin. */
export async function getSupportStatsAction(): Promise<Result<{ open: number; pending: number; resolvedToday: number }>> {
  const ctx = await context();
  if (!ctx || ctx.role !== "super_admin") return { error: "Permission refusée." };
  try {
    const db = (await createAdminClient()) as any;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const head = { count: "exact", head: true } as const;
    const [open, pending, resolved] = await Promise.all([
      db.from("support_tickets").select("id", head).eq("status", "open"),
      db.from("support_tickets").select("id", head).eq("status", "pending"),
      db.from("support_tickets").select("id", head).eq("status", "resolved").gte("updated_at", today.toISOString()),
    ]);
    for (const r of [open, pending, resolved]) if (r.error) throw r.error;
    return { data: { open: open.count ?? 0, pending: pending.count ?? 0, resolvedToday: resolved.count ?? 0 } };
  } catch (err) {
    return { error: friendly(err, "getSupportStats") };
  }
}

// --------------------------------------------------------------------------
// Écriture
// --------------------------------------------------------------------------

const createSchema = z.object({
  subject: z.string().trim().min(3, "Objet trop court.").max(200),
  category: z.enum(["bug", "question", "billing", "feature", "other"]).default("other"),
  body: z.string().trim().min(10, "Décrivez votre demande (10 caractères minimum).").max(5000),
});

export async function createSupportTicketAction(values: z.input<typeof createSchema>): Promise<Result<{ id: string }>> {
  const ctx = await context();
  if (!ctx) return { error: "Non autorisé." };
  if (!canOpenTickets(ctx.role)) return { error: "Permission refusée." };

  const parsed = createSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = (await createAdminClient()) as any;
    const { data: ticket, error } = await db
      .from("support_tickets")
      .insert({
        subject: parsed.data.subject,
        category: parsed.data.category,
        created_by: ctx.userId,
        establishment_id: ctx.establishmentId,
      })
      .select("id, reference")
      .single();
    if (error) throw error;

    const { error: msgError } = await db.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: ctx.userId,
      is_staff_reply: false,
      body: parsed.data.body,
    });
    if (msgError) {
      await db.from("support_tickets").delete().eq("id", ticket.id);
      throw msgError;
    }

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      await sendMail({
        to: supportEmail,
        subject: `[${ticket.reference}] ${parsed.data.subject}`,
        text: `Nouveau ticket de ${ctx.name}${ctx.email ? ` <${ctx.email}>` : ""}\n\n${parsed.data.body}`,
        html: `<p>Nouveau ticket de ${escapeHtml(ctx.name)}</p><pre style="white-space:pre-wrap">${escapeHtml(parsed.data.body)}</pre>`,
      }).catch(() => undefined);
    }

    return { data: { id: ticket.id } };
  } catch (err) {
    return { error: friendly(err, "createSupportTicket") };
  }
}

const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1, "Message vide.").max(5000),
});

export async function replySupportTicketAction(values: z.input<typeof replySchema>): Promise<Result<{ status: TicketStatus }>> {
  const ctx = await context();
  if (!ctx) return { error: "Non autorisé." };
  const parsed = replySchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const db = (await createAdminClient()) as any;
    const { data: ticket, error } = await db
      .from("support_tickets")
      .select("id, reference, subject, status, created_by, establishment_id, author:users!support_tickets_created_by_fkey(name, email)")
      .eq("id", parsed.data.ticketId)
      .maybeSingle();
    if (error) throw error;
    if (!ticket || !canAccessTicket(ctx, ticket)) return { error: "Ticket introuvable." };

    const isStaff = ctx.role === "super_admin";
    const { error: msgError } = await db.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: ctx.userId,
      is_staff_reply: isStaff,
      body: parsed.data.body,
    });
    if (msgError) throw msgError;

    const status = nextStatusAfterReply(isStaff);
    const { error: updError } = await db.from("support_tickets").update({ status }).eq("id", ticket.id);
    if (updError) throw updError;

    // Prévient le demandeur par email quand le support répond.
    if (isStaff && ticket.author?.email) {
      await sendMail({
        to: ticket.author.email,
        subject: `[${ticket.reference}] Réponse du support : ${ticket.subject}`,
        text: `${parsed.data.body}\n\nRépondez depuis la page Support de l'application.`,
        html: `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(parsed.data.body)}</pre><p>Répondez depuis la page Support de l'application.</p>`,
      }).catch(() => undefined);
    }

    return { data: { status } };
  } catch (err) {
    return { error: friendly(err, "replySupportTicket") };
  }
}

export async function setSupportTicketStatusAction(id: string, status: TicketStatus): Promise<Result<{ status: TicketStatus }>> {
  const ctx = await context();
  if (!ctx) return { error: "Non autorisé." };
  if (!z.string().uuid().safeParse(id).success || !["open", "pending", "resolved"].includes(status)) {
    return { error: "Données invalides." };
  }

  try {
    const db = (await createAdminClient()) as any;
    const { data: ticket, error } = await db
      .from("support_tickets")
      .select("id, created_by, establishment_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!ticket || !canAccessTicket(ctx, ticket)) return { error: "Ticket introuvable." };

    // Le demandeur peut clore ou rouvrir ; seul le support met « en attente ».
    if (ctx.role !== "super_admin" && status === "pending") return { error: "Permission refusée." };

    const { error: updError } = await db.from("support_tickets").update({ status }).eq("id", id);
    if (updError) throw updError;
    return { data: { status } };
  } catch (err) {
    return { error: friendly(err, "setSupportTicketStatus") };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

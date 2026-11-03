"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Loader2, MessageSquare, Plus, Send, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/common/error-state";
import { formatRelativeDate, cn } from "@/lib/utils";
import {
  createSupportTicketAction,
  getSupportTicketAction,
  listSupportTicketsAction,
  replySupportTicketAction,
  setSupportTicketStatusAction,
} from "../actions";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type SupportTicketMessage,
  type TicketCategory,
  type TicketStatus,
} from "../rules";

const STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

function statusLabel(status: TicketStatus, isSupport: boolean): string {
  if (status === "pending") return isSupport ? "En attente du client" : TICKET_STATUS_LABELS.pending;
  if (status === "open") return isSupport ? "À traiter" : "Envoyé au support";
  return TICKET_STATUS_LABELS[status];
}

export function SupportTickets({ isSupport, canCreate }: { isSupport: boolean; canCreate: boolean }) {
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: tickets = [], error, isLoading: loading, refetch } = useQuery({
    queryKey: ["support-tickets", filter],
    queryFn: async (): Promise<SupportTicket[]> => {
      const res = await listSupportTicketsAction({ status: filter });
      if (res.error) throw new Error(res.error);
      return res.data ?? [];
    },
    retry: false,
  });
  const load = () => void refetch();

  if (error) return <ErrorState title="Support indisponible" message={error.message} onRetry={load} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Liste */}
      <div className="md:col-span-1 bg-card rounded-xl border p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b pb-2">
          <h3 className="font-bold text-sm">{isSupport ? "Boîte de réception" : "Mes demandes"}</h3>
          {canCreate && (
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => { setCreating(true); setSelectedId(null); }}>
              <Plus className="w-3.5 h-3.5" /> Nouveau
            </Button>
          )}
        </div>
        <select
          aria-label="Filtrer par statut"
          value={filter}
          onChange={(e) => setFilter(e.target.value as TicketStatus | "all")}
          className="w-full h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="all">Tous les statuts</option>
          <option value="open">{statusLabel("open", isSupport)}</option>
          <option value="pending">{statusLabel("pending", isSupport)}</option>
          <option value="resolved">Résolu</option>
        </select>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Chargement…</p>
          ) : tickets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aucun ticket.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedId(t.id); setCreating(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5",
                  selectedId === t.id ? "bg-brand-500/10 border-brand-500/30" : "bg-muted/5 hover:bg-muted/10"
                )}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-xs font-semibold text-brand-500">{t.reference}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeDate(t.updated_at)}</span>
                </div>
                {isSupport && (
                  <div className="text-xs font-bold truncate">{t.establishment?.name || t.author?.name || "—"}</div>
                )}
                <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                <Badge className={cn("w-fit text-[9px] px-1.5 py-0 border", STATUS_CLASSES[t.status])}>
                  {statusLabel(t.status, isSupport)}
                </Badge>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Détail */}
      <div className="md:col-span-2 space-y-4">
        {creating ? (
          <NewTicketForm
            onCancel={() => setCreating(false)}
            onCreated={(id) => { setCreating(false); setSelectedId(id); load(); }}
          />
        ) : selectedId ? (
          <TicketDetail key={selectedId} id={selectedId} isSupport={isSupport} onChanged={load} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-card border-dashed text-center px-6">
            <HelpCircle className="w-10 h-10 text-muted-foreground stroke-1 mb-2" />
            <p className="text-sm text-muted-foreground">
              {canCreate
                ? "Sélectionnez un ticket, ou cliquez sur « Nouveau » pour contacter le support."
                : "Sélectionnez un ticket pour afficher les échanges."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewTicketForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("question");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const res = await createSupportTicketAction({ subject, category, body });
    setSending(false);
    if (res.error) {
      toast.error("Ticket non envoyé", { description: res.error });
      return;
    }
    toast.success("Ticket envoyé au support");
    onCreated(res.data!.id);
  };

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-sm font-bold">Nouvelle demande au support</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Objet</Label>
            <Input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-category">Catégorie</Label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            >
              {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-body">Description</Label>
            <Textarea
              id="ticket-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Décrivez le problème : page concernée, ce que vous avez fait, le message d'erreur…"
              className="h-36 resize-none"
              maxLength={5000}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TicketDetail({ id, isSupport, onChanged }: { id: string; isSupport: boolean; onChanged: () => void }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, error, refetch } = useQuery({
    queryKey: ["support-ticket", id],
    queryFn: async (): Promise<{ ticket: SupportTicket; messages: SupportTicketMessage[] }> => {
      const res = await getSupportTicketAction(id);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    retry: false,
  });
  const load = async () => {
    await refetch();
  };
  const ticket = data?.ticket ?? null;
  const messages = data?.messages ?? [];

  if (error) return <ErrorState title="Ticket indisponible" message={error.message} onRetry={() => void load()} />;
  if (!ticket) {
    return <div className="py-20 text-center text-sm text-muted-foreground border rounded-xl bg-card">Chargement…</div>;
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await replySupportTicketAction({ ticketId: id, body: reply });
    setBusy(false);
    if (res.error) {
      toast.error("Réponse non envoyée", { description: res.error });
      return;
    }
    setReply("");
    await load();
    onChanged();
  };

  const changeStatus = async (status: TicketStatus) => {
    setBusy(true);
    const res = await setSupportTicketStatusAction(id, status);
    setBusy(false);
    if (res.error) {
      toast.error("Statut inchangé", { description: res.error });
      return;
    }
    await load();
    onChanged();
  };

  const statusButtons: TicketStatus[] = isSupport ? ["open", "pending", "resolved"] : ticket.status === "resolved" ? ["open"] : ["resolved"];

  return (
    <Card>
      <CardHeader className="border-b pb-4 flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <ShieldQuestion className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="truncate">{ticket.subject}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {ticket.reference} · {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
            {isSupport && ` · ${ticket.author?.name ?? "—"}${ticket.establishment?.name ? ` (${ticket.establishment.name})` : ""}`}
            {" · "}ouvert {formatRelativeDate(ticket.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {statusButtons.map((s) => (
            <Button
              key={s}
              size="sm"
              disabled={busy}
              variant={ticket.status === s ? "default" : "outline"}
              className="text-xs"
              onClick={() => changeStatus(s)}
            >
              {isSupport ? statusLabel(s, true) : s === "resolved" ? "Marquer résolu" : "Rouvrir"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-3">
          <p className="font-bold text-xs text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> ÉCHANGES
          </p>
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "p-3 border rounded-xl space-y-1",
                m.is_staff_reply ? "bg-brand-500/5 border-brand-500/10 ml-6" : "bg-muted/10 mr-6"
              )}
            >
              <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                <span className={m.is_staff_reply ? "text-brand-400" : undefined}>
                  {m.is_staff_reply ? "Support Etarcos" : m.author?.name ?? "Utilisateur"}
                </span>
                <span>{formatRelativeDate(m.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-line leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={sendReply} className="space-y-3 border-t pt-4">
          <Label htmlFor="support-reply" className="font-semibold text-xs text-muted-foreground">
            {isSupport ? "Répondre au client (il sera prévenu par email)" : "Ajouter un message"}
          </Label>
          <Textarea
            id="support-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Votre message…"
            className="h-24 resize-none"
            maxLength={5000}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={busy || !reply.trim()} className="gap-2 text-xs h-9">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Envoyer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { HelpCircle, MessageSquare, CheckCircle, Clock, Send, ShieldQuestion } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Ticket {
  id: string;
  school: string;
  sender: string;
  subject: string;
  message: string;
  date: string;
  status: "open" | "pending" | "resolved";
  replies: { sender: string; message: string; date: string }[];
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TK-8273",
    school: "Groupe Scolaire Bilingue A",
    sender: "M. Kamdem (Directeur)",
    subject: "Problème d'encaissement des frais via Mobile Money",
    message: "Bonjour, certains parents n'arrivent pas à valider les transactions Mobile Money. L'écran reste bloqué sur le statut de confirmation. Pouvez-vous vérifier l'API ?",
    date: "Il y a 2 heures",
    status: "open",
    replies: [],
  },
  {
    id: "TK-7382",
    school: "Collège du Centre",
    sender: "Mme. Ngono (Secrétaire)",
    subject: "Demande d'activation du module Assistant IA Gemini",
    message: "Bonjour, nous aimerions activer l'assistant IA pour l'aide à la saisie des appréciations des relevés de notes. Quelles sont les démarches tarifaires ?",
    date: "Il y a 5 heures",
    status: "pending",
    replies: [
      { sender: "Support Etarcos", message: "Bonjour, l'activation de l'IA nécessite une formule d'abonnement Premium ou Entreprise. Je vous invite à modifier votre offre dans vos configurations.", date: "Il y a 3 heures" }
    ],
  },
  {
    id: "TK-6192",
    school: "École Primaire de Douala",
    sender: "M. Tagne (Promoteur)",
    subject: "Facturation et renouvellement abonnement annuel",
    message: "Le chèque de règlement annuel de notre formule Pro a été envoyé ce matin. Pouvez-vous marquer notre facture comme payée pour éviter la suspension ?",
    date: "Hier",
    status: "resolved",
    replies: [
      { sender: "Support Etarcos", message: "Bonjour M. Tagne. Nous avons bien réceptionné le chèque et votre abonnement a été reconduit jusqu'en juin de l'année prochaine.", date: "Hier" }
    ],
  },
];

import { UserGuideView } from "@/components/layout/user-guide-view";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState("guide");
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(INITIAL_TICKETS[0] || null);
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !selectedTicket) return;

    const newReply = {
      sender: "Support Etarcos (SuperAdmin)",
      message: replyText,
      date: "À l'instant",
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: "pending",
              replies: [...t.replies, newReply],
            }
          : t
      )
    );

    setSelectedTicket((prev) =>
      prev
        ? {
            ...prev,
            status: "pending",
            replies: [...prev.replies, newReply],
          }
        : null
    );

    setReplyText("");
  };

  const handleStatusChange = (id: string, status: "open" | "pending" | "resolved") => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    setSelectedTicket((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Manuel d'Utilisation"
        description="Guide d'utilisation interactif par rôle et assistance technique."
        icon={HelpCircle}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="w-4 h-4" /> Manuel d'Utilisation
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="w-4 h-4" /> Tickets de Support ({tickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <UserGuideView />
        </TabsContent>

        <TabsContent value="tickets">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left list panel */}
        <div className="md:col-span-1 bg-card rounded-xl border p-4 space-y-4">
          <h3 className="font-bold text-sm border-b pb-2">Boîte de Réception</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  selectedTicket?.id === t.id
                    ? "bg-brand-500/10 border-brand-500/30 text-foreground"
                    : "bg-muted/5 hover:bg-muted/10"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-xs font-semibold text-brand-500">{t.id}</span>
                  <span className="text-[10px] text-muted-foreground">{t.date}</span>
                </div>
                <div className="text-xs font-bold text-foreground truncate">{t.school}</div>
                <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                <div className="flex gap-1.5 items-center mt-1">
                  <Badge className={`text-[9px] px-1.5 py-0 border ${
                    t.status === "open"
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : t.status === "pending"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}>
                    {t.status === "open" ? "Ouvert" : t.status === "pending" ? "En cours" : "Résolu"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right details panel */}
        <div className="md:col-span-2 space-y-4">
          {selectedTicket ? (
            <Card className="bg-card">
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <ShieldQuestion className="w-4 h-4 text-brand-400" /> {selectedTicket.subject}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Émis par : **{selectedTicket.sender}** ({selectedTicket.school}) — {selectedTicket.date}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => handleStatusChange(selectedTicket.id, "open")}
                    size="sm"
                    variant={selectedTicket.status === "open" ? "default" : "outline"}
                    className="text-xs"
                  >
                    Ouvert
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedTicket.id, "pending")}
                    size="sm"
                    variant={selectedTicket.status === "pending" ? "default" : "outline"}
                    className="text-xs"
                  >
                    En cours
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                    size="sm"
                    variant={selectedTicket.status === "resolved" ? "default" : "outline"}
                    className="text-xs"
                  >
                    Résolu
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Original Message */}
                <div className="p-4 border rounded-xl bg-muted/10 space-y-2">
                  <p className="font-bold text-xs text-muted-foreground">MESSAGE ORIGINAL :</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedTicket.message}</p>
                </div>

                {/* Reply list */}
                {selectedTicket.replies.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-bold text-xs text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> ÉCHANGES ET CORRESPONDANCES :
                    </p>
                    {selectedTicket.replies.map((rep, idx) => (
                      <div key={idx} className="p-3 border rounded-xl bg-brand-500/5 space-y-1 ml-4 border-brand-500/10">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-brand-400">
                          <span>{rep.sender}</span>
                          <span>{rep.date}</span>
                        </div>
                        <p className="text-xs text-foreground leading-normal">{rep.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleReplySubmit} className="space-y-3 border-t pt-4">
                  <Label htmlFor="support-reply" className="font-semibold text-xs text-muted-foreground">Rédiger une réponse officielle</Label>
                  <Textarea
                    id="support-reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Saisissez votre réponse ici..."
                    className="h-24 bg-muted/10 resize-none"
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-sans gap-2 text-xs h-9">
                      <Send className="w-3.5 h-3.5" /> Envoyer la réponse
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-card border-dashed">
              <HelpCircle className="w-10 h-10 text-muted-foreground stroke-1 mb-2 animate-bounce" />
              <p className="text-sm text-muted-foreground">Sélectionnez un ticket pour afficher les correspondances.</p>
            </div>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Bell, Send, Info, AlertTriangle, Loader2, CheckSquare, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { listNotificationsAction, createSystemNotificationAction } from "@/app/actions/superadmin";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user?: {
    name: string;
  } | null;
}

const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await listNotificationsAction();
    if (res.data) {
      setNotifications(res.data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);

    const res = await createSystemNotificationAction({ title, message, type });
    if (res.success) {
      setTitle("");
      setMessage("");
      setType("info");
      fetchNotifications();
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Système de Notifications"
        description="Consultez l'historique des alertes émises ou diffusez un message général à tous les utilisateurs."
        icon={Bell}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Broadcast form */}
        <div className="md:col-span-1 bg-card rounded-xl border p-5 h-fit space-y-4">
          <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-400" /> Diffuser un message
          </h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Sujet de l'alerte *</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Maintenance du serveur"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-type">Type d'information</Label>
              <select
                id="notif-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="info">Information générale (Bleu)</option>
                <option value="warning">Avertissement technique (Orange)</option>
                <option value="success">Félicitations / Succès (Vert)</option>
                <option value="error">Alerte critique (Rouge)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-msg">Corps du message *</Label>
              <Input
                id="notif-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ex: Le portail sera inaccessible ce soir de 22h à 23h..."
                required
              />
            </div>

            <Button type="submit" disabled={sending} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-sans gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Diffuser l'alerte
            </Button>
          </form>
        </div>

        {/* Right Column: Historical logs feed */}
        <div className="md:col-span-2 bg-card rounded-xl border p-5 space-y-4">
          <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" /> Flux d'envois récents
          </h3>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm">Chargement du flux d'alertes...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20 text-brand-500" />
              <p className="text-sm">Aucune notification diffusée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 border rounded-xl flex items-start gap-3 bg-muted/5">
                  <div className="mt-0.5">
                    {notif.type === "warning" || notif.type === "error" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-sm text-foreground truncate">{notif.title}</p>
                      <Badge className={`border uppercase text-[9px] font-bold ${typeColors[notif.type] || ""}`}>
                        {notif.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-2">
                      <span>Destinataire : {notif.user?.name || "Tous"}</span>
                      <span>{new Date(notif.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatRelativeDate, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";

interface Activity {
  id: string;
  user: { name: string; avatar?: string; role: string };
  action: string;
  target: string;
  time: string;
  type: "payment" | "enrollment" | "grade" | "attendance" | "document" | "other";
}

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: "1",
    user: { name: "Marie Dupont", role: "Secrétaire" },
    action: "a inscrit",
    target: "Kouam Jean-Pierre en 3ème A",
    time: "2026-06-30T10:45:00Z",
    type: "enrollment",
  },
  {
    id: "2",
    user: { name: "Paul Mbida", role: "Comptable" },
    action: "a enregistré un paiement de",
    target: "125 000 FCFA pour Ngono Alice",
    time: "2026-06-30T10:30:00Z",
    type: "payment",
  },
  {
    id: "3",
    user: { name: "Dr. Foko Emmanuel", role: "Enseignant" },
    action: "a saisi les notes de",
    target: "Mathématiques – 4ème B (32 élèves)",
    time: "2026-06-30T09:15:00Z",
    type: "grade",
  },
];

const TYPE_CONFIG = {
  payment: { label: "Paiement", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  enrollment: { label: "Inscription", className: "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-0" },
  grade: { label: "Notes", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0" },
  attendance: { label: "Présences", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0" },
  document: { label: "Document", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  other: { label: "Autre", className: "bg-muted text-muted-foreground border-0" },
};

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadActivities() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (active && json.recentActivities) {
          setActivities(json.recentActivities);
        }
      } catch (err) {
        console.error("Erreur de chargement des activités récentes:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadActivities();
    return () => { active = false; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Activités récentes</CardTitle>
          <CardDescription>Dernières actions de l'équipe</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="px-6 pb-4 space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Chargement...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucune activité récente.</p>
              ) : (
                activities.map((activity, i) => {
                  const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.other;
                  return (
                    <motion.div
                      key={activity.id + "_" + i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>{" "}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", config.className)}>
                            {config.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/60">
                            {formatRelativeDate(activity.time)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

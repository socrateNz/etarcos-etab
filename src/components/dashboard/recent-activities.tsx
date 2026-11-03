"use client";

import { motion } from "framer-motion";
import { formatRelativeDate, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SchoolDashboardData } from "@/lib/dashboard/school-stats";

const TYPE_CONFIG = {
  payment: { label: "Paiement", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  enrollment: { label: "Inscription", className: "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-0" },
};

export function RecentActivities({
  activities,
  isLoading,
}: {
  activities: SchoolDashboardData["recentActivities"];
  isLoading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Activités récentes</CardTitle>
          <CardDescription>Dernières inscriptions et paiements</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="px-6 pb-4 space-y-1">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Chargement...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucune activité récente.</p>
              ) : (
                activities.map((activity) => {
                  const config = TYPE_CONFIG[activity.type];
                  return (
                    <div key={activity.id} className="py-3 border-b border-border/50 last:border-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", config.className)}>
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground/60">
                          {formatRelativeDate(activity.time)}
                        </span>
                      </div>
                    </div>
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

"use client";

import { GraduationCap, DollarSign, Users, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { formatCurrency } from "@/lib/utils";
import type { SchoolDashboardData } from "@/lib/dashboard/school-stats";

export function KpiCards({ data, isLoading }: { data: SchoolDashboardData | null; isLoading: boolean }) {
  const k = data?.kpis;
  const cards = [
    {
      title: "Élèves",
      value: k ? k.students : "—",
      subtitle: "Inscrits dans l'établissement",
      icon: <GraduationCap className="w-full h-full" />,
      color: "brand" as const,
    },
    {
      title: "Encaissé ce mois",
      value: k?.monthRevenue != null ? formatCurrency(k.monthRevenue) : "—",
      subtitle: data && !data.canSeeFinance ? "Accès réservé à la comptabilité" : "Paiements reçus",
      icon: <DollarSign className="w-full h-full" />,
      color: "success" as const,
    },
    {
      title: "Personnel",
      value: k ? k.staff : "—",
      subtitle: "Enseignants & administration",
      icon: <Users className="w-full h-full" />,
      color: "violet" as const,
    },
    {
      title: "Moyenne générale",
      value: k?.averageGrade != null ? `${k.averageGrade}/20` : "—",
      subtitle: k && k.averageGrade == null ? "Aucune note enregistrée" : "Toutes notes saisies",
      icon: <TrendingUp className="w-full h-full" />,
      color: "cyan" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((kpi, i) => (
        <StatsCard key={kpi.title} {...kpi} index={i} isLoading={isLoading} />
      ))}
    </div>
  );
}

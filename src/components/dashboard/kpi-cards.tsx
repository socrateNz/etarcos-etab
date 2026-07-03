"use client";

import { useEffect, useState } from "react";
import { GraduationCap, DollarSign, Users, TrendingUp, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { formatCurrency } from "@/lib/utils";

const KPI_DEFAULTS = [
  {
    title: "Total Élèves",
    value: 0,
    subtitle: "Inscrits cette année",
    icon: <GraduationCap className="w-full h-full" />,
    trend: { value: 0, label: "vs année précédente" },
    color: "brand" as const,
  },
  {
    title: "Revenus du mois",
    value: formatCurrency(0),
    subtitle: "Total perçu",
    icon: <DollarSign className="w-full h-full" />,
    trend: { value: 0, label: "vs mois précédent" },
    color: "success" as const,
  },
  {
    title: "Personnel actif",
    value: 0,
    subtitle: "Enseignants & Admin",
    icon: <Users className="w-full h-full" />,
    trend: { value: 0, label: "nouveaux recrutements" },
    color: "violet" as const,
  },
  {
    title: "Moyenne générale",
    value: "N/A",
    subtitle: "Notes saisies",
    icon: <TrendingUp className="w-full h-full" />,
    trend: { value: 0, label: "vs trimestre précédent" },
    color: "cyan" as const,
  },
];

export function KpiCards() {
  const [data, setData] = useState(KPI_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    async function loadKpis() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        
        if (active && json.kpis) {
          const mapped = json.kpis.map((k: any, i: number) => {
            const defaults = KPI_DEFAULTS[i] || KPI_DEFAULTS[0];
            return {
              title: k.title,
              value: typeof k.value === "number" && k.title.includes("Revenus") 
                ? formatCurrency(k.value) 
                : k.value,
              subtitle: k.subtitle,
              icon: defaults.icon,
              trend: { value: k.trend || 0, label: defaults.trend.label },
              color: k.color as any
            };
          });
          setData(mapped);
        }
      } catch (err) {
        console.error("Erreur de chargement des KPIs:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadKpis();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DEFAULTS.map((kpi, i) => (
          <StatsCard
            key={kpi.title}
            {...kpi}
            index={i}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {data.map((kpi, i) => (
        <StatsCard
          key={kpi.title}
          {...kpi}
          index={i}
          isLoading={false}
        />
      ))}
    </div>
  );
}

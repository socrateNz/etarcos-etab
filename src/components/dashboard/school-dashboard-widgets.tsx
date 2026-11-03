"use client";

import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { ErrorState } from "@/components/common/error-state";
import type { SchoolDashboardData } from "@/lib/dashboard/school-stats";

async function fetchDashboard(): Promise<SchoolDashboardData> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    throw new Error(json?.error ?? "Impossible de charger le tableau de bord.");
  }
  return json as SchoolDashboardData;
}

/**
 * Charge /api/dashboard une seule fois pour les trois widgets. En cas
 * d'erreur, affiche un état d'erreur au lieu de zéros trompeurs.
 */
export function SchoolDashboardWidgets() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["school-dashboard"],
    queryFn: fetchDashboard,
    retry: 1,
  });

  if (error) {
    return <ErrorState title="Statistiques indisponibles" message={error.message} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <KpiCards data={data ?? null} isLoading={isLoading} />
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={data} />
          </div>
          <div>
            <RecentActivities activities={data.recentActivities} isLoading={false} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { SchoolDashboardData } from "@/lib/dashboard/school-stats";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name === "revenus" ? "Revenus" : entry.name === "depenses" ? "Dépenses" : entry.name} :</span>
            <span className="font-medium">
              {typeof entry.value === "number" && entry.value > 1000
                ? formatCurrency(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: { data: SchoolDashboardData }) {
  const { monthlyRevenue: revenueData, classPerformance, canSeeFinance, academicYear } = data;
  const defaultTab = canSeeFinance ? "revenue" : "performance";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{canSeeFinance ? "Finances & résultats" : "Résultats scolaires"}</CardTitle>
          <CardDescription>Année scolaire {academicYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-4">
              {canSeeFinance && <TabsTrigger value="revenue">Revenus & Dépenses</TabsTrigger>}
              <TabsTrigger value="performance">Moyennes par classe</TabsTrigger>
            </TabsList>

            {canSeeFinance && (
            <TabsContent value="revenue">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => v === "revenus" ? "Revenus" : "Dépenses"} />
                  <Area
                    type="monotone"
                    dataKey="revenus"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorRevenus)"
                  />
                  <Area
                    type="monotone"
                    dataKey="depenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#colorDepenses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            )}

            <TabsContent value="performance">
              {classPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-24">Aucune note enregistrée pour le moment.</p>
              ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classPerformance} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="classe" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 20]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}/20`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="moyenne"
                    name="Moyenne"
                    fill="url(#colorBar)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

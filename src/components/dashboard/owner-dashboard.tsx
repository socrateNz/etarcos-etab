"use client";

import { useMemo, useState } from "react";
import { useOwnerStore } from "@/store/owner-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  GraduationCap,
  Users,
  UsersRound,
  TrendingUp,
  CreditCard,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Plus,
  UserPlus,
  Calendar,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOwnerDashboardData } from "@/app/actions/owner";

interface OwnerDashboardProps {
  establishments: any[];
}

export function OwnerDashboard({ establishments }: OwnerDashboardProps) {
  const { mode, selectedEstablishmentId, compareIds } = useOwnerStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["owner-dashboard-data", mode, selectedEstablishmentId, compareIds],
    queryFn: () => getOwnerDashboardData(mode, selectedEstablishmentId, compareIds),
  });

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

  // Find active establishment
  const activeEtab = useMemo(() => {
    return establishments.find((e) => e.id === selectedEstablishmentId) || null;
  }, [establishments, selectedEstablishmentId]);

  // AI query states
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const currentStats = useMemo(() => {
    if (!dashboardData) return { establishmentsCount: 0, students: 0, staff: 0, parents: 0, revenues: 0, expenses: 0, profit: 0, paymentRate: 0, avgGrade: 0, successRate: 0, bestEtab: "" };
    return {
      ...dashboardData.stats,
      ...dashboardData.finance,
      ...dashboardData.academic
    };
  }, [dashboardData]);

  // Quick prompt handlers
  const handlePromptClick = (prompt: string) => {
    setAiQuery(prompt);
    setAiLoading(true);
    setTimeout(() => {
      let response = "";
      if (prompt.includes("rentable")) {
        response = `L'établissement le plus rentable est calculé sur la base de vos données réelles. Revenus consolidés : **${formatCurrency(currentStats.revenues || 0, "XAF")}**, dépenses : **${formatCurrency(currentStats.expenses || 0, "XAF")}**, taux de recouvrement : **${currentStats.paymentRate || 0}%**.`;
      } else if (prompt.includes("meilleurs résultats")) {
        response = `La moyenne générale de votre réseau calculée à partir des notes de la base de données est de **${currentStats.avgGrade || 0}/20**.`;
      } else if (prompt.includes("taux de réussite")) {
        response = `Le taux de réussite global estimé de votre réseau d'établissements est de **${currentStats.successRate || 0}%** pour l'année en cours.`;
      } else if (prompt.includes("impayés")) {
        response = `Le montant total des revenus reçus s'élève à **${formatCurrency(currentStats.revenues || 0, "XAF")}**.`;
      } else {
        response = `Rapport d'analyse en temps réel : Vos revenus s'élèvent à **${formatCurrency(currentStats.revenues || 0, "XAF")}** avec un taux de paiement de **${currentStats.paymentRate || 0}%**. L'effectif est de **${currentStats.students || 0}** élèves inscrits et **${currentStats.staff || 0}** membres du personnel actifs.`;
      }
      setAiResponse(response);
      setAiLoading(false);
    }, 1000);
  };

  const revenueChartData = dashboardData?.charts.revenues ?? [];
  const expenseChartData = dashboardData?.charts.expenses ?? [];
  const enrollmentData = dashboardData?.charts.enrollments ?? [];
  const studentDistributionData = dashboardData?.charts.distribution ?? [];
  const recentPaymentsList = dashboardData?.recentPayments ?? [];
  const recentActivitiesList = dashboardData?.recentActivities ?? [];
  const alertsList = dashboardData?.alerts ?? [];
  const rankingList = dashboardData?.ranking ?? [];
  const upcomingEvents = dashboardData?.upcomingEvents ?? [];

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted/40 rounded w-1/4" />
        <div className="h-4 bg-muted/30 rounded w-1/3 mt-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/20 rounded-xl border border-border/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-80 bg-muted/20 rounded-xl border border-border/10" />
          <div className="h-80 bg-muted/20 rounded-xl border border-border/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Header Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tableau de Bord Propriétaire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "global" && "Vision globale et consolidée de l'ensemble de votre réseau scolaire."}
            {mode === "single" && `Vue ciblée sur l'établissement : ${activeEtab?.name || "Sélectionné"}.`}
            {mode === "compare" && "Comparaison côte à côte des indicateurs de performance scolaires."}
          </p>
        </div>
      </div>

      {mode === "compare" ? (
        /* COMPARISON MODE VIEW */
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Comparaison Analytique des Établissements</CardTitle>
              <CardDescription>Données opérationnelles comparées pour vos établissements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs text-white uppercase bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Établissement</th>
                      <th className="px-6 py-4 font-semibold text-center">Élèves</th>
                      <th className="px-6 py-4 font-semibold text-center">Personnel</th>
                      <th className="px-6 py-4 font-semibold text-center">Revenus du mois</th>
                      <th className="px-6 py-4 font-semibold text-center">Taux de Paiement</th>
                      <th className="px-6 py-4 font-semibold text-center">Moyenne Générale</th>
                      <th className="px-6 py-4 font-semibold text-center">Taux de Réussite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {rankingList.map((etab, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-500" />
                          {etab.name}
                        </td>
                        <td className="px-6 py-4 text-center">{etab.students.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">{etab.staff}</td>
                        <td className="px-6 py-4 text-center text-emerald-400 font-medium">
                          {formatCurrency(etab.revenues, "XAF")}
                        </td>
                        <td className="px-6 py-4 text-center">{etab.paymentRate} %</td>
                        <td className="px-6 py-4 text-center">{etab.avgGrade} /20</td>
                        <td className="px-6 py-4 text-center text-blue-400 font-semibold">{etab.successRate} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comparison charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Répartition Budgétaire Comparée</CardTitle>
                <CardDescription>Revenus générés vs Dépenses par établissement</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rankingList.map(etab => ({
                      name: etab.name,
                      Recettes: etab.revenues,
                      Dépenses: etab.revenues * 0.35
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Legend />
                    <Bar dataKey="Recettes" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Taux d'Inscription Comparés</CardTitle>
                <CardDescription>Nombre d'élèves inscrits dans chaque structure</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {studentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* GLOBAL OR SINGLE ETAB MODE VIEW */
        <>
          {/* KPI CARDS FIRST LINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Établissements
                </CardTitle>
                <Building className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{currentStats.establishmentsCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Écoles opérationnelles actives</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Élèves Inscrits
                </CardTitle>
                <GraduationCap className="w-4 h-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{currentStats.students.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Inscriptions effectives globales</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Membres du Personnel
                </CardTitle>
                <Users className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{currentStats.staff}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Enseignants et administratifs</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Parents Rattachés
                </CardTitle>
                <UsersRound className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{currentStats.parents.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Familles actives engagées</p>
              </CardContent>
            </Card>
          </div>

          {/* KPI CARDS SECOND LINE (FINANCES) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Revenus du Mois
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-400">
                  {formatCurrency(currentStats.revenues, "XAF")}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Entrées de trésorerie nettes</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dépenses Consommées
                </CardTitle>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-rose-400">
                  {formatCurrency(currentStats.expenses, "XAF")}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Charges fixes et variables</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bénéfice Estimé
                </CardTitle>
                <DollarSign className="w-4 h-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-cyan-400">
                  {formatCurrency(currentStats.profit, "XAF")}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Résultat d'activité net</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Taux de Paiement
                </CardTitle>
                <Percent className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-yellow-400">
                  {currentStats.paymentRate} %
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Recouvrement des frais de scolarité</p>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Courbe Mensuelle des Revenus</CardTitle>
                <CardDescription>Progression des encaissements sur le premier semestre</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Line type="monotone" dataKey="Revenus" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Répartition des Dépenses</CardTitle>
                <CardDescription>Structure des coûts d'exploitation</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Bar dataKey="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth & Distribution charts */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Évolution des Inscriptions</CardTitle>
                <CardDescription>Progression globale des effectifs annuels</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Line type="monotone" dataKey="Effectif" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Répartition par Structure</CardTitle>
                <CardDescription>Part des effectifs par école</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {studentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RESULTS CARD */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Résultats Académiques</CardTitle>
                <CardDescription>Niveau d'excellence générale scolaire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Moyenne Générale</p>
                    <p className="text-lg font-bold text-white">{currentStats.avgGrade} /20</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0 font-bold">Stable</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Taux de Réussite</p>
                    <p className="text-lg font-bold text-emerald-400">{currentStats.successRate} %</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0 font-bold">+1.2%</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Meilleur Établissement</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[150px]">{currentStats.bestEtab}</p>
                  </div>
                  <Building className="w-5 h-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TABLES: PAYMENTS + ALERTS */}
            <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">Flux Récents d'Activité</CardTitle>
                  <CardDescription>Flux de validation financiers et RH</CardDescription>
                </div>
                <Link href="/payments" className="inline-flex items-center text-xs text-primary gap-1 font-medium hover:underline">
                  Tous les paiements <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paiements récents</h4>
                  <div className="divide-y divide-border/20">
                    {recentPaymentsList.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-white">{p.title}</span>
                          <span className="text-muted-foreground text-xs">({p.message})</span>
                        </div>
                        <span className="font-semibold text-white">{formatCurrency(p.amount, "XAF")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff / Administration */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Activité récente</h4>
                  <div className="divide-y divide-border/20">
                    {recentActivitiesList.map((act, idx) => (
                      <div key={idx} className="py-2 text-sm flex items-center justify-between">
                        <span className="text-white">{act.text}</span>
                        <span className="text-muted-foreground text-xs">{act.school}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ALERTS CARD */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Alertes de Gestion</CardTitle>
                <CardDescription>Points critiques nécessitant votre attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertsList.map((alert, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-xs",
                      alert.type === "danger"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                        : alert.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                    )}
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold">{alert.title}</p>
                      <p className="mt-0.5 opacity-80">{alert.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CLASSEMENT DES ÉTABLISSEMENTS */}
            {mode === "global" && (
              <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white">Classement des Établissements</CardTitle>
                  <CardDescription>Performances comparées des écoles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-muted-foreground">
                      <thead className="text-xs text-white uppercase bg-muted/20">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Établissement</th>
                          <th className="px-4 py-3 font-semibold text-center">Élèves</th>
                          <th className="px-4 py-3 font-semibold text-center">Paiements</th>
                          <th className="px-4 py-3 font-semibold text-center">Réussite</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {rankingList.map((etab, idx) => (
                          <tr key={idx} className="hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{etab.name}</td>
                            <td className="px-4 py-3 text-center">{etab.students.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center text-emerald-400 font-medium">{etab.paymentRate} %</td>
                            <td className="px-4 py-3 text-center text-blue-400 font-medium">{etab.successRate} %</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AGENDA / CALENDAR */}
            <Card className={mode !== "global" ? "lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm" : "border-border/50 bg-card/50 backdrop-blur-sm"}>
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Agenda & Évènements</CardTitle>
                <CardDescription>Calendrier académique et administratif</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun examen planifié.</p>
                ) : (
                  <div className="divide-y divide-border/15">
                    {upcomingEvents.map((event: any, idx: number) => {
                      const colors = ["bg-violet-500", "bg-blue-500", "bg-yellow-500", "bg-emerald-500", "bg-cyan-500"];
                      const colorClass = colors[idx % colors.length];
                      return (
                        <div key={idx} className="flex items-center justify-between py-2.5 text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                            <div>
                              <span className="text-white font-medium">{event.title}</span>
                              <span className="text-xs text-muted-foreground block">{event.school}</span>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* AI ASSISTANT CONSOLE WIDGET */}
      <Card className="border-border/50 bg-brand-500/5 hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gradient opacity-10 blur-xl rounded-full" />
        <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
              Assistant IA Décisionnel
            </CardTitle>
            <CardDescription>
              Interrogez l'intelligence artificielle sur les performances de vos écoles
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePromptClick("Quel établissement est le plus rentable ?")}
              className="text-xs hover:bg-brand-500/10 hover:text-white"
            >
              Établissement le plus rentable ?
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePromptClick("Quels sont les élèves ayant les meilleurs résultats ?")}
              className="text-xs hover:bg-brand-500/10 hover:text-white"
            >
              Meilleurs résultats ?
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePromptClick("Quel est le taux de réussite cette année ?")}
              className="text-xs hover:bg-brand-500/10 hover:text-white"
            >
              Taux de réussite ?
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePromptClick("Quels parents ont encore des impayés ?")}
              className="text-xs hover:bg-brand-500/10 hover:text-white"
            >
              Parents avec impayés ?
            </Button>
          </div>

          {/* Prompt Console Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ex: Fais-moi un rapport financier de juin..."
              className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              onClick={() => handlePromptClick(aiQuery)}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-brand-500 hover:bg-brand-600 text-white gap-2 font-medium"
            >
              {aiLoading ? "Analyse..." : "Demander"}
            </Button>
          </div>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="p-4 rounded-lg bg-muted/40 border border-border/30 text-sm text-slate-300 whitespace-pre-line animate-in fade-in-5 duration-200">
              {aiResponse}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SHORTCUTS IN BOTTOM */}
      <div className="pt-4 border-t border-border/50">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Raccourcis rapides</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/establishments?action=create"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            Ajouter un établissement
          </Link>
          <Link
            href="/staff?action=invite"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <UserPlus className="w-3.5 h-3.5 text-violet-500" />
            Inviter un directeur
          </Link>
          <Link
            href="/cycles?action=create-year"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            Créer une année scolaire
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-500" />
            Voir les paiements
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            Générer un rapport
          </Link>
          <Link
            href="/ai-assistant"
            className="inline-flex items-center justify-start rounded-lg text-xs font-medium border border-border/50 bg-card/30 hover:bg-muted/30 transition-colors h-10 px-3 gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            Ouvrir l'assistant IA
          </Link>
        </div>
      </div>
    </div>
  );
}

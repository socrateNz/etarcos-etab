"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import Link from "next/link";
import {
  School, Users, Landmark, CreditCard, TrendingUp, ShieldAlert,
  AlertTriangle, CheckCircle2, HelpCircle,
  Plus, UserPlus, Megaphone, Settings,
  GraduationCap, Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// Recharts colors
const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#ef4444"];

interface SuperAdminDashboardProps {
  stats: {
    establishments: number;
    owners: number;
    users: number;
    students: number;
    revenue: number;
    recentSchools: any[];
  };
  regionDistribution?: { name: string; count: number; percentage: string }[];
  evolutionData?: { name: string; e: number }[];
  newUsersData?: { name: string; u: number }[];
  revenueData?: { name: string; r: number }[];
  planData?: { name: string; value: number }[];
  recentActivities?: { id: any; text: string; time: string; status: string }[];
  services?: { name: string; ok: boolean }[];
  alerts?: { level: "danger" | "warning"; text: string }[];
  supportStats?: { open: number; pending: number; resolvedToday: number } | null;
  platformKpis?: { paidPlans: number; blocked: number; newThisMonth: number; newLastMonth: number };
}

export function SuperAdminDashboard({
  stats,
  regionDistribution = [],
  evolutionData = [],
  newUsersData = [],
  revenueData = [],
  planData = [],
  recentActivities = [],
  services = [],
  alerts = [],
  supportStats = null,
  platformKpis = { paidPlans: 0, blocked: 0, newThisMonth: 0, newLastMonth: 0 },
}: SuperAdminDashboardProps) {
  // Use database real values exactly (no mock baselines)
  const totalEst = stats.establishments;
  const totalOwners = stats.owners;
  const totalUsers = stats.users;
  const totalStudents = stats.students;
  const totalRev = stats.revenue;

  const REGION_DISTRIBUTION = regionDistribution;
  const EVOLUTION_DATA = evolutionData;
  const NEW_USERS_DATA = newUsersData;
  const REVENUE_DATA = revenueData;
  const PLAN_DATA = planData;

  return (
    <div className="space-y-6">
      {/* Header alert */}
      <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center gap-3 text-brand-400 no-print">
        <ShieldAlert className="w-5 h-5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Mode d'administration globale activé.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Vous gérez la plateforme Etarcos Etab SaaS.</p>
        </div>
        <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">Super Admin</Badge>
      </div>

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Établissements</CardTitle>
              <p className="text-2xl font-bold mt-1">{totalEst}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <School className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Écoles actives sur la plateforme</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Propriétaires</CardTitle>
              <p className="text-2xl font-bold mt-1">{totalOwners}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Landmark className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Multi-tenant clients</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Utilisateurs</CardTitle>
              <p className="text-2xl font-bold mt-1">{totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Comptes d'administration</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Élèves</CardTitle>
              <p className="text-2xl font-bold mt-1">{totalStudents.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Dossiers scolaires cumulés</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Frais encaissés</CardTitle>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{formatCurrency(totalRev)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total des paiements saisis par les écoles</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Nouveaux établissements</CardTitle>
              <p className="text-2xl font-bold mt-1 text-brand-400">{platformKpis.newThisMonth}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ce mois-ci ({platformKpis.newLastMonth} le mois dernier)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Formules payantes</CardTitle>
              <p className="text-2xl font-bold mt-1">{platformKpis.paidPlans}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Package className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Starter / Professionnel / Entreprise</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Établissements non actifs</CardTitle>
              <p className="text-2xl font-bold mt-1 text-destructive">{platformKpis.blocked}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Suspendus, inactifs ou en attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Charts evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution des établissements & Revenus</CardTitle>
            <CardDescription>Croissance mensuelle de la plateforme SaaS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={EVOLUTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="e" stroke="#6366f1" strokeWidth={2} fillOpacity={0.1} fill="#6366f1" name="Établissements" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des abonnements</CardTitle>
            <CardDescription>Abonnements par formule d'offre</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PLAN_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PLAN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Users and revenue curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveaux utilisateurs quotidiens</CardTitle>
            <CardDescription>Flux hebdomadaire d'enregistrements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={NEW_USERS_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="u" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0.1} fill="#8b5cf6" name="Utilisateurs" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus récurrents de la plateforme</CardTitle>
            <CardDescription>Revenu global (FCFA) encaissé par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip />
                <Bar dataKey="r" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Revenus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Map Cameroun & Platform health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cameroun Map regions list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Répartition géographique (Cameroun)</CardTitle>
            <CardDescription>Concentration des établissements scolaires par région</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {REGION_DISTRIBUTION.map((region) => (
                <div key={region.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{region.name}</span>
                    <span className="text-muted-foreground">{region.count} écoles ({region.percentage})</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full" style={{ width: region.percentage }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services de la plateforme</CardTitle>
            <CardDescription>Configuration détectée sur le serveur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {services.map((svc) => (
              <div key={svc.name} className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">{svc.name}</span>
                {svc.ok ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Configuré</Badge>
                ) : (
                  <Badge className="bg-destructive/20 text-destructive border-0">Manquant</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Alertes & support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={alerts.length > 0 ? "border-red-500/20 bg-red-500/[0.02]" : undefined}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className={alerts.length > 0 ? "w-5 h-5 text-red-500" : "w-5 h-5 text-muted-foreground"} /> Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" /> Aucune alerte.
              </p>
            ) : (
              alerts.map((a) => (
                <div key={a.text} className={a.level === "danger" ? "flex items-start gap-2 text-destructive" : "flex items-start gap-2 text-amber-500"}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{a.text}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" /> Tickets de support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {supportStats ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">À traiter :</span>
                  <Badge variant={supportStats.open > 0 ? "destructive" : "secondary"}>{supportStats.open}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">En attente du client :</span>
                  <Badge variant="secondary">{supportStats.pending}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Résolus aujourd&apos;hui :</span>
                  <span className="font-semibold text-emerald-500">{supportStats.resolvedToday}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Support indisponible (migration 009 à appliquer).</p>
            )}
            <Link href="/support" className="block">
              <Button variant="outline" size="sm" className="w-full mt-2">Ouvrir le support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente plateforme</CardTitle>
            <CardDescription>Flux d'administration global</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex justify-between text-xs border-b border-border/50 pb-2 last:border-0">
                <span className="text-foreground font-medium">{act.text}</span>
                <span className="text-muted-foreground/60">{act.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accès rapide</CardTitle>
            <CardDescription>Raccourcis d'administration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/establishments" className="w-full col-span-2">
              <Button className="w-full justify-start gap-2 bg-brand-500 hover:bg-brand-600 text-white text-xs">
                <Plus className="w-4 h-4" /> Créer un établissement
              </Button>
            </Link>
            <Link href="/owners" className="w-full col-span-2">
              <Button variant="outline" className="w-full justify-start gap-2 border-border text-xs">
                <UserPlus className="w-4 h-4" /> Inviter un propriétaire
              </Button>
            </Link>
            <Link href="/news" className="w-full">
              <Button variant="outline" className="w-full justify-start gap-2 border-border text-xs">
                <Megaphone className="w-4 h-4" /> Annonces
              </Button>
            </Link>
            <Link href="/settings" className="w-full">
              <Button variant="outline" className="w-full justify-start gap-2 border-border text-xs">
                <Settings className="w-4 h-4" /> Abonnements
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

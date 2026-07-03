"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import Link from "next/link";
import {
  School, Users, Landmark, CreditCard, TrendingUp, ShieldAlert,
  AlertTriangle, CheckCircle2, Play, Activity, HelpCircle, Sparkles,
  Calendar, ArrowUpRight, Plus, UserPlus, Megaphone, Settings, FileText,
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
}

export function SuperAdminDashboard({
  stats,
  regionDistribution = [],
  evolutionData = [],
  newUsersData = [],
  revenueData = [],
  planData = [],
  recentActivities = []
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
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenus du mois</CardTitle>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{formatCurrency(totalRev)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Revenu Mensuel Récurrent (MRR)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Croissance</CardTitle>
              <p className="text-2xl font-bold mt-1 text-brand-400">+18.0 %</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Nouveaux abonnés vs mois dernier</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Abonnements actifs</CardTitle>
              <p className="text-2xl font-bold mt-1">210</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Package className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Formules Starter / Pro / Enterprise</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Abonnements expirés</CardTitle>
              <p className="text-2xl font-bold mt-1 text-destructive">35</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Comptes bloqués ou en attente</p>
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
            <CardTitle className="text-base">Santé de la plateforme</CardTitle>
            <CardDescription>Statut opérationnel de l'infrastructure SaaS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">API Gateway :</span>
                <span className="font-semibold text-emerald-500">99.98% (Normal)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Base de données (Supabase) :</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Opérationnel</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stockage (Cloudinary) :</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Opérationnel</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Espace Stockage :</span>
                <span className="font-semibold text-amber-500">78 %</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Temps de réponse moyen :</span>
                <span className="font-semibold text-foreground">142 ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Alerts & Support tickets & AI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alerts Card */}
        <Card className="border-red-500/20 bg-red-500/[0.02]">
          <CardHeader>
            <CardTitle className="text-base text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Alertes système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p>12 abonnements expirent bientôt (sous 7 jours)</p>
            </div>
            <div className="flex items-start gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p>5 établissements sont restés inactifs ce mois</p>
            </div>
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p>2 sauvegardes de base de données ont échoué</p>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" /> Tickets de support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ouverts :</span>
              <Badge variant="destructive">15 tickets</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">En cours de traitement :</span>
              <Badge variant="secondary">7 tickets</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Résolus aujourd'hui :</span>
              <span className="font-semibold text-emerald-500">32 résolus</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" /> Utilisation Assistant IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requêtes ce mois :</span>
              <span className="font-semibold text-foreground">12 450 appels</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quota Restant :</span>
              <span className="font-semibold text-brand-400">87.5 %</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temps de réponse IA :</span>
              <span className="font-semibold text-foreground">1.8s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Calendar & Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" /> Événements & Calendrier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="text-brand-400 font-bold text-xs uppercase leading-none mt-1">Juil 05</div>
              <div>
                <p className="font-medium text-foreground">Renouvellement abonnements de groupe</p>
                <p className="text-xs text-muted-foreground">Secteur Douala</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-brand-400 font-bold text-xs uppercase leading-none mt-1">Juil 12</div>
              <div>
                <p className="font-medium text-foreground">Maintenance des serveurs Supabase</p>
                <p className="text-xs text-muted-foreground">Dimanche 02h00 - 04h00</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

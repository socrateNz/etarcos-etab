"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  School,
  Users,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  CalendarDays,
  CreditCard,
  Building,
  TrendingDown,
  Percent,
  Clock,
  Briefcase,
  Bot,
  Loader2,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { listEstablishmentPlans, listUsersAction, getPlatformProfileCountsAction } from "@/app/actions/superadmin";
import { AiSynthesis } from "@/components/reports/ai-synthesis";
import { getOwnerDashboardData } from "@/app/actions/owner";
import { useOwnerStore } from "@/store/owner-store";
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
  AreaChart,
  Area,
} from "recharts";

function ReportsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "academic";
  const { user } = useAuth();
  const { mode, selectedEstablishmentId, compareIds } = useOwnerStore();

  const isSuperAdmin = user?.role === "super_admin";

  // State for SaaS metrics (SuperAdmin)
  const [saasStats, setSaasStats] = useState({
    schoolsCount: 0,
    usersCount: 0,
    mrr: 0,
    plansSplit: { free: 0, starter: 0, professional: 0, enterprise: 0 },
    profiles: { students: 0, staff: 0, parents: 0, owners: 0 },
  });
  const [saasLoading, setSaasLoading] = useState(true);

  // Fetch owner multi-school data (Owner)
  const { data: ownerData, isLoading: ownerLoading } = useQuery({
    queryKey: ["owner-reports-data", mode, selectedEstablishmentId, compareIds],
    queryFn: () => getOwnerDashboardData(mode, selectedEstablishmentId, compareIds),
    enabled: user?.role === "owner" || user?.role === "super_admin",
  });

  // Load SaaS statistics (only for SuperAdmin)
  const loadSaasData = async () => {
    try {
      setSaasLoading(true);
      const schoolsRes = await listEstablishmentPlans();
      const [usersRes, profilesRes] = await Promise.all([listUsersAction(), getPlatformProfileCountsAction()]);

      const schoolsList = schoolsRes.data ?? [];
      const split = { free: 0, starter: 0, professional: 0, enterprise: 0 };
      let estimatedRevenue = 0;

      schoolsList.forEach((s: any) => {
        if (s.plan in split) {
          split[s.plan as keyof typeof split]++;
        }
        if (s.plan === "starter") estimatedRevenue += 45000;
        else if (s.plan === "professional") estimatedRevenue += 90000;
        else if (s.plan === "enterprise") estimatedRevenue += 250000;
      });

      setSaasStats({
        schoolsCount: schoolsList.length,
        usersCount: (usersRes.data ?? []).length,
        mrr: estimatedRevenue,
        plansSplit: split,
        profiles: profilesRes.data ?? { students: 0, staff: 0, parents: 0, owners: 0 },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaasLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && activeTab === "saas") {
      loadSaasData();
    }
  }, [isSuperAdmin, activeTab]);

  // Tab definitions for owner
  const tabs = [
    { id: "academic", label: "Académiques", icon: BookOpen },
    { id: "financial", label: "Financiers", icon: CreditCard },
    { id: "hr", label: "RH & Salaires", icon: Briefcase },
    { id: "attendance", label: "Fréquentation", icon: Clock },
    { id: "ai", label: "Analyses IA", icon: Sparkles },
  ];

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/reports?${params.toString()}`);
  };

  // Color constants
  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

  const currentStats = useMemo(() => {
    if (!ownerData) return { establishmentsCount: 0, students: 0, staff: 0, parents: 0, revenues: 0, expenses: 0, profit: 0, paymentRate: 0, avgGrade: 0, successRate: 0, bestEtab: "" };
    return {
      ...ownerData.stats,
      ...ownerData.finance,
      ...ownerData.academic
    };
  }, [ownerData]);

  // Renders the SaaS statistics for SuperAdmin
  const renderSaasReports = () => {
    if (saasLoading) {
      return <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement des rapports SaaS...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenus Mensuels (MRR)</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(saasStats.mrr)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Estimation d'après les formules des établissements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Établissements</CardTitle>
              <School className="w-4 h-4 text-brand-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{saasStats.schoolsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Écoles actives inscrites</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Comptes Utilisateurs</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{saasStats.usersCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Comptes enregistrés globaux</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Formules payantes</CardTitle>
              <ArrowUpRight className="w-4 h-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {saasStats.plansSplit.starter + saasStats.plansSplit.professional + saasStats.plansSplit.enterprise}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Établissements en Starter, Professionnel ou Entreprise</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" /> Répartition des abonnements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(saasStats.plansSplit).map(([plan, count]) => (
                <div key={plan} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium uppercase">
                    <span>{plan}</span>
                    <span className="font-semibold text-foreground">{count} établissements</span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all"
                      style={{ width: `${saasStats.schoolsCount > 0 ? (count / saasStats.schoolsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" /> Profils & Rôles actifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Élèves inscrits</p>
                  <p className="text-xs text-muted-foreground">Dossiers élèves</p>
                </div>
                <Badge variant="outline" className="text-brand-500 border-brand-500/20 font-mono">
                  {saasStats.profiles.students}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Personnel</p>
                  <p className="text-xs text-muted-foreground">Enseignants et administration</p>
                </div>
                <Badge variant="outline" className="text-blue-500 border-blue-500/20 font-mono">
                  {saasStats.profiles.staff}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Parents & propriétaires</p>
                  <p className="text-xs text-muted-foreground">Comptes familles et promoteurs</p>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-mono">
                  {saasStats.profiles.parents + saasStats.profiles.owners}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title={isSuperAdmin && activeTab === "saas" ? "Analyses SaaS" : "Rapports & Statistiques"}
          description={isSuperAdmin && activeTab === "saas" ? "Indicateurs de croissance de la plateforme d'établissements scolaires." : "Indicateurs clés de performance de votre parc scolaire."}
          icon={BarChart3}
        />
        {isSuperAdmin && (
          <Button
            variant={activeTab === "saas" ? "default" : "outline"}
            onClick={() => handleTabChange(activeTab === "saas" ? "academic" : "saas")}
            className="text-xs font-sans gap-2"
          >
            {activeTab === "saas" ? "Rapports scolaires" : "Dashboard SaaS"}
          </Button>
        )}
      </div>

      {activeTab === "saas" && isSuperAdmin ? (
        renderSaasReports()
      ) : (
        /* OWNER AND MULTI-SCHOOL REPORTS VIEW */
        <div className="space-y-6">
          {/* Tab Navigation header */}
          <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {ownerLoading || !ownerData ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2">Chargement des rapports scolaires...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: ACADEMIC */}
              {activeTab === "academic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Moyenne Générale</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{currentStats.avgGrade} /20</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Moyenne générale de tous les élèves</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Taux de Réussite</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">{currentStats.successRate} %</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Sur l'ensemble des examens blancs</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Élèves Totaux</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-white">{currentStats.students.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Inscriptions enregistrées</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-white">Évolution des Inscriptions</CardTitle>
                        <CardDescription>Progression historique de vos effectifs</CardDescription>
                      </CardHeader>
                      <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ownerData.charts.enrollments}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                            <Area type="monotone" dataKey="Effectif" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-white">Répartition des Effectifs par École</CardTitle>
                        <CardDescription>Visualisation de la taille relative des structures</CardDescription>
                      </CardHeader>
                      <CardContent className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ownerData.charts.distribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {ownerData.charts.distribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIAL */}
              {activeTab === "financial" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenus du mois</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(currentStats.revenues, "XAF")}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Frais de scolarité perçus</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Dépenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-rose-400">{formatCurrency(currentStats.expenses, "XAF")}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Charges fixes et variables</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bénéfice estimé</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-cyan-400">{formatCurrency(currentStats.profit, "XAF")}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Excédent net d'activité</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Taux de paiement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{currentStats.paymentRate} %</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Taux de recouvrement des frais</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-white">Courbe Mensuelle des Revenus</CardTitle>
                        <CardDescription>Progression mensuelle consolidée des encaissements</CardDescription>
                      </CardHeader>
                      <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={ownerData.charts.revenues}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                            <Line type="monotone" dataKey="Revenus" stroke="#10b981" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-white">Répartition des Coûts</CardTitle>
                        <CardDescription>Structure des charges fixes et variables</CardDescription>
                      </CardHeader>
                      <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ownerData.charts.expenses}>
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
                </div>
              )}

              {/* TAB 3: HR */}
              {activeTab === "hr" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Effectif total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{currentStats.staff} employés</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Personnels administratifs et académiques</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Masse salariale</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-rose-400">{formatCurrency(ownerData?.hr?.payroll ?? 0, "XAF")}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Dépenses saisies en catégorie « Salaires »</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Postes différents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{ownerData?.hr?.byPosition?.length ?? 0}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Fonctions renseignées dans les fiches du personnel</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-white">Répartition du Personnel</CardTitle>
                      <CardDescription>Effectif par poste déclaré</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-muted-foreground">
                          <thead className="text-xs text-white uppercase bg-muted/20">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Poste</th>
                              <th className="px-4 py-3 font-semibold text-center">Effectif</th>
                              <th className="px-4 py-3 font-semibold text-center">Part relative</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                            {(ownerData?.hr?.byPosition ?? []).length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-4 py-6 text-center">Aucun membre du personnel enregistré.</td>
                              </tr>
                            ) : (
                              (ownerData?.hr?.byPosition ?? []).map((row: { position: string; count: number }) => (
                                <tr key={row.position}>
                                  <td className="px-4 py-3 font-medium text-white">{row.position}</td>
                                  <td className="px-4 py-3 text-center">{row.count}</td>
                                  <td className="px-4 py-3 text-center">
                                    {currentStats.staff > 0 ? Math.round((row.count / currentStats.staff) * 100) : 0} %
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 4: ATTENDANCE */}
              {activeTab === "attendance" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Taux d'Assiduité Moyen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">{ownerData?.attendance?.rate ?? 0} %</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Présence moyenne enregistrée cette semaine</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Taux de retard moyen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-yellow-500">{ownerData?.attendance?.lateRate ?? 0} %</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Élèves arrivant après l'heure de début</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-white">Taux d'Assiduité Journalier de la Semaine</CardTitle>
                      <CardDescription>Présence consolidée enregistrée par jour</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ownerData?.attendance?.history ?? []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                          <Line type="monotone" dataKey="Presence" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 5: AI */}
              {activeTab === "ai" && (
                <AiSynthesis
                  stats={{
                    establishments: currentStats.establishmentsCount,
                    students: currentStats.students,
                    staff: currentStats.staff,
                    parents: currentStats.parents,
                    revenues: currentStats.revenues,
                    expenses: currentStats.expenses,
                    paymentRate: currentStats.paymentRate,
                    avgGrade: currentStats.avgGrade,
                    successRate: currentStats.successRate,
                    attendanceRate: ownerData?.attendance?.rate ?? null,
                    lateRate: ownerData?.attendance?.lateRate ?? null,
                    payroll: ownerData?.hr?.payroll ?? 0,
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
        Chargement des rapports...
      </div>
    }>
      <ReportsPageInner />
    </Suspense>
  );
}

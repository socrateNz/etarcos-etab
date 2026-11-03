import type { Metadata } from "next";
import { SchoolDashboardWidgets } from "@/components/dashboard/school-dashboard-widgets";
import { FamilyDashboard } from "@/components/dashboard/family-dashboard";
import { isStudentScopedRole } from "@/lib/auth/active-etab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CalendarDays, CheckCircle2,
  Clock, GraduationCap, TrendingUp
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminDashboard } from "@/components/dashboard/superadmin-dashboard";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { getSupportStatsAction } from "@/features/support/actions";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// Quick actions for school dashboard
const QUICK_ACTIONS = [
  { label: "Inscrire un élève", href: "/students", icon: GraduationCap, color: "text-brand-500" },
  { label: "Saisir des notes", href: "/grades", icon: TrendingUp, color: "text-violet-500" },
  { label: "Enregistrer un paiement", href: "/payments", icon: CheckCircle2, color: "text-emerald-500" },
  { label: "Voir l'emploi du temps", href: "/timetables", icon: CalendarDays, color: "text-cyan-500" },
];

export default async function DashboardPage() {
  const session = await auth();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const isOwner = session?.user?.role === "owner";
  const role = session?.user?.role;

  // Parents et élèves : tableau de bord limité à leurs propres élèves.
  if (role && isStudentScopedRole(role)) {
    return (
      <FamilyDashboard
        role={role as "parent" | "student"}
        establishmentId={session?.user?.establishment_id ?? null}
      />
    );
  }

  // Impayés nominatifs : réservés aux rôles ayant accès aux paiements.
  const canSeeFinance = isSuperAdmin || (session?.user?.permissions ?? []).includes("payments:view");

  let establishmentsValue = 0;
  let saasRevenueValue = 0;
  let ownersValue = 0;
  let usersValue = 0;
  let studentsValue = 0;
  let recentSchoolsList: any[] = [];
  let establishments: any[] = [];

  let schoolPendingPayments: any[] = [];
  let schoolUpcomingEvents: any[] = [];

  let regionDistributionList: any[] = [];
  let evolutionDataList: any[] = [];
  let newUsersDataList: any[] = [];
  let revenueDataList: any[] = [];
  let planDataList: any[] = [];
  let recentActivitiesList: any[] = [];
  const platformAlerts: { level: "danger" | "warning"; text: string }[] = [];
  let supportStats: { open: number; pending: number; resolvedToday: number } | null = null;
  const platformKpis = { paidPlans: 0, blocked: 0, newThisMonth: 0, newLastMonth: 0 };

  // Services configurés (lecture des variables d'environnement, côté serveur).
  const services = [
    { name: "Base de données (Supabase)", ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: "Emails (SMTP)", ok: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) },
    { name: "Stockage photos (Cloudinary)", ok: !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) },
    { name: "Assistant IA (Gemini)", ok: !!process.env.GEMINI_API_KEY },
    { name: "Suivi des erreurs (Sentry)", ok: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) },
    { name: "Anti-abus (Upstash)", ok: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) },
  ];

  try {
    const supabase = (await createAdminClient()) as any;

    if (isOwner) {
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("user_id", session!.user.id)
        .maybeSingle();

      if (owner) {
        const { data: links } = await supabase
          .from("establishment_owners")
          .select("establishment:establishments(*)")
          .eq("owner_id", owner.id);
        
        establishments = links?.map((l: any) => l.establishment).filter(Boolean) ?? [];
      }
    }

    if (isSuperAdmin) {
      // Super Admin Dashboard Queries (Global SaaS platform statistics)
      const { count: estCount } = await supabase.from("establishments").select("id", { count: "exact", head: true });
      const { count: ownCount } = await supabase.from("owners").select("id", { count: "exact", head: true });
      const { count: usrCount } = await supabase.from("users").select("id", { count: "exact", head: true });
      const { count: studCount } = await supabase.from("students").select("id", { count: "exact", head: true });
      const { data: payData } = await supabase.from("payments").select("amount_paid, created_at");
      
      establishmentsValue = estCount || 0;
      ownersValue = ownCount || 0;
      usersValue = usrCount || 0;
      studentsValue = studCount || 0;
      saasRevenueValue = payData?.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0) || 0;
      
      const { data: estList } = await supabase
        .from("establishments")
        .select("name, created_at, id, city, plan, status")
        .order("created_at", { ascending: false });

      // Alertes calculées à partir des données réelles.
      if (estList) {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        for (const e of estList as any[]) {
          if (e.plan && e.plan !== "free") platformKpis.paidPlans += 1;
          if (e.status && e.status !== "active") platformKpis.blocked += 1;
          const created = new Date(e.created_at);
          if (created >= thisMonth) platformKpis.newThisMonth += 1;
          else if (created >= lastMonth) platformKpis.newLastMonth += 1;
        }
        const blocked = estList.filter((e: any) => e.status && e.status !== "active").length;
        if (blocked > 0) {
          platformAlerts.push({ level: "warning", text: `${blocked} établissement(s) non actif(s) (suspendu, inactif ou en attente)` });
        }
        const { data: studentEsts } = await supabase.from("students").select("establishment_id");
        const withStudents = new Set((studentEsts ?? []).map((r: any) => r.establishment_id));
        const empty = estList.filter(
          (e: any) => e.id !== "00000000-0000-0000-0000-000000000000" && !withStudents.has(e.id)
        ).length;
        if (empty > 0) {
          platformAlerts.push({ level: "warning", text: `${empty} établissement(s) sans aucun élève inscrit` });
        }
      }
      const missing = services.filter((svc) => !svc.ok);
      if (missing.length > 0) {
        platformAlerts.push({ level: "danger", text: `Services non configurés : ${missing.map((m) => m.name).join(", ")}` });
      }

      const supportRes = await getSupportStatsAction();
      supportStats = supportRes.data ?? null;
        
      if (estList) {
        recentSchoolsList = estList.slice(0, 5).map((e: any) => ({
          name: e.name,
          plan: e.plan || "free",
          status: e.status || "active",
          date: new Date(e.created_at).toLocaleDateString("fr-FR")
        }));

        // 1. Region distribution
        const cityCountMap: { [key: string]: number } = {};
        estList.forEach((e: any) => {
          const city = e.city || "Autres Régions";
          cityCountMap[city] = (cityCountMap[city] || 0) + 1;
        });
        const totalCitiesCount = estList.length || 1;
        regionDistributionList = Object.entries(cityCountMap).map(([name, count]) => ({
          name,
          count,
          percentage: `${Math.round((count / totalCitiesCount) * 100)}%`
        }));

        // 2. Evolution data
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        const evolutionMap = monthNames.map(m => ({ name: m, e: 0 }));
        estList.forEach((e: any) => {
          const date = new Date(e.created_at);
          const m = monthNames[date.getMonth()];
          const item = evolutionMap.find(x => x.name === m);
          if (item) item.e += 1;
        });
        let cumEst = 0;
        evolutionDataList = evolutionMap.map(d => {
          cumEst += d.e;
          return { name: d.name, e: cumEst };
        });

        // 3. Plan distribution
        const planCountMap: { [key: string]: number } = {};
        estList.forEach((e: any) => {
          const plan = e.plan || "Gratuit";
          planCountMap[plan] = (planCountMap[plan] || 0) + 1;
        });
        planDataList = Object.entries(planCountMap).map(([name, value]) => ({
          name,
          value
        }));
      }

      // 4. New users data
      const { data: recentUsers } = await supabase
        .from("users")
        .select("created_at");
      if (recentUsers) {
        const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const newUsersMap = days.map(d => ({ name: d, u: 0 }));
        recentUsers.forEach((u: any) => {
          const date = new Date(u.created_at);
          const dName = days[date.getDay()];
          const item = newUsersMap.find(x => x.name === dName);
          if (item) item.u += 1;
        });
        newUsersDataList = newUsersMap;
      }

      // 5. Revenue data
      if (payData) {
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
        const revenueMap = monthNames.map(m => ({ name: m, r: 0 }));
        payData.forEach((p: any) => {
          const date = new Date(p.created_at);
          const m = monthNames[date.getMonth()];
          const item = revenueMap.find(x => x.name === m);
          if (item) item.r += Number(p.amount_paid || 0);
        });
        revenueDataList = revenueMap;
      }

      // 6. Recent activities
      const { data: recentSubscribers } = await supabase
        .from("owners")
        .select("name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const superAdminActivities: any[] = [];
      if (estList) {
        estList.slice(0, 5).forEach((e: any, idx: number) => {
          superAdminActivities.push({
            id: `etab-${idx}`,
            text: `Nouvel établissement créé : ${e.name}`,
            time: new Date(e.created_at).toLocaleDateString("fr-FR"),
            status: "success"
          });
        });
      }
      if (recentSubscribers) {
        recentSubscribers.forEach((o: any, idx: number) => {
          superAdminActivities.push({
            id: `owner-${idx}`,
            text: `Nouveau propriétaire inscrit : ${o.name}`,
            time: new Date(o.created_at).toLocaleDateString("fr-FR"),
            status: "success"
          });
        });
      }
      superAdminActivities.sort((a, b) => b.id.localeCompare(a.id));
      recentActivitiesList = superAdminActivities.slice(0, 5);
    } else if (session?.user?.establishment_id) {
      // School-level Dashboard Queries (Isolated Tenant statistics)
      const estId = session.user.establishment_id;

      const { data: dbPayments } = canSeeFinance
        ? await supabase
            .from("payments")
            .select("id, amount, amount_paid, created_at, due_date, status, student:students(user:users(name), classroom:classrooms(name))")
            .eq("establishment_id", estId)
            .in("status", ["pending", "partial", "overdue"])
            .order("created_at", { ascending: true })
            .limit(5)
        : { data: null };

      if (dbPayments) {
        schoolPendingPayments = dbPayments.map((p: any) => {
          const amt = Number(p.amount || 0);
          const paid = Number(p.amount_paid || 0);
          return {
            id: p.id,
            student: p.student?.user?.name || "Élève",
            class: p.student?.classroom?.name || "Sans classe",
            amount: amt - paid,
            due: (p.due_date || p.created_at).split('T')[0]
          };
        });
      }

      // Query upcoming exams
      const { data: dbExams } = await supabase
        .from("exams")
        .select("title, exam_date")
        .eq("establishment_id", estId)
        .gte("exam_date", new Date().toISOString().split('T')[0])
        .order("exam_date", { ascending: true })
        .limit(4);

      if (dbExams) {
        schoolUpcomingEvents = dbExams.map((ex: any) => ({
          title: ex.title,
          date: ex.exam_date,
          type: "exam"
        }));
      }
    }
  } catch (err) {
    console.error("Erreur lors de la récupération SQL :", err);
  }

  if (isSuperAdmin) {
    return (
      <SuperAdminDashboard
        stats={{
          establishments: establishmentsValue,
          owners: ownersValue,
          users: usersValue,
          students: studentsValue,
          revenue: saasRevenueValue,
          recentSchools: recentSchoolsList
        }}
        regionDistribution={regionDistributionList}
        evolutionData={evolutionDataList}
        newUsersData={newUsersDataList}
        revenueData={revenueDataList}
        planData={planDataList}
        recentActivities={recentActivitiesList}
        services={services}
        alerts={platformAlerts}
        supportStats={supportStats}
        platformKpis={platformKpis}
      />
    );
  }

  if (isOwner) {
    return <OwnerDashboard establishments={establishments} />;
  }

  // Otherwise render standard school dashboard
  return (
    <div className="space-y-6">
      {/* KPI, graphiques et activités (un seul appel à /api/dashboard) */}
      <SchoolDashboardWidgets />

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
            <CardDescription>Accès direct aux fonctions clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-sm font-medium flex-1">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        {canSeeFinance && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Paiements en attente</CardTitle>
                <CardDescription>Scolarités non réglées</CardDescription>
              </div>
              <Badge variant="destructive" className="text-[10px]">
                {schoolPendingPayments.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {schoolPendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun reste à charge en cours.</p>
            ) : (
              <div className="space-y-3">
                {schoolPendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{payment.student}</p>
                      <p className="text-xs text-muted-foreground">{payment.class}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-destructive">
                        {formatCurrency(payment.amount)}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Échéance {formatDate(payment.due)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/payments" className="block w-full">
              <Button variant="outline" size="sm" className="w-full mt-4">
                Voir tous les paiements
              </Button>
            </Link>
          </CardContent>
        </Card>
        )}

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Examens à venir</CardTitle>
            <CardDescription>Prochaines évaluations planifiées</CardDescription>
          </CardHeader>
          <CardContent>
            {schoolUpcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun examen planifié.</p>
            ) : (
              <div className="space-y-3">
                {schoolUpcomingEvents.map((event) => (
                  <div
                    key={`${event.title}-${event.date}`}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium leading-none">
                        {new Date(event.date).toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                      <span className="text-base font-bold leading-none mt-0.5">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 mt-1 border-0 bg-muted px-1.5"
                      >
                        Examen
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/timetables" className="block w-full">
              <Button variant="outline" size="sm" className="w-full mt-4">
                Voir le calendrier
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

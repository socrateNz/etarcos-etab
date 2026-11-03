import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId, isStudentScopedRole } from "@/lib/auth/active-etab";
import {
  buildMonthlySeries,
  currentAcademicYear,
  sumForMonth,
  type SchoolDashboardData,
} from "@/lib/dashboard/school-stats";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Statistiques de toute l'école : réservées au personnel.
  const role = session.user.role;
  if (isStudentScopedRole(role)) {
    return NextResponse.json({ error: "Tableau de bord réservé au personnel." }, { status: 403 });
  }

  try {
    const supabase = (await createAdminClient()) as any;
    const estId = await resolveEstablishmentId(session.user.establishment_id);
    if (!estId) {
      return NextResponse.json({ error: "Aucun établissement associé à votre compte." }, { status: 400 });
    }

    // Données financières : uniquement avec la permission payments:view.
    const canSeeFinance = role === "super_admin" || session.user.permissions.includes("payments:view");
    const year = currentAcademicYear();
    const yearStart = year.start.toISOString();

    const [studentsRes, staffRes, paymentsRes, expensesRes, recentStudentsRes, gradesRes] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("establishment_id", estId),
      supabase.from("staff_members").select("id", { count: "exact", head: true }).eq("establishment_id", estId),
      canSeeFinance
        ? supabase
            .from("payments")
            .select("id, amount_paid, payment_date, created_at, student:students(user:users(name))")
            .eq("establishment_id", estId)
            .gte("created_at", yearStart)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      canSeeFinance
        ? supabase
            .from("expenses")
            .select("amount, expense_date, created_at")
            .eq("establishment_id", estId)
            .gte("expense_date", yearStart.slice(0, 10))
        : Promise.resolve({ data: [] }),
      supabase
        .from("students")
        .select("id, created_at, user:users(name), classroom:classrooms(name)")
        .eq("establishment_id", estId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("grades")
        .select("value, max_value, classroom:classrooms(name)")
        .eq("establishment_id", estId),
    ]);

    for (const r of [studentsRes, staffRes, paymentsRes, expensesRes, recentStudentsRes, gradesRes]) {
      if (r?.error) throw r.error;
    }

    const payments: any[] = paymentsRes.data ?? [];
    const expenses: any[] = expensesRes.data ?? [];

    const incomes = payments.map((p) => ({ date: p.payment_date || p.created_at, amount: p.amount_paid }));
    const outgoings = expenses.map((e) => ({ date: e.expense_date || e.created_at, amount: e.amount }));

    // Moyennes
    // Ramène chaque note sur 20 (le barème `max_value` peut différer).
    const on20 = (g: any) => {
      const max = Number(g.max_value || 20);
      return max > 0 ? (Number(g.value || 0) / max) * 20 : 0;
    };
    const grades: any[] = gradesRes.data ?? [];
    const average =
      grades.length > 0
        ? Number((grades.reduce((acc, g) => acc + on20(g), 0) / grades.length).toFixed(2))
        : null;

    const perClass = new Map<string, { total: number; count: number }>();
    for (const g of grades) {
      const name = g.classroom?.name || "Sans classe";
      const entry = perClass.get(name) ?? { total: 0, count: 0 };
      entry.total += on20(g);
      entry.count += 1;
      perClass.set(name, entry);
    }
    const classPerformance = [...perClass.entries()]
      .map(([classe, d]) => ({ classe, moyenne: Number((d.total / d.count).toFixed(1)) }))
      .sort((a, b) => a.classe.localeCompare(b.classe, "fr"));

    // Activités récentes (faits réels, sans auteur inventé)
    const activities: SchoolDashboardData["recentActivities"] = [];
    for (const s of recentStudentsRes.data ?? []) {
      activities.push({
        id: `stud-${s.id}`,
        title: `Inscription : ${s.user?.name || "élève"}`,
        detail: s.classroom?.name ? `Classe ${s.classroom.name}` : "Sans classe",
        time: s.created_at,
        type: "enrollment",
      });
    }
    for (const p of payments.slice(0, 5)) {
      activities.push({
        id: `pay-${p.id}`,
        title: `Paiement : ${Number(p.amount_paid || 0).toLocaleString("fr-FR")} FCFA`,
        detail: p.student?.user?.name || "Élève",
        time: p.created_at,
        type: "payment",
      });
    }
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const body: SchoolDashboardData = {
      academicYear: year.label,
      canSeeFinance,
      kpis: {
        students: studentsRes.count ?? 0,
        staff: staffRes.count ?? 0,
        monthRevenue: canSeeFinance ? sumForMonth(incomes) : null,
        averageGrade: average,
      },
      monthlyRevenue: canSeeFinance ? buildMonthlySeries(incomes, outgoings, year) : [],
      classPerformance,
      recentActivities: activities.slice(0, 8),
    };

    return NextResponse.json(body);
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api/dashboard" } });
    return NextResponse.json({ error: "Impossible de charger le tableau de bord." }, { status: 500 });
  }
}

import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId } from "@/lib/auth/active-etab";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const supabase = (await createAdminClient()) as any;
    const estId = await resolveEstablishmentId(session.user.establishment_id);
    if (!estId) {
      return NextResponse.json({ error: "Aucun établissement associé à votre compte." }, { status: 400 });
    }

    // 1. Fetch counts from database
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", estId);

    const { count: staffCount } = await supabase
      .from("staff_members")
      .select("*", { count: "exact", head: true })
      .eq("establishment_id", estId);

    // 2. Fetch monthly payments sum
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, amount_paid, created_at, status, student:students(user:users(name), classroom:classrooms(name))")
      .eq("establishment_id", estId);

    const totalPayments = payments?.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0) || 0;

    // 3. Construct recent activities from database rows
    const { data: recentStudents } = await supabase
      .from("students")
      .select("created_at, user:users(name)")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentPayments } = await supabase
      .from("payments")
      .select("amount_paid, created_at, student:students(user:users(name))")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false })
      .limit(5);

    const dbActivities: any[] = [];
    if (recentStudents) {
      recentStudents.forEach((s: any) => {
        dbActivities.push({
          id: `stud-${s.user?.name}-${s.created_at}`,
          user: { name: "Secrétaire", role: "Secrétaire" },
          action: "a inscrit",
          target: `${s.user?.name || "Nouvel élève"}`,
          time: s.created_at,
          type: "enrollment"
        });
      });
    }
    if (recentPayments) {
      recentPayments.forEach((p: any) => {
        dbActivities.push({
          id: `pay-${p.created_at}`,
          user: { name: "Comptable", role: "Comptable" },
          action: "a enregistré un paiement de",
          target: `${Number(p.amount_paid).toLocaleString()} FCFA pour ${p.student?.user?.name || "élève"}`,
          time: p.created_at,
          type: "payment"
        });
      });
    }
    dbActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 4. Pending payments
    const pendingPayments = payments
      ?.filter((p: any) => p.status !== "paid")
      .slice(0, 5)
      .map((p: any) => {
        const amt = Number(p.amount || 0);
        const paid = Number(p.amount_paid || 0);
        return {
          student: p.student?.user?.name || "Élève",
          class: p.student?.classroom?.name || "Sans classe",
          amount: amt - paid,
          due: p.created_at
        };
      }) || [];

    // 5. Monthly financial chart grouping
    const monthNames = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun"];
    const monthlyData = monthNames.map(m => ({ month: m, revenus: 0, depenses: 0 }));
    
    payments?.forEach((p: any) => {
      const date = new Date(p.created_at);
      const monthIndex = date.getMonth();
      const mappedMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      const monthStr = mappedMonths[monthIndex];
      const chartItem = monthlyData.find(item => item.month === monthStr);
      if (chartItem) {
        chartItem.revenus += Number(p.amount_paid || 0);
      }
    });

    // 6. Fetch average grades overall and per classroom
    const { data: dbGrades } = await supabase
      .from("grades")
      .select("value, classroom:classrooms(name)")
      .eq("establishment_id", estId);

    const overallAvg = dbGrades && dbGrades.length > 0
      ? (dbGrades.reduce((acc: number, g: any) => acc + Number(g.value || 0), 0) / dbGrades.length).toFixed(2)
      : "N/A";

    const classroomMoyennesMap: { [key: string]: { total: number; count: number } } = {};
    (dbGrades || []).forEach((g: any) => {
      const clsName = g.classroom?.name || "Sans classe";
      if (!classroomMoyennesMap[clsName]) {
        classroomMoyennesMap[clsName] = { total: 0, count: 0 };
      }
      classroomMoyennesMap[clsName].total += Number(g.value || 0);
      classroomMoyennesMap[clsName].count += 1;
    });

    const classPerformance = Object.entries(classroomMoyennesMap).map(([classe, data]) => ({
      classe,
      moyenne: Number((data.total / data.count).toFixed(1))
    }));

    return NextResponse.json({
      kpis: [
        { title: "Total Élèves", value: studentCount || 0, trend: 0, subtitle: "Inscrits cette année", color: "brand" },
        { title: "Revenus du mois", value: totalPayments, trend: 0, subtitle: "Total reçu", color: "success" },
        { title: "Personnel actif", value: staffCount || 0, trend: 0, subtitle: "Enseignants & Admin", color: "violet" },
        { title: "Moyenne générale", value: overallAvg === "N/A" ? "N/A" : `${overallAvg}/20`, trend: 0, subtitle: overallAvg === "N/A" ? "Aucune note enregistrée" : "Notes saisies", color: "cyan" },
      ],
      recentActivities: dbActivities,
      pendingPayments: pendingPayments,
      upcomingEvents: [],
      monthlyRevenue: monthlyData,
      classPerformance: classPerformance
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

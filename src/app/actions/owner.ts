"use server";

import { auth } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveEstablishmentId } from "@/lib/auth/active-etab";

async function requireOwnerOrAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "owner" && session.user.role !== "super_admin")) {
    throw new Error("Accès refusé.");
  }
  return session;
}

export async function getOwnerDashboardData(
  mode: "global" | "single" | "compare",
  selectedId: string | null,
  compareIds: string[]
) {
  const session = await requireOwnerOrAdmin();
  const db = (await createAdminClient()) as any;
  const isSuperAdmin = session.user.role === "super_admin";

  // 1. Resolve establishments belonging to this owner
  let ownedIds: string[] = [];
  if (isSuperAdmin) {
    const { data } = await db.from("establishments").select("id");
    ownedIds = data?.map((e: any) => e.id) ?? [];
  } else {
    const { data: owner } = await db
      .from("owners")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (owner) {
      const { data: links } = await db
        .from("establishment_owners")
        .select("establishment_id")
        .eq("owner_id", owner.id);
      ownedIds = links?.map((l: any) => l.establishment_id) ?? [];
    }
  }

  // Determine active target IDs for queries
  let targetIds: string[] = [];
  if (mode === "global") {
    targetIds = ownedIds;
  } else if (mode === "single" && selectedId) {
    targetIds = [selectedId];
  } else if (mode === "compare") {
    targetIds = compareIds.length > 0 ? compareIds : ownedIds;
  }

  if (targetIds.length === 0) {
    return {
      stats: { establishmentsCount: 0, students: 0, staff: 0, parents: 0 },
      finance: { revenues: 0, expenses: 0, profit: 0, paymentRate: 0 },
      academic: { avgGrade: 0, successRate: 0, bestEtab: "N/A" },
      recentPayments: [],
      recentActivities: [],
      alerts: [],
      charts: {
        revenues: [],
        expenses: [],
        enrollments: [],
        distribution: []
      },
      ranking: []
    };
  }

  // 2. Fetch actual database stats
  const [
    studentsCountRes,
    staffCountRes,
    parentsCountRes,
    paymentsDataRes,
    expensesDataRes,
    gradesDataRes
  ] = await Promise.all([
    db.from("students").select("id", { count: "exact", head: true }).in("establishment_id", targetIds),
    db.from("staff_members").select("id", { count: "exact", head: true }).in("establishment_id", targetIds),
    db.from("parents").select("id", { count: "exact", head: true }).in("establishment_id", targetIds),
    db.from("payments").select("amount, amount_paid, created_at, status, student:students(user:users(name), classroom:classrooms(name))").in("establishment_id", targetIds),
    db.from("expenses").select("amount, created_at, category").in("establishment_id", targetIds),
    db.from("grades").select("value").in("establishment_id", targetIds)
  ]);

  const studentsCount = studentsCountRes.count || 0;
  const staffCount = staffCountRes.count || 0;
  const parentsCount = parentsCountRes.count || 0;
  const paymentsData = paymentsDataRes.data || [];
  const expensesData = expensesDataRes.data || [];
  const gradesData = gradesDataRes.data || [];

  // Calculations
  const totalRevenues = paymentsData.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0);
  const totalExpenses = expensesData.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const totalProfit = totalRevenues - totalExpenses;

  const totalBilled = paymentsData.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
  const paymentRate = totalBilled > 0 ? Math.round((totalRevenues / totalBilled) * 100) : 0;

  const avgGradeVal = gradesData.length > 0 
    ? Number((gradesData.reduce((acc: number, g: any) => acc + Number(g.value || 0), 0) / gradesData.length).toFixed(2))
    : 0;

  const stats = {
    establishmentsCount: targetIds.length,
    students: studentsCount,
    staff: staffCount,
    parents: parentsCount,
  };

  const finance = {
    revenues: totalRevenues,
    expenses: totalExpenses,
    profit: totalProfit,
    paymentRate: paymentRate,
  };

  const passingGradesCount = gradesData.filter((g: any) => Number(g.value || 0) >= 10).length;
  const successRateVal = gradesData.length > 0 ? Math.round((passingGradesCount / gradesData.length) * 100) : 0;

  const academic = {
    avgGrade: avgGradeVal,
    successRate: successRateVal,
    bestEtab: "N/A",
  };

  // Recent payments
  let recentPaymentsList: any[] = [];
  if (paymentsData.length > 0) {
    recentPaymentsList = paymentsData
      .slice(0, 5)
      .map((p: any) => ({
        type: "success",
        title: p.amount_paid > 0 ? "Paiement reçu" : "Facture générée",
        message: `${p.student?.user?.name || "Élève"} - ${p.student?.classroom?.name || "Sans classe"}`,
        amount: p.amount_paid || p.amount
      }));
  }

  // Recent activities from DB
  const [recentStudentsRes, recentPaymentsRes] = await Promise.all([
    db.from("students")
      .select("created_at, user:users(name), establishment:establishments(name)")
      .in("establishment_id", targetIds)
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("payments")
      .select("amount_paid, created_at, student:students(user:users(name)), establishment:establishments(name)")
      .in("establishment_id", targetIds)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const recentStudentsData = recentStudentsRes.data || [];
  const recentPaymentsData = recentPaymentsRes.data || [];

  const dbActivities: any[] = [];
  recentStudentsData.forEach((s: any) => {
    dbActivities.push({
      text: `Élève inscrit : ${s.user?.name || "Nouvel élève"}`,
      school: s.establishment?.name || "Établissement",
      time: s.created_at
    });
  });
  recentPaymentsData.forEach((p: any) => {
    dbActivities.push({
      text: `Paiement enregistré : ${Number(p.amount_paid || 0).toLocaleString()} FCFA pour ${p.student?.user?.name || "élève"}`,
      school: p.establishment?.name || "Établissement",
      time: p.created_at
    });
  });
  dbActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const recentActivitiesList = dbActivities.slice(0, 5).map(act => ({
    text: act.text,
    school: act.school
  }));

  // Alerts from DB
  const unpaidPaymentsCount = paymentsData.filter((p: any) => p.status !== "paid").length;
  const alertsList: any[] = [];
  if (unpaidPaymentsCount > 0) {
    alertsList.push({
      title: `${unpaidPaymentsCount} paiement(s) en attente`,
      desc: "Retards de règlement sur les frais de scolarité constatés.",
      type: "danger"
    });
  }

  // Charts data preparation
  const monthNames = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
  const monthlyRevenueData = monthNames.map(m => ({ name: m, Revenus: 0, Dépenses: 0 }));
  
  const mappedMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  
  paymentsData.forEach((p: any) => {
    const date = new Date(p.created_at);
    const monthIndex = date.getMonth();
    const monthStr = mappedMonths[monthIndex] === "Juin" ? "Juin" : (mappedMonths[monthIndex] === "Juil" ? "Juin" : (mappedMonths[monthIndex] === "Août" ? "Juin" : mappedMonths[monthIndex]));
    const monthName = monthNames.find(m => m.startsWith(monthStr.substring(0, 3)));
    const chartItem = monthlyRevenueData.find(item => item.name === monthName);
    if (chartItem) {
      chartItem.Revenus += Number(p.amount_paid || 0);
    }
  });

  expensesData.forEach((e: any) => {
    const date = new Date(e.created_at);
    const monthIndex = date.getMonth();
    const monthStr = mappedMonths[monthIndex] === "Juin" ? "Juin" : (mappedMonths[monthIndex] === "Juil" ? "Juin" : (mappedMonths[monthIndex] === "Août" ? "Juin" : mappedMonths[monthIndex]));
    const monthName = monthNames.find(m => m.startsWith(monthStr.substring(0, 3)));
    const chartItem = monthlyRevenueData.find(item => item.name === monthName);
    if (chartItem) {
      chartItem.Dépenses += Number(e.amount || 0);
    }
  });

  const categoryMap: { [key: string]: number } = {};
  expensesData.forEach((e: any) => {
    const cat = e.category || "Autre";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
  });
  const expensesDistribution = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    Dépenses: val
  }));
  if (expensesDistribution.length === 0) {
    expensesDistribution.push({ name: "Aucune dépense", Dépenses: 0 });
  }

  // Enrollments cumulative history from DB
  const { data: studentsYears } = await db.from("students").select("created_at").in("establishment_id", targetIds);
  const yearsMap: { [key: string]: number } = {};
  (studentsYears || []).forEach((s: any) => {
    const yr = new Date(s.created_at).getFullYear().toString();
    yearsMap[yr] = (yearsMap[yr] || 0) + 1;
  });
  
  const years = Object.keys(yearsMap).sort();
  let cumulative = 0;
  const enrollmentsHistory = years.map(yr => {
    cumulative += yearsMap[yr];
    return { year: yr, Effectif: cumulative };
  });
  if (enrollmentsHistory.length === 0) {
    enrollmentsHistory.push({ year: new Date().getFullYear().toString(), Effectif: 0 });
  }

  // Ranking & Distribution
  let rankingList: any[] = [];
  let distributionList: any[] = [];
  
  if (mode === "global" || mode === "compare") {
    const { data: etabsList } = await db
      .from("establishments")
      .select("id, name")
      .in("id", ownedIds);

    if (etabsList) {
      rankingList = await Promise.all(
        etabsList.map(async (e: any) => {
          const [sRes, stRes, pRes, gRes] = await Promise.all([
            db.from("students").select("id", { count: "exact", head: true }).eq("establishment_id", e.id),
            db.from("staff_members").select("id", { count: "exact", head: true }).eq("establishment_id", e.id),
            db.from("payments").select("amount, amount_paid").eq("establishment_id", e.id),
            db.from("grades").select("value").eq("establishment_id", e.id)
          ]);

          const sCount = sRes.count || 0;
          const staffCount = stRes.count || 0;
          const pData = pRes.data || [];
          const gData = gRes.data || [];

          const r = pData.reduce((acc: number, x: any) => acc + Number(x.amount_paid || 0), 0);
          const b = pData.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
          const rate = b > 0 ? Math.round((r / b) * 100) : 0;

          const avgG = gData.length > 0
            ? Number((gData.reduce((acc: number, g: any) => acc + Number(g.value || 0), 0) / gData.length).toFixed(2))
            : 0;

          const passingGrades = gData.filter((g: any) => Number(g.value || 0) >= 10).length;
          const sRate = gData.length > 0 ? Math.round((passingGrades / gData.length) * 100) : 0;

          return {
            id: e.id,
            name: e.name,
            students: sCount,
            staff: staffCount,
            revenues: r,
            paymentRate: rate,
            avgGrade: avgG,
            successRate: sRate
          };
        })
      );

      distributionList = rankingList.map((item: any) => ({
        name: item.name,
        value: item.students
      }));
    }
  }

  // Set best establishment based on actual average grades
  if (rankingList.length > 0) {
    const sortedByGrade = [...rankingList].sort((a, b) => b.avgGrade - a.avgGrade);
    if (sortedByGrade[0] && sortedByGrade[0].avgGrade > 0) {
      academic.bestEtab = sortedByGrade[0].name;
    }
  }

  // Fetch upcoming exams from DB
  const { data: dbExams } = await db
    .from("exams")
    .select("title, exam_date, establishment:establishments(name)")
    .in("establishment_id", targetIds)
    .gte("exam_date", new Date().toISOString().split('T')[0])
    .order("exam_date", { ascending: true })
    .limit(5);

  const upcomingEventsList = (dbExams || []).map((ex: any) => ({
    title: ex.title,
    date: ex.exam_date,
    school: ex.establishment?.name || "Établissement"
  }));

  // Fetch attendances from DB
  const { data: dbAttendances } = await db
    .from("attendances")
    .select("status, date")
    .in("establishment_id", targetIds);

  const totalAttendances = dbAttendances?.length || 0;
  const presentCount = dbAttendances?.filter((a: any) => a.status === "present").length || 0;
  const lateCount = dbAttendances?.filter((a: any) => a.status === "late").length || 0;

  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;
  const lateRate = totalAttendances > 0 ? Math.round((lateCount / totalAttendances) * 100) : 0;

  // Daily attendance rates
  const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const dayRatesMap: { [key: string]: { total: number; present: number } } = {
    "Lundi": { total: 0, present: 0 },
    "Mardi": { total: 0, present: 0 },
    "Mercredi": { total: 0, present: 0 },
    "Jeudi": { total: 0, present: 0 },
    "Vendredi": { total: 0, present: 0 }
  };

  (dbAttendances || []).forEach((a: any) => {
    const dayName = daysOfWeek[new Date(a.date).getDay()];
    if (dayName in dayRatesMap) {
      dayRatesMap[dayName].total += 1;
      if (a.status === "present") {
        dayRatesMap[dayName].present += 1;
      }
    }
  });

  const attendanceHistory = Object.entries(dayRatesMap).map(([day, stats]) => ({
    day,
    Presence: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
  }));

  return {
    stats,
    finance,
    academic,
    attendance: {
      rate: attendanceRate,
      lateRate: lateRate,
      history: attendanceHistory
    },
    recentPayments: recentPaymentsList,
    recentActivities: recentActivitiesList,
    alerts: alertsList,
    upcomingEvents: upcomingEventsList,
    charts: {
      revenues: monthlyRevenueData,
      expenses: expensesDistribution,
      enrollments: enrollmentsHistory,
      distribution: distributionList
    },
    ranking: rankingList
  };
}

export async function getAccountingPageData() {
  const session = await requireOwnerOrAdmin();
  const db = (await createAdminClient()) as any;

  const estId = await resolveEstablishmentId(
    session.user.establishment_id
  );

  let queryPayments = db.from("payments").select("amount, amount_paid, created_at, status, student:students(user:users(name)), fee_category:fee_categories(name)");
  let queryExpenses = db.from("expenses").select("amount, created_at, category, description");

  if (estId) {
    queryPayments = queryPayments.eq("establishment_id", estId);
    queryExpenses = queryExpenses.eq("establishment_id", estId);
  }

  const [paymentsRes, expensesRes] = await Promise.all([
    queryPayments.order("created_at", { ascending: false }),
    queryExpenses.order("created_at", { ascending: false })
  ]);

  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];

  // Consolidate list of transactions
  const transactions = [
    ...payments.map((p: any) => ({
      id: p.id,
      type: "income" as const,
      category: p.fee_category?.name || "Frais Scolaires",
      description: `Règlement de ${p.student?.user?.name || "Élève"}`,
      amount: Number(p.amount_paid || 0),
      date: p.created_at
    })),
    ...expenses.map((e: any) => ({
      id: e.id,
      type: "expense" as const,
      category: e.category,
      description: e.description,
      amount: Number(e.amount || 0),
      date: e.created_at
    }))
  ];

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncomes = payments.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0);
  const totalExpenses = expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const balance = totalIncomes - totalExpenses;

  return {
    totalIncomes,
    totalExpenses,
    balance,
    transactions: transactions.slice(0, 30) // show latest 30 transactions
  };
}

export async function forceUpdatePasswordAction(newPassword: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non authentifié." };

  try {
    const db = await createAdminClient();
    
    // Update user password and set requires_password_change metadata flag to false
    const { error } = await db.auth.admin.updateUserById(session.user.id, {
      password: newPassword,
      user_metadata: {
        ...session.user, // preserve metadata
        requires_password_change: false
      }
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Calculs purs du tableau de bord établissement (testables sans base).
 */

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

/** Mois de rentrée (0 = janvier) : septembre. */
const SCHOOL_YEAR_START_MONTH = 8;

export type AcademicYear = { label: string; start: Date; end: Date };

/** Année scolaire courante : de septembre à fin août. */
export function currentAcademicYear(now: Date = new Date()): AcademicYear {
  const startYear = now.getMonth() >= SCHOOL_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
  return {
    label: `${startYear}/${startYear + 1}`,
    start: new Date(startYear, SCHOOL_YEAR_START_MONTH, 1),
    end: new Date(startYear + 1, SCHOOL_YEAR_START_MONTH, 1),
  };
}

export type MonthlyPoint = { month: string; revenus: number; depenses: number };

type Dated = { date: string | null | undefined; amount: number | string | null | undefined };

/**
 * Série mensuelle (septembre → août) des encaissements et des dépenses de
 * l'année scolaire donnée. Les montants hors de l'année sont ignorés.
 */
export function buildMonthlySeries(
  incomes: Dated[],
  expenses: Dated[],
  year: AcademicYear
): MonthlyPoint[] {
  const points: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => ({
    month: MONTHS_FR[(SCHOOL_YEAR_START_MONTH + i) % 12],
    revenus: 0,
    depenses: 0,
  }));

  const indexOf = (raw: string | null | undefined): number => {
    if (!raw) return -1;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()) || d < year.start || d >= year.end) return -1;
    return (d.getFullYear() - year.start.getFullYear()) * 12 + d.getMonth() - SCHOOL_YEAR_START_MONTH;
  };

  for (const p of incomes) {
    const i = indexOf(p.date);
    if (i >= 0 && i < 12) points[i].revenus += Number(p.amount || 0);
  }
  for (const e of expenses) {
    const i = indexOf(e.date);
    if (i >= 0 && i < 12) points[i].depenses += Number(e.amount || 0);
  }
  return points;
}

/** Somme des montants datés du mois calendaire de `now`. */
export function sumForMonth(rows: Dated[], now: Date = new Date()): number {
  return rows.reduce((acc, r) => {
    if (!r.date) return acc;
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      ? acc + Number(r.amount || 0)
      : acc;
  }, 0);
}

/** Réponse de GET /api/dashboard. */
export type SchoolDashboardData = {
  academicYear: string;
  canSeeFinance: boolean;
  kpis: {
    students: number;
    staff: number;
    monthRevenue: number | null;
    averageGrade: number | null;
  };
  monthlyRevenue: { month: string; revenus: number; depenses: number }[];
  classPerformance: { classe: string; moyenne: number }[];
  recentActivities: {
    id: string;
    title: string;
    detail: string;
    time: string;
    type: "payment" | "enrollment";
  }[];
};

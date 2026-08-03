export interface GradeForAverage {
  value: number | string | null | undefined;
  max_value: number | string | null | undefined;
  coefficient?: number | string | null | undefined;
}

/**
 * Weighted average of a set of grades, each normalized to /20 before being
 * weighted by its coefficient. Grades with no value or an invalid/zero
 * max_value are skipped rather than treated as 0 — a student with no graded
 * work should show "pas encore noté" (null), not a 0/20 average.
 *
 * Extracted so the same logic (and the same bugs, once fixed) is shared by
 * every place that averages grades, instead of three near-identical
 * hand-rolled loops drifting apart — see grades/actions.ts.
 */
export function computeWeightedAverage(grades: GradeForAverage[]): number | null {
  let totalWeighted = 0;
  let totalCoef = 0;

  for (const g of grades) {
    const value = Number(g.value);
    const maxValue = Number(g.max_value);
    if (g.value === null || g.value === undefined || isNaN(value)) continue;
    if (!maxValue || maxValue <= 0) continue;

    const normalized = (value / maxValue) * 20;
    const coef = g.coefficient ? Number(g.coefficient) : 1;
    totalWeighted += normalized * coef;
    totalCoef += coef;
  }

  if (totalCoef <= 0) return null;
  return Number((totalWeighted / totalCoef).toFixed(2));
}

const MENTIONS: Array<{ min: number; label: string }> = [
  { min: 16, label: "Très Bien" },
  { min: 14, label: "Bien" },
  { min: 12, label: "Assez Bien" },
  { min: 10, label: "Passable" },
  { min: -Infinity, label: "Insuffisant" },
];

export function averageToMention(average: number | null): string | null {
  if (average === null) return null;
  return MENTIONS.find((m) => average >= m.min)!.label;
}

const APPRECIATIONS: Array<{ min: number; label: string }> = [
  { min: 16, label: "Excellent travail" },
  { min: 14, label: "Très bon travail" },
  { min: 12, label: "Travail satisfaisant" },
  { min: 10, label: "Ensemble juste, à consolider" },
  { min: -Infinity, label: "Résultats insuffisants" },
];

export function averageToAppreciation(average: number | null): string {
  if (average === null) return "—";
  return APPRECIATIONS.find((a) => average >= a.min)!.label;
}

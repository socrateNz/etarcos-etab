import { describe, expect, it } from "vitest";
import { buildMonthlySeries, currentAcademicYear, sumForMonth } from "./school-stats";

describe("currentAcademicYear", () => {
  it("commence en septembre", () => {
    expect(currentAcademicYear(new Date(2026, 10, 3)).label).toBe("2026/2027");
    expect(currentAcademicYear(new Date(2026, 8, 1)).label).toBe("2026/2027");
    expect(currentAcademicYear(new Date(2026, 7, 31)).label).toBe("2025/2026");
    expect(currentAcademicYear(new Date(2027, 0, 15)).label).toBe("2026/2027");
  });
});

describe("buildMonthlySeries", () => {
  const year = currentAcademicYear(new Date(2026, 10, 3));

  it("range les montants par mois de l'année scolaire", () => {
    const series = buildMonthlySeries(
      [
        { date: "2026-09-10T10:00:00", amount: 1000 },
        { date: "2026-09-20T10:00:00", amount: "500" },
        { date: "2027-01-05T10:00:00", amount: 200 },
      ],
      [{ date: "2026-10-02", amount: 300 }],
      year
    );
    expect(series).toHaveLength(12);
    expect(series[0]).toEqual({ month: "Sep", revenus: 1500, depenses: 0 });
    expect(series[1]).toEqual({ month: "Oct", revenus: 0, depenses: 300 });
    expect(series[4]).toEqual({ month: "Jan", revenus: 200, depenses: 0 });
    expect(series[11].month).toBe("Aoû");
  });

  it("ignore les montants des autres années et les dates invalides", () => {
    const series = buildMonthlySeries(
      [
        { date: "2025-09-10T10:00:00", amount: 1000 },
        { date: "2027-09-01T10:00:00", amount: 1000 },
        { date: "pas une date", amount: 1000 },
        { date: null, amount: 1000 },
      ],
      [],
      year
    );
    expect(series.every((p) => p.revenus === 0)).toBe(true);
  });
});

describe("sumForMonth", () => {
  it("n'additionne que le mois courant", () => {
    const now = new Date(2026, 10, 3);
    expect(
      sumForMonth(
        [
          { date: "2026-11-01T08:00:00", amount: 100 },
          { date: "2026-11-30T08:00:00", amount: 50 },
          { date: "2026-10-31T08:00:00", amount: 999 },
          { date: "2025-11-15T08:00:00", amount: 999 },
        ],
        now
      )
    ).toBe(150);
  });
});

import { describe, expect, it } from "vitest";
import { computeWeightedAverage, averageToMention, averageToAppreciation } from "./calculations";

describe("computeWeightedAverage", () => {
  it("returns null for an empty set (no grades yet)", () => {
    expect(computeWeightedAverage([])).toBeNull();
  });

  it("returns null when every grade has no value (drafts only)", () => {
    expect(
      computeWeightedAverage([
        { value: null, max_value: 20, coefficient: 1 },
        { value: undefined, max_value: 20, coefficient: 2 },
      ])
    ).toBeNull();
  });

  it("normalizes a grade to /20 regardless of max_value", () => {
    expect(computeWeightedAverage([{ value: 8, max_value: 10, coefficient: 1 }])).toBe(16);
  });

  it("weights grades by coefficient", () => {
    // 10/20 (coef 1) and 20/20 (coef 3) → (10*1 + 20*3) / (1+3) = 17.5
    const avg = computeWeightedAverage([
      { value: 10, max_value: 20, coefficient: 1 },
      { value: 20, max_value: 20, coefficient: 3 },
    ]);
    expect(avg).toBe(17.5);
  });

  it("defaults a missing coefficient to 1", () => {
    expect(
      computeWeightedAverage([
        { value: 10, max_value: 20, coefficient: null },
        { value: 20, max_value: 20, coefficient: undefined },
      ])
    ).toBe(15);
  });

  it("skips grades with a zero or missing max_value instead of dividing by zero", () => {
    const avg = computeWeightedAverage([
      { value: 10, max_value: 0, coefficient: 5 },
      { value: 15, max_value: 20, coefficient: 1 },
    ]);
    expect(avg).toBe(15);
  });

  it("skips grades whose value is not a usable number", () => {
    const avg = computeWeightedAverage([
      { value: "not-a-number", max_value: 20, coefficient: 1 },
      { value: 12, max_value: 20, coefficient: 1 },
    ]);
    expect(avg).toBe(12);
  });

  it("accepts numeric strings (as Supabase can return decimal columns as strings)", () => {
    expect(computeWeightedAverage([{ value: "16", max_value: "20", coefficient: "2" }])).toBe(16);
  });

  it("rounds to 2 decimal places", () => {
    const avg = computeWeightedAverage([
      { value: 10, max_value: 20, coefficient: 1 },
      { value: 11, max_value: 20, coefficient: 1 },
      { value: 12, max_value: 20, coefficient: 1 },
    ]);
    expect(avg).toBe(11);
  });
});

describe("averageToMention", () => {
  it("returns null when there is no average", () => {
    expect(averageToMention(null)).toBeNull();
  });

  it.each([
    [20, "Très Bien"],
    [16, "Très Bien"],
    [15.99, "Bien"],
    [14, "Bien"],
    [13.99, "Assez Bien"],
    [12, "Assez Bien"],
    [11.99, "Passable"],
    [10, "Passable"],
    [9.99, "Insuffisant"],
    [0, "Insuffisant"],
  ])("maps %s/20 to %s", (average, expected) => {
    expect(averageToMention(average)).toBe(expected);
  });
});

describe("averageToAppreciation", () => {
  it("returns an em dash when there is no average", () => {
    expect(averageToAppreciation(null)).toBe("—");
  });

  it("maps a passing average to an encouraging appreciation", () => {
    expect(averageToAppreciation(17)).toBe("Excellent travail");
  });

  it("maps a failing average to a corrective appreciation", () => {
    expect(averageToAppreciation(5)).toBe("Résultats insuffisants");
  });
});

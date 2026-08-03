import { describe, expect, it } from "vitest";
import { computePaymentStatus } from "./calculations";

describe("computePaymentStatus", () => {
  it("is 'partial' when less than the total has been paid", () => {
    expect(computePaymentStatus(100, 50)).toBe("partial");
  });

  it("is 'paid' when exactly the total has been paid (boundary case)", () => {
    expect(computePaymentStatus(100, 100)).toBe("paid");
  });

  it("is 'paid' when more than the total has been paid (overpayment)", () => {
    expect(computePaymentStatus(100, 150)).toBe("paid");
  });

  it("is 'partial' for a token payment far below the total", () => {
    expect(computePaymentStatus(50000, 1)).toBe("partial");
  });
});

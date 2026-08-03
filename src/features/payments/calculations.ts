export type PaymentStatus = "paid" | "partial";

/**
 * A payment is "paid" once the amount paid covers (or exceeds) the total
 * due, otherwise "partial". Kept as its own function so the boundary case
 * (paid === total) is defined once and tested, instead of re-derived
 * ad-hoc at each call site.
 */
export function computePaymentStatus(totalAmount: number, amountPaid: number): PaymentStatus {
  return amountPaid >= totalAmount ? "paid" : "partial";
}

import { describe, it, expect } from "vitest";
import { receiptTransitions, canIssueBill } from "./receipt-lifecycle";

/**
 * A receipt can now exist before it is paid, which changes when money is
 * received and therefore when points may be minted.
 *
 * The rule the tests exist to protect: points and coupons are settled at
 * mark-paid, never at bill-issue. Awarding at issue time would mint points for
 * tabs that are never paid, and would make a void impossible to unwind.
 */

describe("canIssueBill", () => {
  const openOrder = { paymentStatus: "pending", status: "preparing" };

  it("allows billing an open, unpaid order", () => {
    expect(canIssueBill(openOrder, null)).toEqual({ ok: true });
  });

  it("allows billing a table whose dishes are still cooking", () => {
    expect(
      canIssueBill({ paymentStatus: "pending", status: "ready" }, null)
    ).toEqual({ ok: true });
  });

  it("refuses when that table already has an unpaid bill", () => {
    const result = canIssueBill(openOrder, { status: "unpaid" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/already/i);
  });

  it("allows a fresh bill after the previous one was voided", () => {
    expect(canIssueBill(openOrder, { status: "void" })).toEqual({ ok: true });
  });

  it("allows a fresh bill after the previous one was paid and the table reopened", () => {
    expect(canIssueBill(openOrder, { status: "paid" })).toEqual({ ok: true });
  });

  it("refuses billing an order that is already settled", () => {
    const result = canIssueBill({ paymentStatus: "paid", status: "completed" }, null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/settled|paid/i);
  });

  it("refuses billing a cancelled order", () => {
    const result = canIssueBill({ paymentStatus: "pending", status: "cancelled" }, null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cancel/i);
  });
});

describe("receiptTransitions", () => {
  it("allows unpaid -> paid", () => {
    expect(receiptTransitions.unpaid).toContain("paid");
  });

  it("allows unpaid -> void", () => {
    expect(receiptTransitions.unpaid).toContain("void");
  });

  it("does NOT allow an unpaid receipt to go straight to completed", () => {
    expect(receiptTransitions.unpaid).not.toContain("completed");
  });

  it("does not allow unpaid -> unpaid", () => {
    expect(receiptTransitions.unpaid).not.toContain("unpaid");
  });

  it("treats paid as terminal — a paid bill cannot be voided", () => {
    // Voiding a paid receipt would silently erase money that was actually
    // taken; a refund is a different operation and does not exist yet.
    expect(receiptTransitions.paid).toEqual([]);
  });

  it("treats void as terminal", () => {
    expect(receiptTransitions.void).toEqual([]);
  });

  it("refuses an unknown transition", () => {
    expect(receiptTransitions.unpaid ?? []).not.toContain("refunded");
  });
});
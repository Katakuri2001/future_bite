import { describe, it, expect } from "vitest";
import { canCancelOrder, cancelTransition } from "./order-cancel";

/**
 * An unpaid order can be cancelled: the guest changed their mind, the kitchen
 * cannot fulfil it, or the table walked out. A paid order cannot be cancelled —
 * it needs a refund, which is a different operation and does not exist yet.
 */

describe("canCancelOrder", () => {
  it("allows cancelling an unpaid, non-completed order", () => {
    expect(
      canCancelOrder({ paymentStatus: "pending", status: "preparing" })
    ).toEqual({ ok: true });
  });

  it("allows cancelling an order that is still pending", () => {
    expect(
      canCancelOrder({ paymentStatus: "pending", status: "pending" })
    ).toEqual({ ok: true });
  });

  it("refuses a paid order — that needs a refund, not a cancellation", () => {
    const r = canCancelOrder({ paymentStatus: "paid", status: "completed" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/refund/i);
  });

  it("refuses an already-cancelled order", () => {
    const r = canCancelOrder({ paymentStatus: "pending", status: "cancelled" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/already/i);
  });

  it("refuses a completed order", () => {
    const r = canCancelOrder({ paymentStatus: "paid", status: "completed" });
    expect(r.ok).toBe(false);
  });
});

describe("cancelTransition", () => {
  it("moves every dish to cancelled", () => {
    expect(cancelTransition("pending")).toBe("cancelled");
    expect(cancelTransition("preparing")).toBe("cancelled");
    expect(cancelTransition("ready")).toBe("cancelled");
    expect(cancelTransition("served")).toBe("cancelled");
  });

  it("leaves an already-cancelled dish alone", () => {
    expect(cancelTransition("cancelled")).toBe("cancelled");
  });
});
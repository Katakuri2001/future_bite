/**
 * Order cancellation rules.
 *
 * An unpaid order can be cancelled — the guest changed their mind, the kitchen
 * cannot fulfil it, or the table walked out. A paid order cannot be cancelled:
 * it needs a refund, which is a different operation and does not exist yet.
 *
 * Cancellation is terminal and one-way: once cancelled, an order stays
 * cancelled. There is no "uncancel".
 */

export interface OrderState {
  paymentStatus: string;
  status: string;
}

export type CancelCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function canCancelOrder(order: OrderState): CancelCheck {
  if (order.status === "cancelled") {
    return { ok: false, reason: "This order is already cancelled" };
  }
  if (order.paymentStatus === "paid" || order.status === "completed") {
    return {
      ok: false,
      reason: "A paid order cannot be cancelled — it needs a refund",
    };
  }
  if (order.status === "refunded") {
    return { ok: false, reason: "This order was already refunded" };
  }
  return { ok: true };
}

/**
 * What a dish's status becomes when its order is cancelled.
 * Every dish moves to cancelled, regardless of how far it got.
 */
export function cancelTransition(_status: string): "cancelled" {
  return "cancelled";
}
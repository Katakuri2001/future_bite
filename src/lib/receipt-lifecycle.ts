/**
 * Receipt lifecycle rules: when a bill may be issued, and how its status may
 * change.
 *
 * A receipt used to be created in the same batch that marked its order paid,
 * so every receipt that existed was already paid. Issuing a bill separately —
 * which is how a table is actually closed out — introduces a state where money
 * has not changed hands yet, and that state needs rules.
 *
 * The important consequence: points and coupons settle at mark-paid, never at
 * bill-issue. Awarding earlier would mint points for tabs that are never paid
 * and would leave nothing to unwind if the bill were voided.
 */

export type ReceiptStatus = "unpaid" | "paid" | "void";

/** Allowed status changes. Anything not listed is refused. */
export const receiptTransitions: Record<ReceiptStatus, ReceiptStatus[]> = {
  unpaid: ["paid", "void"],
  // Terminal. A paid receipt cannot be voided: money was actually taken, and
  // undoing that is a refund, which does not exist yet. Making void available
  // here would let a cashier erase a real transaction.
  paid: [],
  void: [],
};

export interface OrderState {
  paymentStatus: string;
  status: string;
}

export interface ExistingBill {
  status: string;
}

export type BillCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Whether a bill may be issued against an order.
 *
 * One unpaid bill per table: issuing a second would leave the guest holding two
 * pieces of paper for the same food, and would let the first be paid after the
 * second was voided.
 */
export function canIssueBill(
  order: OrderState,
  existingBill: ExistingBill | null
): BillCheck {
  if (order.status === "cancelled") {
    return { ok: false, reason: "This order was cancelled" };
  }
  if (order.paymentStatus === "paid" || order.status === "completed") {
    return { ok: false, reason: "This table has already been settled" };
  }
  if (existingBill && existingBill.status === "unpaid") {
    return {
      ok: false,
      reason: "This table already has an unpaid bill — void it before issuing another",
    };
  }
  return { ok: true };
}

/** Whether a status change is permitted. */
export function canTransitionReceipt(
  from: string,
  to: string
): boolean {
  const allowed = receiptTransitions[from as ReceiptStatus];
  return Array.isArray(allowed) && allowed.includes(to as ReceiptStatus);
}
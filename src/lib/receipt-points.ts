/**
 * The Royal Points line on a receipt.
 *
 * A guest who identifies themselves at the till should leave with the slip
 * telling them what they earned and what balance they are left with — the
 * receipt is the only thing they take away from an in-restaurant payment.
 *
 * The balance is stored on the receipt rather than read live, so a reprint
 * months later shows what the guest actually had at the time rather than what
 * their balance happens to be now.
 */

export interface PointsLineInput {
  pointsEarned: number;
  pointsBalance: number | null;
  status?: string;
}

export interface PointsLine {
  earned: number;
  balance: number;
}

/**
 * What to print under the total, or null when there is nothing to say.
 *
 * Silent for a walk-in table (no account, no balance), and for an unpaid or
 * voided bill, which has earned nothing. Printing "0 points" beside a real
 * total reads as though the guest was short-changed.
 */
export function pointsLine(input: PointsLineInput): PointsLine | null {
  if (input.status === "void" || input.status === "unpaid") return null;
  if (!input.pointsEarned || input.pointsEarned <= 0) return null;
  if (input.pointsBalance === null || input.pointsBalance === undefined) {
    return null;
  }
  return { earned: input.pointsEarned, balance: input.pointsBalance };
}
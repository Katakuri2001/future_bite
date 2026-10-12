import { describe, it, expect } from "vitest";
import { pointsLine } from "./receipt-points";

/**
 * A guest spending a coupon should see, on the slip, what it earned them.
 *
 * The line is only shown when something was actually earned — a walk-in table
 * with no account has no balance to print, and a receipt showing "0 points"
 * next to a real total reads as though the guest was short-changed.
 */

describe("pointsLine", () => {
  it("is hidden when no points were earned", () => {
    expect(pointsLine({ pointsEarned: 0, pointsBalance: null })).toBeNull();
  });

  it("is hidden when points were earned but no balance was recorded", () => {
    expect(pointsLine({ pointsEarned: 5, pointsBalance: null })).toBeNull();
  });

  it("shows the points earned and the resulting balance", () => {
    expect(pointsLine({ pointsEarned: 4, pointsBalance: 304 })).toEqual({
      earned: 4,
      balance: 304,
    });
  });

  it("shows a zero balance when the guest spent their last points", () => {
    expect(pointsLine({ pointsEarned: 3, pointsBalance: 0 })).toEqual({
      earned: 3,
      balance: 0,
    });
  });

  it("is hidden for a void bill, which earned nothing", () => {
    expect(
      pointsLine({ pointsEarned: 0, pointsBalance: 0, status: "void" })
    ).toBeNull();
  });

  it("is hidden when the bill is unpaid — nothing has been earned yet", () => {
    expect(
      pointsLine({ pointsEarned: 0, pointsBalance: 500, status: "unpaid" })
    ).toBeNull();
  });
});
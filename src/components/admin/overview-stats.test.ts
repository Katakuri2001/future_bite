import { describe, it, expect } from "vitest";
import { EMPTY_STATS, displayStats } from "./overview-stats";

/**
 * `AdminOverview` fell back to a hardcoded object with `revenue: 2850000` and
 * five named dishes whenever its fetch had not resolved or had failed. Because
 * `stats || defaultStats` cannot tell "the server said zero" from "the request
 * failed", an admin looking at a broken dashboard saw invented revenue and
 * could act on it.
 */

describe("EMPTY_STATS", () => {
  it("is all zeroes with no dishes", () => {
    expect(EMPTY_STATS.revenue).toBe(0);
    expect(EMPTY_STATS.todayOrders).toBe(0);
    expect(EMPTY_STATS.currentCovers).toBe(0);
    expect(EMPTY_STATS.popularDishes).toEqual([]);
  });

  it("contains no named dish that could be mistaken for a real result", () => {
    expect(EMPTY_STATS.popularDishes).toHaveLength(0);
  });
});

describe("displayStats", () => {
  const real = {
    todayReservations: 3,
    todayOrders: 9,
    todayReceipts: 4,
    currentCovers: 12,
    kitchenQueue: 2,
    revenue: 128_000,
    averageOrderValue: 14_222,
    occupancy: 40,
    lowStockCount: 0,
    popularDishes: [{ name: "Nebula Tartare", orders: 5 }],
  };

  it("shows the server's numbers when they arrive", () => {
    const shown = displayStats(real, null);
    expect(shown.revenue).toBe(128_000);
    expect(shown.popularDishes).toEqual(real.popularDishes);
  });

  it("shows zeroes — not invented numbers — when the request failed", () => {
    const shown = displayStats(null, "Network error");
    expect(shown.revenue).toBe(0);
    expect(shown.todayOrders).toBe(0);
    expect(shown.popularDishes).toEqual([]);
  });

  it("shows zeroes while the request is still in flight", () => {
    expect(displayStats(null, null).revenue).toBe(0);
  });

  it("reports that the numbers are unavailable so a zero is not read as real", () => {
    expect(displayStats(null, "Network error").stale).toBe(true);
    expect(displayStats(real, null).stale).toBe(false);
  });

  it("treats a genuine zero from the server as real, not stale", () => {
    const zeroed = { ...real, revenue: 0, todayOrders: 0 };
    const shown = displayStats(zeroed, null);
    expect(shown.revenue).toBe(0);
    expect(shown.stale).toBe(false);
  });
});
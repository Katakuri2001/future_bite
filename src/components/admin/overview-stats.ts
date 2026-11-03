/**
 * What the admin overview is allowed to show when it has no real data.
 *
 * It previously fell back to a hardcoded object — `revenue: 2850000`, five
 * named dishes — whenever the analytics fetch had not resolved or had failed.
 * `stats || defaultStats` cannot distinguish "the server reported zero" from
 * "the request failed", so a broken dashboard rendered invented revenue that an
 * owner could read, and act on, as though it were real.
 *
 * When there is nothing to show, show nothing, and say so.
 */

export interface PopularDish {
  name: string;
  orders: number;
}

export interface AnalyticsStats {
  todayReservations: number;
  todayOrders: number;
  todayReceipts: number;
  currentCovers: number;
  kitchenQueue: number;
  revenue: number;
  averageOrderValue: number;
  occupancy: number;
  lowStockCount: number;
  popularDishes: PopularDish[];
}

/** What to render before the numbers are known, or when they could not be fetched. */
export const EMPTY_STATS: AnalyticsStats = {
  todayReservations: 0,
  todayOrders: 0,
  todayReceipts: 0,
  currentCovers: 0,
  kitchenQueue: 0,
  revenue: 0,
  averageOrderValue: 0,
  occupancy: 0,
  lowStockCount: 0,
  popularDishes: [],
};

export interface DisplayStats extends AnalyticsStats {
  /** True when these figures are not real numbers and must not be read as such. */
  stale: boolean;
}

/**
 * Pick what to render.
 *
 * A real zero from the server is real data and is shown as-is. Only a missing or
 * failed response falls back to zeroes, and it is flagged so the UI can say the
 * dashboard is unavailable instead of implying the restaurant earned nothing.
 */
export function displayStats(
  stats: AnalyticsStats | null,
  error: string | null
): DisplayStats {
  if (!stats) {
    return { ...EMPTY_STATS, stale: true };
  }
  return { ...stats, stale: false };
}
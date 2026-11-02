/**
 * Cart pricing.
 *
 * A payment endpoint must never take a price from the browser. Dish prices are
 * re-resolved from the database at checkout; addon prices were not, which let a
 * crafted request set its own prices at the point of payment. Resolution lives
 * here as a pure function so the rule is enforced in one place and testable
 * without a database.
 */

/** An addon as it exists in the server-side catalogue. */
export interface CatalogueAddon {
  id: string;
  name: string;
  price: number;
}

/** What the client is allowed to send: an id and how many. Never a price. */
export interface RequestedAddon {
  id: string;
  quantity?: number;
}

export interface ResolvedAddon extends CatalogueAddon {
  quantity: number;
}

export interface PricedLine {
  unitPrice: number;
  addons: ResolvedAddon[];
}

/** Raised when the requested addons cannot be priced honestly. */
export class AddonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddonError";
  }
}

const MAX_ADDON_QUANTITY = 50;

function resolveAddons(
  requested: unknown,
  catalogue: Map<string, CatalogueAddon>
): ResolvedAddon[] {
  if (requested === undefined || requested === null) return [];
  if (!Array.isArray(requested)) {
    throw new AddonError("Addons must be an array");
  }

  return requested.map((entry: any) => {
    // Only an id may come from the client. Anything price-shaped is ignored on
    // purpose, so a caller cannot smuggle a price through an unexpected key.
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || !entry.id) {
      throw new AddonError("Each addon needs an id");
    }

    const quantity = entry.quantity ?? 1;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ADDON_QUANTITY
    ) {
      throw new AddonError(
        `Addon quantity must be a whole number between 1 and ${MAX_ADDON_QUANTITY}`
      );
    }

    const known = catalogue.get(entry.id);
    if (!known) {
      throw new AddonError(`Unknown addon: ${entry.id}`);
    }

    return { ...known, quantity };
  });
}

/**
 * Resolve a cart line's unit price from the server's own prices.
 *
 * The client supplies ids and quantities only. Every amount here comes from the
 * database, so a tampered request changes nothing but the error message.
 */
export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

/**
 * Single definition of the money math. Tax and service charge are computed
 * on the post-discount subtotal, because a coupon reduces what the guest
 * actually pays — not on a finished total afterwards, which would leave tax
 * and service charge computed on the undiscounted figure.
 */
export function computeTotals(grossSubtotal: number, discount: number): Totals {
  const d = Math.min(Math.max(0, discount), Math.max(0, grossSubtotal));
  const subtotal = Math.max(0, grossSubtotal - d);
  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  return {
    subtotal,
    discount: d,
    tax,
    serviceCharge,
    total: subtotal + tax + serviceCharge,
  };
}

export function priceCartLine(
  dish: { id: string; name: string; price: number },
  requestedAddons: unknown,
  catalogue: Map<string, CatalogueAddon>
): PricedLine {
  const addons = resolveAddons(requestedAddons, catalogue);
  const addonsTotal = addons.reduce(
    (sum: number, a: ResolvedAddon) => sum + a.price * a.quantity,
    0
  );
  return {
    unitPrice: dish.price + addonsTotal,
    addons,
  };
}
import { describe, it, expect } from "vitest";
import { priceCartLine, AddonError, computeTotals } from "./pricing";

/**
 * A payment endpoint must never take a price from the browser.
 *
 * These tests exist because `pos/checkout` once summed `addons[].price`
 * straight off the request body, letting a crafted request set its own prices
 * at the point of payment. Dish prices were always re-resolved from the
 * database; addon prices were not.
 */

const catalogue = new Map([
  ["addon-egg", { id: "addon-egg", name: "Extra egg", price: 1500 }],
  ["addon-rare", { id: "addon-rare", name: "Rare finish", price: 2500 }],
]);

describe("priceCartLine", () => {
  it("ignores a price supplied by the client and uses the catalogue's", () => {
    const line = priceCartLine(
      { id: "d1", name: "Steak", price: 20_000 },
      [{ id: "addon-egg", quantity: 1, price: 999_999 } as never],
      catalogue
    );

    expect(line.unitPrice).toBe(21_500);
    expect(line.addons[0].price).toBe(1_500);
  });

  it("prices the dish alone when no addons are requested", () => {
    const line = priceCartLine(
      { id: "d1", name: "Steak", price: 20_000 },
      [],
      catalogue
    );

    expect(line.unitPrice).toBe(20_000);
    expect(line.addons).toEqual([]);
  });

  it("multiplies an addon price by its quantity", () => {
    const line = priceCartLine(
      { id: "d1", name: "Steak", price: 20_000 },
      [{ id: "addon-egg", quantity: 3 }],
      catalogue
    );

    expect(line.unitPrice).toBe(24_500);
  });

  it("rejects an addon that is not in the catalogue", () => {
    expect(() =>
      priceCartLine(
        { id: "d1", name: "Steak", price: 20_000 },
        [{ id: "addon-free-caviar", quantity: 1 }],
        catalogue
      )
    ).toThrow(AddonError);
  });

  it("rejects an addon with no id", () => {
    expect(() =>
      priceCartLine(
        { id: "d1", name: "Steak", price: 20_000 },
        [{ quantity: 1 }],
        catalogue
      )
    ).toThrow(AddonError);
  });

  it("rejects a non-positive quantity rather than pricing it at zero", () => {
    expect(() =>
      priceCartLine(
        { id: "d1", name: "Steak", price: 20_000 },
        [{ id: "addon-egg", quantity: 0 }],
        catalogue
      )
    ).toThrow(AddonError);
  });

  it("rejects a fractional quantity that would produce a fractional kyat amount", () => {
    expect(() =>
      priceCartLine(
        { id: "d1", name: "Steak", price: 20_000 },
        [{ id: "addon-egg", quantity: 1.5 }],
        catalogue
      )
    ).toThrow(AddonError);
  });

  it("rejects a malformed addons payload instead of coercing it", () => {
    expect(() =>
      priceCartLine(
        { id: "d1", name: "Steak", price: 20_000 },
        "not-an-array" as never,
        catalogue
      )
    ).toThrow(AddonError);
  });
});

/**
 * Tax and service charge are computed in eleven places across the codebase.
 * Changing the rate required eleven edits, and missing one silently
 * over- or under-charged a guest. The audit found this as a medium-severity
 * defect; this test pins the one definition that now owns the calculation.
 */
describe("computeTotals", () => {
  it("applies 10% tax and 5% service to the subtotal", () => {
    const t = computeTotals(10_000, 0);
    expect(t.subtotal).toBe(10_000);
    expect(t.tax).toBe(1_000);
    expect(t.serviceCharge).toBe(500);
    expect(t.total).toBe(11_500);
  });

  it("applies the discount before tax and service, never after", () => {
    // 10,000 - 4,000 = 6,000; tax 600, service 300; total 6,900.
    // Subtracting the discount from a finished total would leave tax computed
    // on 10,000 and overcharge by 600 kyat of tax alone.
    const t = computeTotals(10_000, 4_000);
    expect(t.subtotal).toBe(6_000);
    expect(t.tax).toBe(600);
    expect(t.serviceCharge).toBe(300);
    expect(t.total).toBe(6_900);
  });

  it("never discounts past zero", () => {
    const t = computeTotals(10_000, 100_000);
    expect(t.subtotal).toBe(0);
    expect(t.tax).toBe(0);
    expect(t.serviceCharge).toBe(0);
    expect(t.total).toBe(0);
  });

  it("rounds tax and service independently", () => {
    // 3,333 * 0.1 = 333.3 -> 333; 3,333 * 0.05 = 166.65 -> 167
    const t = computeTotals(3_333, 0);
    expect(t.tax).toBe(333);
    expect(t.serviceCharge).toBe(167);
  });

  it("records the discount it applied", () => {
    const t = computeTotals(10_000, 4_000);
    expect(t.discount).toBe(4_000);
  });
});
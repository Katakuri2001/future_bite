import { describe, it, expect } from "vitest";
import { priceCartLine, AddonError } from "./pricing";

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
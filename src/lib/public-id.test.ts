import { describe, it, expect } from "vitest";
import { newPublicId, isLegacyPublicId } from "./public-id";

/**
 * `/api/receipts/[id]` is unauthenticated — a guest who paid at the table has
 * no session and must still be able to open their slip. The receipt id is
 * therefore the only thing protecting that endpoint.
 *
 * Ids were minted as `rec-${generateToken().slice(0, 8)}`: 8 hex characters is
 * 32 bits, or 4.29 billion candidates, which is enumerable — and the response
 * carries customer name, table number, spend, and coupon code.
 */

describe("newPublicId", () => {
  it("produces an id long enough not to be enumerable", () => {
    const id = newPublicId("rec");
    const entropy = id.split("-")[1] ?? "";
    // 32 hex chars is 128 bits; anything under 24 is comfortably enumerable.
    expect(entropy.length).toBeGreaterThanOrEqual(24);
  });

  it("keeps a human-readable prefix so an id is identifiable in a log", () => {
    expect(newPublicId("rec")).toMatch(/^rec-[0-9a-f]+$/);
  });

  it("produces a different id every time", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newPublicId("rec")));
    expect(ids.size).toBe(200);
  });
});

describe("isLegacyPublicId", () => {
  it("recognises an 8-character id minted before the change", () => {
    expect(isLegacyPublicId("rec-1a2b3c4d")).toBe(true);
  });

  it("does not claim a new full-entropy id", () => {
    expect(
      isLegacyPublicId("rec-1a2b3c4d5e6f70819a2b3c4d5e6f7081")
    ).toBe(false);
  });

  it("does not claim a malformed id", () => {
    expect(isLegacyPublicId("nonsense")).toBe(false);
  });
});
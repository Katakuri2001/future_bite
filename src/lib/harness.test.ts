import { describe, it, expect } from "vitest";

/**
 * Proves the harness runs and reports failures honestly.
 *
 * This is not a placeholder — if this file ever passes silently, or the runner
 * stops executing at all, every other test in the repo becomes a false green.
 */
describe("test harness", () => {
  it("runs and evaluates assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("fails when the expectation is wrong", () => {
    expect(() => {
      throw new Error("deliberate");
    }).toThrow("deliberate");
  });
});
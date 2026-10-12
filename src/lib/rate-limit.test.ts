import { describe, it, expect } from "vitest";
import { checkRateLimit, type RateRecord } from "./rate-limit";

/**
 * Login and signup run a 100,000-iteration PBKDF2 per attempt, so an
 * unthrottled endpoint is a credential-guessing tool and a CPU amplifier at
 * once. The audit found no rate limiting anywhere in the app.
 */

const WINDOW = 900; // 15 minutes

describe("checkRateLimit", () => {
  it("allows an attempt on a key that has never been seen", () => {
    const r = checkRateLimit("1.2.3.4", null, WINDOW);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  it("allows attempts right up to the limit", () => {
    let last = checkRateLimit("1.2.3.4", null, WINDOW);
    for (let i = 0; i < 4; i++) {
      last = checkRateLimit("1.2.3.4", last.record, WINDOW);
      expect(last.allowed).toBe(true);
    }
    expect(last.record.count).toBe(5);
  });

  it("blocks the attempt that exceeds the limit", () => {
    let rec: RateRecord | null = null;
    for (let i = 0; i < 5; i++) rec = checkRateLimit("1.2.3.4", rec, WINDOW).record;

    const blocked = checkRateLimit("1.2.3.4", rec, WINDOW);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps IP and account budgets independent", () => {
    // The caller holds a record per key and checks each one, so exhausting an
    // IP budget leaves a different account's own budget untouched.
    let ipRec: RateRecord | null = null;
    for (let i = 0; i < 6; i++) {
      ipRec = checkRateLimit("1.2.3.4", ipRec, WINDOW).record;
    }
    expect(checkRateLimit("1.2.3.4", ipRec, WINDOW).allowed).toBe(false);

    // A different account, tracked on its own record, is unaffected.
    const accountRec = checkRateLimit("someone-else", null, WINDOW);
    expect(accountRec.allowed).toBe(true);
  });

  it("stops a rotating-IP attack on one account via its email budget", () => {
    // Each attempt arrives from a fresh IP, so no single IP budget is ever
    // exhausted. The shared email record is what has to carry the load.
    let emailRec: RateRecord | null = null;
    for (let i = 0; i < 6; i++) {
      const attempt = checkRateLimit(`10.0.0.${i}`, emailRec, WINDOW);
      emailRec = attempt.record;
    }

    // A sixth distinct IP, but the account budget is already spent.
    const next = checkRateLimit("10.0.0.99", emailRec, WINDOW);
    expect(next.allowed).toBe(false);
  });

  it("starts a fresh window once the previous one has expired", () => {
    const rec = { count: 5, resetAt: Date.now() - 1 };
    const r = checkRateLimit("1.2.3.4", rec, WINDOW);
    expect(r.allowed).toBe(true);
    expect(r.record.count).toBe(1);
  });

  it("keeps counting while inside the window", () => {
    const rec = { count: 2, resetAt: Date.now() + 60_000 };
    const r = checkRateLimit("1.2.3.4", rec, WINDOW);
    expect(r.record.count).toBe(3);
  });

  it("never returns a negative remaining count once blocked", () => {
    const rec = { count: 99, resetAt: Date.now() + 60_000 };
    const r = checkRateLimit("1.2.3.4", rec, WINDOW);
    expect(r.remaining).toBe(0);
  });
});
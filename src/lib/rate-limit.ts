/**
 * Rate limiting for the authentication endpoints.
 *
 * Login and signup each run a 100,000-iteration PBKDF2, so without a throttle
 * the endpoint is simultaneously a credential-guessing tool and a CPU amplifier
 * against the Workers budget. Two independent budgets are kept: one per client
 * IP, and one per account being attempted, so a distributed attack on one
 * account is stopped by the email budget while a single noisy guest is stopped
 * by their IP.
 *
 * The decision logic is pure — storage is the caller's job (KV here), which
 * keeps the policy testable without a Workers runtime.
 */

/** Attempts allowed per window, per key. */
export const AUTH_RATE_LIMIT = 5;

export interface RateRecord {
  count: number;
  resetAt: number;
}

export interface RateDecision {
  allowed: boolean;
  /** Attempts left in this window. Never negative. */
  remaining: number;
  /** Seconds until the window resets. Only meaningful when blocked. */
  retryAfterSeconds: number;
  /** The record to persist for the next call. */
  record: RateRecord;
}

/**
 * Decide whether one attempt is allowed, and what to store for next time.
 *
 * `record` is the previously stored state for this key, or null if unseen.
 * A window that has passed starts over.
 */
export function checkRateLimit(
  _key: string,
  record: RateRecord | null,
  windowSeconds: number
): RateDecision {
  const now = Date.now();
  const fresh = !record || record.resetAt <= now;

  if (fresh) {
    return {
      allowed: true,
      remaining: AUTH_RATE_LIMIT - 1,
      retryAfterSeconds: 0,
      record: { count: 1, resetAt: now + windowSeconds * 1000 },
    };
  }

  const next = record.count + 1;
  const allowed = next <= AUTH_RATE_LIMIT;

  return {
    allowed,
    remaining: Math.max(0, AUTH_RATE_LIMIT - next),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    record: { count: next, resetAt: record.resetAt },
  };
}

/** KV key for a client IP, namespaced so it cannot collide with an email. */
export function ipKey(ip: string): string {
  return `rl:ip:${ip}`;
}

/**
 * KV key for an account being attempted. The email is normalised so
 * `Ann@x.com` and `ann@x.com` share one budget.
 */
export function emailKey(email: string): string {
  return `rl:email:${email.trim().toLowerCase()}`;
}
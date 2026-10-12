import { NextResponse } from "next/server";
import { getKV } from "./db";
import {
  checkRateLimit,
  ipKey,
  emailKey,
  AUTH_RATE_LIMIT,
  type RateRecord,
} from "./rate-limit";

/** Throttle window. Long enough to be invisible to a guest, short enough to matter. */
const WINDOW_SECONDS = 900;

/**
 * Consume one unit of the caller's rate-limit budget.
 *
 * Returns a 429 response when the budget is spent, otherwise null. Storage is
 * KV, which is shared across isolates — an in-memory map would be per-isolate
 * and therefore trivially bypassed.
 *
 * Pass `email` to budget the account being attempted, not just the caller's IP.
 * A rotating-IP attack gets a fresh IP budget every request, so the per-account
 * budget is the one that actually stops it.
 */
export async function enforceAuthRateLimit(
  request: Request,
  email: string | null
): Promise<NextResponse | null> {
  const keys = [ipKey(clientIp(request))];
  if (email) keys.push(emailKey(email));

  let kv: KVNamespace;
  try {
    kv = getKV();
  } catch {
    // If the store is unavailable we cannot count, so we do not lock anyone out
    // of their own account. The password hash is still checked below.
    return null;
  }

  for (const key of keys) {
    let raw: string | null = null;
    try {
      raw = await kv.get(key);
    } catch {
      continue;
    }

    let record: RateRecord | null = null;
    if (raw) {
      try {
        record = JSON.parse(raw) as RateRecord;
      } catch {
        record = null;
      }
    }

    const decision = checkRateLimit(key, record, WINDOW_SECONDS);
    if (!decision.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Please wait a few minutes and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(decision.retryAfterSeconds),
            "X-RateLimit-Limit": String(AUTH_RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    try {
      // `expirationTtl` makes the key self-cleaning, so an abandoned key does
      // not live in KV forever.
      await kv.put(
        key,
        JSON.stringify(decision.record),
        { expirationTtl: WINDOW_SECONDS + 60 }
      );
    } catch {
      // Failing to store the count must not fail the request.
    }
  }

  return null;
}

/**
 * Best-effort client IP.
 *
 * Cloudflare sets CF-Connecting-IP. Trusting a forwarded header would let a
 * caller rotate its apparent identity, so it is only a fallback.
 */
function clientIp(request: Request): string {
  const direct =
    request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip");
  if (direct) return direct;
  return "unknown";
}
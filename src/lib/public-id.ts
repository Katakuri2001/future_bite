/**
 * Identifiers for resources reachable without a session.
 *
 * `/api/receipts/[id]` is public so a guest who paid at the table can open
 * their own slip. That makes the id the only credential on an endpoint that
 * returns customer name, table number, spend and coupon code.
 *
 * Ids were previously minted from `generateToken().slice(0, 8)` — 8 hex
 * characters is 32 bits, 4.29 billion candidates, enumerable in hours. These
 * use the full 128 bits of the underlying UUID.
 */

/** Full-entropy id for a publicly reachable resource, e.g. a receipt slip. */
export function newPublicId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Whether an id predates the entropy fix and carries only 32 bits.
 *
 * Historic ids stay resolvable — a guest may still hold the link — but they
 * remain weak, so a caller can decide whether to redirect rather than serve.
 */
export function isLegacyPublicId(id: string): boolean {
  return /^rec-[0-9a-f]{8}$/.test(id);
}
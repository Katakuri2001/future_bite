import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Today's date in the *restaurant's local* timezone, as YYYY-MM-DD.
 *
 * `toISOString()` converts to UTC first, so in a timezone ahead of UTC (Yangon
 * is UTC+7) it returns tomorrow's date for the first seven hours of the local
 * day — which would offer guests a date that is already in the past. Building
 * the string from local getters avoids the conversion entirely.
 */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format a monetary amount.
 *
 * Every amount in this system is in kyat — `dishes.price` is documented as
 * "in kyat (no decimals)" and the DB stores whole numbers. Kyat has no minor
 * unit, so amounts are rendered as whole numbers with thousands separators.
 *
 * This function previously divided by 100 and printed `$`, which assumed cents
 * and USD. That made a 6,800 kyat dish render as "$68.00" on the menu, on POS
 * totals, on receipts and in admin revenue figures — a customer-facing pricing
 * error across the whole application. Fixing it here corrects all 47 call
 * sites at once.
 */
export function formatPrice(amount: number): string {
  return `${Math.round(Number(amount) || 0).toLocaleString("en-US")} K`;
}

/** Alias of {@link formatPrice}, for call sites that prefer to be explicit. */
export function formatKyat(amount: number): string {
  return formatPrice(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: " " as unknown as undefined,
    hour12: true,
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

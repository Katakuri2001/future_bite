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
 * Format an amount in kyat. Kyat has no minor unit, so amounts are whole
 * numbers — this is the correct formatter for prices in `dishes.price`.
 */
export function formatKyat(amount: number): string {
  return `${Math.round(Number(amount) || 0).toLocaleString("en-US")} K`;
}

/** @deprecated Legacy cents/USD formatter. Use `formatKyat` for menu prices. */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Receipt as ReceiptIcon,
  CalendarDays,
  X,
  Loader2,
  ShieldAlert,
  Printer,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";
import { useRealtime } from "@/lib/useRealtime";
import type { SalesPeriod } from "@/lib/types";

/** Receipts are financial records — owners (admin), managers and cashiers only. */
const ALLOWED_ROLES = ["admin", "manager", "cashier"];

type RoleState = "checking" | "allowed" | "denied" | "anonymous";

interface ReceiptRow {
  id: string;
  receiptNo: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number | null;
  total: number;
  paymentMethod: "cash" | "card" | "qr";
  receiptType: "e" | "physical";
  createdBy: string;
  createdAt: string;
}

const periods: { id: SalesPeriod; label: string }[] = [
  { id: "daily", label: "Day" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Bucket key for a receipt timestamp — matches `salesBucketKey` in lib/db.ts (UTC). */
function bucketKey(iso: string, period: SalesPeriod): string {
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  if (period === "daily") return day;
  if (period === "weekly") {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const diff = (dow + 6) % 7; // days since Monday
    return new Date(Date.UTC(y, m - 1, d - diff)).toISOString().slice(0, 10);
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function bucketLabel(key: string, period: SalesPeriod): string {
  const [y, m, d] = key.split("-").map(Number);
  if (period === "monthly") return `${MONTHS[m - 1]} ${y}`;
  if (period === "weekly") {
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(Date.UTC(y, m - 1, d + 6));
    return `${WEEKDAYS[(start.getUTCDay() + 6) % 7]} ${d} ${MONTHS[m - 1]} — ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[(dt.getUTCDay() + 6) % 7]} ${d} ${MONTHS[m - 1]}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export default function ReceiptsPage() {
  const [roleState, setRoleState] = useState<RoleState>("checking");
  const [period, setPeriod] = useState<SalesPeriod>("daily");
  const [selectedDate, setSelectedDate] = useState("");
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Access control: verify the server-side session, then gate on role ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!localStorage.getItem("token")) {
          if (!cancelled) setRoleState("anonymous");
          return;
        }
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (cancelled) return;
        const role = json?.data?.user?.role as string | undefined;
        if (!res.ok || !role) {
          setRoleState("anonymous");
          return;
        }
        setRoleState(ALLOWED_ROLES.includes(role) ? "allowed" : "denied");
      } catch {
        if (!cancelled) setRoleState("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchReceipts = useCallback(() => {
    if (roleState !== "allowed") return;
    fetch("/api/admin/receipts?limit=500")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReceipts(Array.isArray(json.data) ? json.data : []);
          setError("");
        } else {
          setError(json.error || "Could not load receipts");
        }
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [roleState]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useRealtime(fetchReceipts);

  // --- Group by period, then apply the calendar filter ---
  const buckets = useMemo(() => {
    const map = new Map<string, ReceiptRow[]>();
    for (const r of receipts) {
      if (selectedDate && r.createdAt.slice(0, 10) !== selectedDate) continue;
      const key = bucketKey(r.createdAt, period);
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest bucket first
      .map(([key, rows]) => ({
        key,
        label: bucketLabel(key, period),
        rows: rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
        revenue: rows.reduce((s, r) => s + r.total, 0),
      }));
  }, [receipts, period, selectedDate]);

  const totals = useMemo(
    () => ({
      receipts: buckets.reduce((s, b) => s + b.rows.length, 0),
      revenue: buckets.reduce((s, b) => s + b.revenue, 0),
    }),
    [buckets]
  );

  // --- Guards -------------------------------------------------------------
  if (roleState === "checking") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gold" />
        <span className="sr-only">Checking permissions</span>
      </div>
    );
  }

  if (roleState !== "allowed") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-surface border border-border/50 p-8">
          <ShieldAlert size={28} className="mx-auto text-error mb-4" />
          <h1 className="text-lg font-bold text-ivory mb-2">Access denied</h1>
          <p className="text-sm text-ivory-dim mb-6">
            {roleState === "anonymous"
              ? "Please sign in with an owner, manager or cashier account to view receipts."
              : "Receipts contain financial records and are limited to owners, managers and cashiers."}
          </p>
          <Link
            href={roleState === "anonymous" ? "/login" : "/"}
            className="inline-block px-5 py-2.5 bg-gold text-bg text-xs font-bold uppercase tracking-[0.15em] hover:bg-gold-muted transition-colors"
          >
            {roleState === "anonymous" ? "Sign In" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  // --- Page ---------------------------------------------------------------
  return (
    <AdminLayout>
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-xl font-bold text-ivory flex items-center gap-2">
              <ReceiptIcon size={18} className="text-gold" />
              Receipts
            </h1>
            <p className="text-ivory-dim text-xs mt-1">
              {totals.receipts} receipt{totals.receipts === 1 ? "" : "s"} ·{" "}
              {formatPrice(totals.revenue)}
              {selectedDate ? ` · ${selectedDate}` : ""}
            </p>
          </div>
          {loading && <Loader2 size={16} className="animate-spin text-gold mt-1" />}
        </div>

        {/* Controls — period sort + calendar date filter */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="flex gap-1 bg-bg border border-border/50 p-0.5">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                className={cn(
                  "px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors",
                  period === p.id
                    ? "bg-gold text-bg font-bold"
                    : "text-ivory-dim hover:text-ivory"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="receipt-date"
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-ivory-dim"
            >
              <CalendarDays size={13} className="text-gold" />
              Date
            </label>
            <input
              id="receipt-date"
              type="date"
              value={selectedDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg border border-border-light text-ivory px-3 py-1.5 text-xs focus:border-gold focus:outline-none [color-scheme:dark]"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-ivory-dim hover:text-ivory p-1"
                aria-label="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        )}

        {buckets.length === 0 && (
          <div className="text-center py-16 text-ivory-dim text-sm border border-border/30">
            No receipts {selectedDate ? `on ${selectedDate}` : "in this period"}.
          </div>
        )}

        <div className="space-y-6">
          {buckets.map((bucket) => (
            <section key={bucket.key} className="bg-surface border border-border/50">
              <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ivory">
                  {bucket.label}
                </h2>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-ivory-dim">
                  <span>{bucket.rows.length} receipts</span>
                  <span className="text-gold font-bold">{formatPrice(bucket.revenue)}</span>
                </div>
              </header>

              {/* Table on wide screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ivory-dim text-left border-b border-border/30">
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Receipt</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Order</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Guest / Table</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Cashier</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Total</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {bucket.rows.map((r) => (
                      <tr key={r.id} className="border-b border-border/20 last:border-0 hover:bg-bg/40">
                        <td className="px-4 py-2.5 text-ivory font-medium">{r.receiptNo}</td>
                        <td className="px-4 py-2.5 text-ivory-dim">{r.orderNumber}</td>
                        <td className="px-4 py-2.5 text-ivory-dim">{formatTime(r.createdAt)}</td>
                        <td className="px-4 py-2.5 text-ivory-dim">
                          {r.customerName}
                          {r.tableNumber != null && ` · T${r.tableNumber}`}
                        </td>
                        <td className="px-4 py-2.5 text-ivory-dim">{r.createdBy}</td>
                        <td className="px-4 py-2.5 text-ivory-dim uppercase">
                          {r.paymentMethod} · {r.receiptType === "e" ? "e-receipt" : "print"}
                        </td>
                        <td className="px-4 py-2.5 text-gold font-bold text-right">
                          {formatPrice(r.total)}
                        </td>
                        <td className="px-4 py-2.5">
                          <a
                            href={`/receipts/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open receipt"
                            className="inline-flex text-ivory-dim hover:text-gold transition-colors"
                          >
                            <Printer size={13} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards on small screens */}
              <ul className="md:hidden divide-y divide-border/20">
                {bucket.rows.map((r) => (
                  <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ivory text-xs font-medium">{r.receiptNo}</p>
                      <p className="text-ivory-dim text-[10px] truncate">
                        {r.orderNumber} · {formatTime(r.createdAt)} · {r.customerName}
                        {r.tableNumber != null && ` · T${r.tableNumber}`}
                      </p>
                    </div>
                    <span className="text-gold text-xs font-bold shrink-0">
                      {formatPrice(r.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
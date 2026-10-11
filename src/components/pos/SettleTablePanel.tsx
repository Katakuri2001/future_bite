"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Receipt,
  Search,
  UserCheck,
  Ticket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn, formatKyat } from "@/lib/utils";
import type { Receipt as ReceiptType } from "@/lib/types";

interface OpenTable {
  orderId: string;
  orderNumber: string;
  tableNumber: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  itemCount: number;
  hasAccount: boolean;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions: string;
  }[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: string;
  couponCount: number;
  coupons: { code: string; amount: number }[];
}

const inputCls =
  "w-full bg-bg border border-border-light text-ivory px-3 py-2 text-sm focus:border-gold focus:outline-none";

/**
 * Settle a tab a waiter opened.
 *
 * A walk-in table is anonymous by default and settles exactly as before. If
 * the guest identifies themselves at the till, their account is attached and
 * they earn Royal points on what they actually pay — and may spend one of their
 * coupons, which is applied before tax so the guest is not charged tax on the
 * discount.
 *
 * Totals shown here are the order's own recorded amounts, recomputed here the
 * same way the server will, purely so the guest sees the discounted figure
 * before the cashier commits. The server's figure is the one that counts.
 */
export default function SettleTablePanel({
  onSettled,
}: {
  onSettled?: (result: {
    receipt: ReceiptType;
    receiptUrl: string;
    order: { orderNumber: string; total: number };
  }) => void;
}) {
  const [tables, setTables] = useState<OpenTable[]>([]);
  const [selected, setSelected] = useState<OpenTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const loadTables = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/tables");
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        // Drop a selection that has since been settled by someone else.
        setSelected((cur) =>
          cur ? data.data.find((t: OpenTable) => t.orderId === cur.orderId) ?? null : null
        );
      }
    } catch {
      setError("Could not reach the till service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Debounced search: the cashier is typing a name, not pasting a query.
  // Clearing happens in the input handler, not here — setting state
  // synchronously inside an effect cascades an extra render.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/pos/customers?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.success ? data.data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
    }
  }

  function resetGuest() {
    setCustomer(null);
    setCouponCode(null);
    setQuery("");
    setResults([]);
  }

  // Mirrors settleExistingOrder: discount first, then tax and service on the
  // reduced figure, so the guest sees the number they will actually pay.
  const discount = (() => {
    if (!customer || !couponCode) return 0;
    const coupon = customer.coupons.find((c) => c.code === couponCode);
    return Math.min(coupon?.amount ?? 0, selected?.subtotal ?? 0);
  })();
  const payableSubtotal = Math.max(0, (selected?.subtotal ?? 0) - discount);
  const payableTax = Math.round(payableSubtotal * 0.1);
  const payableService = Math.round(payableSubtotal * 0.05);
  const payableTotal = payableSubtotal + payableTax + payableService;
  const pointsEarned = Math.floor(payableTotal / 10000);

  async function settle() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selected.orderId,
          paymentMethod,
          customerId: customer?.id,
          couponCode: couponCode ?? undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Could not settle that table");
        return;
      }
      setFlash(
        customer
          ? `Settled ${selected.orderNumber} — ${customer.name} earned ${Math.floor(
              (data.data.order.total as number) / 10000
            )} pts`
          : `Settled ${selected.orderNumber}`
      );
      setTimeout(() => setFlash(null), 4000);
      setSelected(null);
      resetGuest();
      await loadTables();
      if (onSettled) onSettled(data.data);
    } catch {
      setError("Connection error — nothing was charged.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-ivory-dim">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs tracking-widest uppercase">Loading tables</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ticket size={14} className="text-gold" />
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-ivory-dim">
          Settle a table
        </h2>
      </div>

      {error && (
        <div className="p-2.5 bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {flash && (
        <div className="p-2.5 bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2">
          <CheckCircle2 size={13} />
          {flash}
        </div>
      )}

      {!selected ? (
        tables.length === 0 ? (
          <p className="text-ivory-dim text-xs py-6 text-center">
            No open tables. A waiter must take the order first.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {tables.map((t) => (
              <button
                key={t.orderId}
                onClick={() => {
                  setSelected(t);
                  resetGuest();
                  setError(null);
                }}
                className="text-left p-2.5 border border-border-light hover:border-gold/50 transition-colors"
              >
                <p className="text-ivory text-xs font-bold">
                  Table {t.tableNumber}
                </p>
                <p className="text-ivory-dim text-[10px] mt-0.5">
                  {t.itemCount} items · {t.orderNumber}
                </p>
                <p className="text-gold text-[10px] mt-1 tabular-nums">
                  {formatKyat(t.total)}
                </p>
                {t.hasAccount && (
                  <p className="text-[9px] tracking-wider uppercase text-accent mt-1">
                    Account attached
                  </p>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="border border-border/50">
          {/* Bill */}
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-ivory text-xs font-bold">
                  Table {selected.tableNumber}
                </p>
                <p className="text-ivory-dim text-[10px]">
                  {selected.itemCount} items · {selected.orderNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  resetGuest();
                }}
                className="text-ivory-dim hover:text-gold"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="space-y-0.5 max-h-28 overflow-y-auto">
              {selected.items.map((i) => (
                <li key={i.id} className="flex justify-between text-[11px]">
                  <span className="text-ivory-muted truncate">
                    {i.quantity} × {i.name}
                  </span>
                  <span className="text-ivory-dim tabular-nums shrink-0 ml-2">
                    {formatKyat(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Guest identity */}
          <div className="p-3 border-b border-border/40">
            <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
              Royal account
            </label>
            {customer ? (
              <div className="flex items-center justify-between bg-bg border border-gold/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-ivory text-xs truncate">{customer.name}</p>
                  <p className="text-ivory-dim text-[10px]">
                    {customer.points} pts · {customer.tier}
                  </p>
                </div>
                <button
                  onClick={resetGuest}
                  className="text-ivory-dim hover:text-error shrink-0"
                  aria-label="Remove account"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-dim"
                  />
                  <input
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search by name or email"
                    className={cn(inputCls, "pl-8")}
                  />
                </div>
                {searching && (
                  <p className="text-ivory-dim text-[10px] mt-1.5">Searching…</p>
                )}
                {results.length > 0 && (
                  <ul className="mt-1.5 border border-border-light max-h-40 overflow-y-auto">
                    {results.map((u) => (
                      <li key={u.id}>
                        <button
                          onClick={() => {
                            setCustomer(u);
                            setCouponCode(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-surface-elevated flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0">
                            <span className="text-ivory text-xs block truncate">
                              {u.name}
                            </span>
                            <span className="text-ivory-dim text-[10px] block truncate">
                              {u.email}
                            </span>
                          </span>
                          <span className="text-gold text-[10px] tabular-nums shrink-0">
                            {u.points} pts
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <p className="text-ivory-dim text-[10px] mt-1.5">
                    No account found — the table will settle without points.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Coupon */}
          {customer && customer.coupons.length > 0 && (
            <div className="p-3 border-b border-border/40">
              <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                Coupon
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCouponCode(null)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] border transition-colors",
                    !couponCode
                      ? "border-gold text-gold bg-gold/10"
                      : "border-border-light text-ivory-dim hover:border-gold/50"
                  )}
                >
                  None
                </button>
                {customer.coupons.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCouponCode(c.code)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] border transition-colors",
                      couponCode === c.code
                        ? "border-gold text-gold bg-gold/10"
                        : "border-border-light text-ivory-dim hover:border-gold/50"
                    )}
                  >
                    {formatKyat(c.amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="p-3 space-y-1 text-xs">
            <Row label="Subtotal" value={formatKyat(selected.subtotal)} />
            {discount > 0 && (
              <Row label="Coupon" value={`− ${formatKyat(discount)}`} accent />
            )}
            <Row label="Tax" value={formatKyat(payableTax)} />
            <Row label="Service" value={formatKyat(payableService)} />
            <div className="flex justify-between pt-1.5 border-t border-border/40">
              <span className="text-ivory text-xs">Payable</span>
              <span className="text-gold tabular-nums">{formatKyat(payableTotal)}</span>
            </div>
            {customer && (
              <p className="text-[10px] text-ivory-dim text-right">
                {customer.name} earns {pointsEarned} pt{pointsEarned === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="p-3 border-t border-border/40">
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {(["cash", "card", "qr"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={cn(
                    "py-1.5 text-[10px] uppercase tracking-wider border transition-colors",
                    paymentMethod === m
                      ? "border-gold text-gold bg-gold/10"
                      : "border-border-light text-ivory-dim hover:border-gold/50"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={settle}
              disabled={busy}
              className="btn-primary w-full text-xs py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserCheck size={13} />
              )}
              {busy ? "Settling…" : `Settle ${formatKyat(payableTotal)}`}
            </button>
          </div>
        </div>
      )}

      {selected && (
        <button
          onClick={() => {
            setSelected(null);
            resetGuest();
          }}
          className="text-[10px] tracking-wider uppercase text-ivory-dim hover:text-gold"
        >
          <Receipt size={11} className="inline mr-1" />
          Back to tables
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ivory-dim">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          accent ? "text-success" : "text-ivory-muted"
        )}
      >
        {value}
      </span>
    </div>
  );
}
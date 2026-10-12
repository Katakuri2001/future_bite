"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Receipt,
  CreditCard,
  Ban,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn, formatKyat } from "@/lib/utils";

/**
 * Table bills, grouped by table.
 *
 * The queue a cashier works down at close: bills issued but not yet paid,
 * found by table rather than by scrolling a register. Marking one paid is the
 * only action here that moves money — and therefore the only one that mints
 * Royal points or consumes a coupon.
 */

interface BillItem {
  id: string;
  receiptNo: string;
  orderNumber: string;
  customerName: string;
  tableNumber: number | null;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  tax: number;
  serviceCharge: number;
  total: number;
  status: string;
  paymentMethod: string | null;
  billedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  pointsEarned: number;
  raisedAt: string;
}

interface BillGroup {
  table: string;
  tableNumber: number | null;
  count: number;
  total: number;
  items: BillItem[];
}

export default function ReceiptsPanel() {
  const [scope, setScope] = useState<"unpaid" | "today">("unpaid");
  const [groups, setGroups] = useState<BillGroup[]>([]);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async (which: "unpaid" | "today") => {
    try {
      const res = await fetch(`/api/pos/receipts?scope=${which}`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.data.groups);
        setUnpaidTotal(data.data.unpaidTotal);
      }
    } catch {
      setError("Could not reach the till service.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Loading is set by the initial state and by the scope buttons, not here —
// setting it in the effect body cascades an extra render.
useEffect(() => {
  load(scope);
}, [scope, load]);

  // A bill raised at another till, or paid here, should appear without a
  // manual refresh.
  useEffect(() => {
    const t = setInterval(() => load(scope), 30000);
    return () => clearInterval(t);
  }, [scope, load]);

  async function settle(bill: BillItem, paymentMethod: string) {
    setBusyId(bill.id);
    setError(null);
    try {
      const res = await fetch("/api/pos/receipts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: bill.id, status: "paid", paymentMethod }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Could not settle that bill");
        return;
      }
      const earned = data.data.pointsEarned ?? 0;
      setFlash(
        earned > 0
          ? `${bill.receiptNo} paid — ${bill.customerName} earned ${earned} pts`
          : `${bill.receiptNo} paid`
      );
      setTimeout(() => setFlash(null), 4000);
      await load(scope);
    } catch {
      setError("Connection error — nothing was charged.");
    } finally {
      setBusyId(null);
    }
  }

  async function voidBill(bill: BillItem) {
    setBusyId(bill.id);
    setError(null);
    try {
      const res = await fetch("/api/pos/receipts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: bill.id, status: "void" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Could not void that bill");
        return;
      }
      setFlash(`${bill.receiptNo} void — the table is open again`);
      setTimeout(() => setFlash(null), 4000);
      await load(scope);
    } catch {
      setError("Connection error.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-gold" />
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-ivory-dim">
            Table bills
          </h2>
          {unpaidTotal > 0 && (
            <span className="text-[10px] bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 tabular-nums">
              {formatKyat(unpaidTotal)} outstanding
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(["unpaid", "today"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setLoading(true);
                setScope(s);
              }}
              className={cn(
                "px-2 py-1 text-[10px] tracking-wider uppercase border transition-colors",
                scope === s
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border-light text-ivory-dim hover:border-gold/50"
              )}
            >
              {s === "unpaid" ? "Unpaid" : "Today"}
            </button>
          ))}
        </div>
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

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-ivory-dim">
          <Loader2 size={13} className="animate-spin" />
          <span className="text-xs">Loading bills</span>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-ivory-dim text-xs py-4 text-center">
          {scope === "unpaid"
            ? "No unpaid bills. Issue one from the table list above."
            : "No bills raised today."}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.table} className="border border-border/50">
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface-elevated/40 border-b border-border/40">
                <span className="text-[10px] tracking-[0.15em] uppercase text-gold">
                  {g.table}
                </span>
                <span className="text-[10px] text-ivory-dim tabular-nums">
                  {g.count} bill{g.count === 1 ? "" : "s"} ·{" "}
                  {formatKyat(g.total)}
                </span>
              </div>

              {g.items.map((b) => {
                const isVoid = b.status === "void";
                const isPaid = b.status === "paid";
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "p-2.5 border-b border-border/30 last:border-b-0",
                      isVoid && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-ivory text-xs truncate">
                          {b.customerName}
                          <span className="text-ivory-dim ml-1.5">
                            {b.receiptNo}
                          </span>
                        </p>
                        <p className="text-ivory-dim text-[10px] mt-0.5">
                          {new Date(b.raisedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {b.status === "paid" && b.paymentMethod
                            ? ` · paid by ${b.paymentMethod}`
                            : ""}
                          {isVoid ? " · void" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-gold text-xs tabular-nums">
                          {formatKyat(b.total)}
                        </p>
                        {b.discount > 0 && (
                          <p className="text-success text-[9px] tabular-nums">
                            −{formatKyat(b.discount)} coupon
                          </p>
                        )}
                      </div>
                    </div>

                    {!isVoid && (
                      <div className="flex gap-1.5 mt-2">
                        {!isPaid && (
                          <>
                            {(["cash", "card", "qr"] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => settle(b, m)}
                                disabled={busyId === b.id}
                                className="flex-1 py-1.5 text-[10px] uppercase tracking-wider border border-border-light text-ivory-dim hover:border-gold hover:text-gold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                              >
                                {busyId === b.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <CreditCard size={10} />
                                )}
                                {m}
                              </button>
                            ))}
                            <button
                              onClick={() => voidBill(b)}
                              disabled={busyId === b.id}
                              title="Void this bill and reopen the table"
                              aria-label={`Void ${b.receiptNo}`}
                              className="px-2 py-1.5 border border-border-light text-ivory-dim hover:border-error hover:text-error transition-colors disabled:opacity-50"
                            >
                              <Ban size={11} />
                            </button>
                          </>
                        )}

                        <a
                          href={`/receipts/${b.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open the receipt"
                          className="px-2 py-1.5 border border-border-light text-ivory-dim hover:border-gold hover:text-gold transition-colors inline-flex items-center"
                        >
                          <Printer size={11} />
                        </a>

                        {isPaid && b.pointsEarned > 0 && (
                          <span className="flex-1 text-[10px] text-success inline-flex items-center justify-end gap-1">
                            <RotateCcw size={10} />+{b.pointsEarned} pts
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
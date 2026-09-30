"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Receipt, ShoppingBag, BarChart3 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useRealtime } from "@/lib/useRealtime";
import type { SalesPeriod, SalesReport } from "@/lib/types";

const periods: { id: SalesPeriod; label: string }[] = [
  { id: "daily", label: "Day" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
];

const periodNouns: Record<SalesPeriod, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

const emptyReport: SalesReport = {
  period: "daily",
  buckets: [],
  totals: { revenue: 0, receipts: 0, orders: 0, averageRevenue: 0, averageReceipts: 0 },
};

export default function SalesPanel({ className }: { className?: string }) {
  const [period, setPeriod] = useState<SalesPeriod>("daily");
  const [data, setData] = useState<SalesReport | null>(null);

  const fetchReport = useCallback(() => {
    fetch(`/api/admin/sales?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {});
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useRealtime(fetchReport);

  const report = data || emptyReport;
  const { buckets, totals } = report;
  const maxRevenue = Math.max(1, ...buckets.map((b) => b.revenue));
  const maxReceipts = Math.max(1, ...buckets.map((b) => b.receipts));
  const noun = periodNouns[period];

  return (
    <div className={cn("bg-surface border border-border/50 p-6", className)}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-sm font-medium text-ivory flex items-center gap-2">
          <BarChart3 size={15} className="text-gold" />
          Sales — Revenue &amp; Receipts
        </h3>
        <div className="flex gap-1 bg-bg border border-border/50 p-0.5">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
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
      </div>

      {/* Totals cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-success" />
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider">
              Revenue ({noun})
            </p>
          </div>
          <p className="text-xl font-bold text-ivory">{formatPrice(totals.revenue)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Receipt size={13} className="text-gold" />
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider">
              Receipts ({noun})
            </p>
          </div>
          <p className="text-xl font-bold text-ivory">{totals.receipts}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBag size={13} className="text-accent" />
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider">
              Paid Orders
            </p>
          </div>
          <p className="text-xl font-bold text-ivory">{totals.orders}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-ivory-dim" />
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider">
              Avg / {noun}
            </p>
          </div>
          <p className="text-xl font-bold text-ivory">{formatPrice(totals.averageRevenue)}</p>
        </div>
      </div>

      {/* Chart — revenue bars + receipts line */}
      <div className="flex items-end gap-3 h-44">
        {buckets.map((b) => (
          <div key={b.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <span className="text-ivory-dim text-[9px]">{b.receipts}</span>
            <div className="w-full flex items-end justify-center" style={{ height: "6.5rem" }}>
              <div className="relative w-full max-w-10">
                <div
                  className="w-full bg-gradient-to-t from-gold to-gold-muted transition-all duration-700"
                  style={{ height: `${Math.max(4, (b.revenue / maxRevenue) * 104)}px` }}
                  title={`${b.label}: ${formatPrice(b.revenue)} / ${b.receipts} receipts`}
                />
                {b.receipts > 0 && (
                  <div
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent"
                    style={{ top: `${104 - Math.min(104, (b.receipts / maxReceipts) * 104)}px` }}
                  />
                )}
              </div>
            </div>
            <span className="text-ivory-dim text-[10px] truncate max-w-full">{b.label}</span>
          </div>
        ))}
        {buckets.length === 0 && (
          <div className="flex-1 text-center py-12 text-ivory-dim text-sm">
            No sales data yet.
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-ivory-dim uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-3 bg-gold inline-block" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" /> Receipts count
        </span>
      </div>
    </div>
  );
}
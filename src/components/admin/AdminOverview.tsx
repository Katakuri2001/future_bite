"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  ShoppingBag,
  Receipt,
  Users,
  TrendingUp,
  ChefHat,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import SalesPanel from "@/components/admin/SalesPanel";
import { displayStats } from "./overview-stats";

interface PopularDish {
  name: string;
  orders: number;
}

interface AnalyticsStats {
  todayReservations: number;
  todayOrders: number;
  todayReceipts: number;
  currentCovers: number;
  kitchenQueue: number;
  revenue: number;
  averageOrderValue: number;
  occupancy: number;
  lowStockCount: number;
  popularDishes: PopularDish[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
          setError(null);
        } else {
          setError(data.error || "Could not load analytics");
        }
      })
      .catch(() => setError("Could not reach the server"));
  }, []);

  // Never invent figures. If the fetch failed, the tiles read zero and the
  // banner below says so, rather than showing a plausible-looking revenue
  // number that an owner might act on.
  const shown = displayStats(stats, error);
  const data = shown;

  const statItems = [
    { label: "Today's Reservations", value: data.todayReservations, icon: CalendarDays, color: "text-gold" },
    { label: "Today's Orders", value: data.todayOrders, icon: ShoppingBag, color: "text-ivory" },
    { label: "Receipts Today", value: data.todayReceipts ?? 0, icon: Receipt, color: "text-gold" },
    { label: "Current Covers", value: data.currentCovers, icon: Users, color: "text-ivory" },
    { label: "Kitchen Queue", value: data.kitchenQueue, icon: ChefHat, color: "text-warning" },
    { label: "Revenue", value: formatPrice(data.revenue), icon: TrendingUp, color: "text-success" },
  ];

  // Surface low stock proactively: the audit found it was computed and shown
  // on the inventory page, but never surfaced on the dashboard where an owner
  // would actually see it.
  const lowStock = data.lowStockCount ?? 0;

  return (
    <div>
      {shown.stale && (
        <div className="mb-6 p-3 bg-warning/10 border border-warning/30 text-warning text-sm flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {error
            ? `Dashboard data unavailable: ${error}. Figures below are not real.`
            : "Loading dashboard data…"}
        </div>
      )}

      {!shown.stale && lowStock > 0 && (
        <div className="mb-6 p-3 bg-warning/10 border border-warning/30 text-warning text-sm flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {lowStock} ingredient{lowStock === 1 ? "" : "s"} below minimum stock.{" "}
          <a href="/admin/inventory" className="underline hover:text-ivory">
            Review inventory
          </a>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-ivory">Dashboard</h1>
          <p className="text-ivory-dim text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-ivory-dim text-xs">
          <Clock size={12} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface border border-border/50 p-4">
              <Icon size={16} className={`${stat.color} mb-3`} strokeWidth={1.5} />
              <p className="text-2xl font-bold text-ivory mb-1">{stat.value}</p>
              <p className="text-ivory-dim text-xs">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <SalesPanel className="mb-8" />

      <div className="bg-surface border border-border/50 p-6 mb-8">
        <h3 className="text-sm font-medium text-ivory mb-4">Occupancy</h3>
        <div className="w-full h-3 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-muted rounded-full transition-all duration-1000"
            style={{ width: `${data.occupancy}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-ivory-dim text-xs">0%</span>
          <span className="text-gold text-xs font-medium">{data.occupancy}%</span>
          <span className="text-ivory-dim text-xs">100%</span>
        </div>
      </div>

      <div className="bg-surface border border-border/50 p-6">
        <h3 className="text-sm font-medium text-ivory mb-4">Popular Dishes Today</h3>
        <div className="space-y-3">
          {(data.popularDishes || []).map((dish: PopularDish, i: number) => (
            <div key={dish.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-ivory-dim text-xs w-5">{i + 1}.</span>
                <span className="text-ivory text-sm">{dish.name}</span>
              </div>
              <span className="text-ivory-dim text-sm">{dish.orders} orders</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

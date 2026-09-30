"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SalesPanel from "@/components/admin/SalesPanel";
import { formatPrice } from "@/lib/utils";

interface AnalyticsData {
  todayReservations: number;
  todayOrders: number;
  todayReceipts: number;
  currentCovers: number;
  kitchenQueue: number;
  revenue: number;
  averageOrderValue: number;
  occupancy: number;
  popularDishes: { name: string; orders: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {});
  }, []);

  const stats: AnalyticsData = data || {
    todayReservations: 0,
    todayOrders: 0,
    todayReceipts: 0,
    currentCovers: 0,
    kitchenQueue: 0,
    revenue: 0,
    averageOrderValue: 0,
    occupancy: 0,
    popularDishes: [],
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl font-bold text-ivory mb-6">Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Reservations Today</p>
            <p className="text-2xl font-bold text-ivory">{stats.todayReservations}</p>
          </div>
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Orders Today</p>
            <p className="text-2xl font-bold text-ivory">{stats.todayOrders}</p>
          </div>
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Receipts Today</p>
            <p className="text-2xl font-bold text-gold">{stats.todayReceipts ?? 0}</p>
          </div>
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Kitchen Queue</p>
            <p className="text-2xl font-bold text-warning">{stats.kitchenQueue}</p>
          </div>
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Revenue Today</p>
            <p className="text-2xl font-bold text-success">{formatPrice(stats.revenue)}</p>
          </div>
          <div className="bg-surface border border-border/50 p-4">
            <p className="text-ivory-dim text-[10px] uppercase tracking-wider mb-2">Occupancy</p>
            <p className="text-2xl font-bold text-ivory">{stats.occupancy}%</p>
          </div>
        </div>

        <SalesPanel className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border/50 p-6">
            <h3 className="text-sm font-medium text-ivory mb-4">Popular Dishes</h3>
            <div className="space-y-3">
              {(stats.popularDishes || []).map((dish, i) => (
                <div key={dish.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-ivory-dim text-xs w-5">{i + 1}.</span>
                    <span className="text-ivory text-sm">{dish.name}</span>
                  </div>
                  <span className="text-ivory-dim text-sm">{dish.orders} orders</span>
                </div>
              ))}
              {(stats.popularDishes || []).length === 0 && (
                <p className="text-ivory-dim text-sm">No orders yet.</p>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border/50 p-6">
            <h3 className="text-sm font-medium text-ivory mb-4">Average Order Value</h3>
            <p className="text-3xl font-bold text-gold">{formatPrice(stats.averageOrderValue)}</p>
            <p className="text-ivory-dim text-xs mt-2">
              Across all orders today, excluding cancelled.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
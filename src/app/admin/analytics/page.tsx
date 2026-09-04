"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatPrice } from "@/lib/utils";

interface WeeklyRevenue {
  day: string;
  revenue: number;
}

interface AnalyticsData {
  todayReservations: number;
  todayOrders: number;
  currentCovers: number;
  kitchenQueue: number;
  revenue: number;
  averageOrderValue: number;
  occupancy: number;
  popularDishes: { name: string; orders: number }[];
  weeklyRevenue: WeeklyRevenue[];
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

  const fallback: AnalyticsData = {
    todayReservations: 12,
    todayOrders: 47,
    currentCovers: 28,
    kitchenQueue: 3,
    revenue: 2850000,
    averageOrderValue: 60600,
    occupancy: 78,
    popularDishes: [],
    weeklyRevenue: [
      { day: "Mon", revenue: 1850000 },
      { day: "Tue", revenue: 2100000 },
      { day: "Wed", revenue: 1950000 },
      { day: "Thu", revenue: 2300000 },
      { day: "Fri", revenue: 2850000 },
      { day: "Sat", revenue: 3200000 },
      { day: "Sun", revenue: 2400000 },
    ],
  };

  const stats = data || fallback;
  const maxRevenue = Math.max(...stats.weeklyRevenue.map((d) => d.revenue));

  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl font-bold text-ivory mb-6">Analytics</h1>

        <div className="bg-surface border border-border/50 p-6 mb-8">
          <h3 className="text-sm font-medium text-ivory mb-6">Weekly Revenue</h3>
          <div className="flex items-end gap-3 h-48">
            {stats.weeklyRevenue.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-ivory-dim text-[10px]">{formatPrice(d.revenue)}</span>
                <div
                  className="w-full bg-gradient-to-t from-gold to-gold-muted transition-all duration-1000"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                />
                <span className="text-ivory-dim text-xs">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Total Revenue (Week)</p>
            <p className="text-2xl font-bold text-ivory">
              {formatPrice(stats.weeklyRevenue.reduce((a, b) => a + b.revenue, 0))}
            </p>
          </div>
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Avg. Daily Revenue</p>
            <p className="text-2xl font-bold text-ivory">
              {formatPrice(Math.round(stats.weeklyRevenue.reduce((a, b) => a + b.revenue, 0) / 7))}
            </p>
          </div>
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Best Day</p>
            <p className="text-2xl font-bold text-ivory">
              {stats.weeklyRevenue.reduce((best, d) => d.revenue > best.revenue ? d : best).day}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

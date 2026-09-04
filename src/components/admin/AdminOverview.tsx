"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  ShoppingBag,
  Users,
  TrendingUp,
  ChefHat,
  Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PopularDish {
  name: string;
  orders: number;
}

interface AnalyticsStats {
  todayReservations: number;
  todayOrders: number;
  currentCovers: number;
  kitchenQueue: number;
  revenue: number;
  averageOrderValue: number;
  occupancy: number;
  popularDishes: PopularDish[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  const defaultStats = {
    todayReservations: 12,
    todayOrders: 47,
    currentCovers: 28,
    kitchenQueue: 3,
    revenue: 2850000,
    averageOrderValue: 60600,
    occupancy: 78,
    popularDishes: [
      { name: "Wagyu A5 Omakase", orders: 18 },
      { name: "Truffle Risotto Cosmos", orders: 15 },
      { name: "Black Cod Stellaris", orders: 12 },
      { name: "Nebula Tartare", orders: 10 },
      { name: "Chocolate Eclipse", orders: 9 },
    ],
  };

  const data = stats || defaultStats;

  const statItems = [
    { label: "Today's Reservations", value: data.todayReservations, icon: CalendarDays, color: "text-gold" },
    { label: "Today's Orders", value: data.todayOrders, icon: ShoppingBag, color: "text-ivory" },
    { label: "Current Covers", value: data.currentCovers, icon: Users, color: "text-ivory" },
    { label: "Kitchen Queue", value: data.kitchenQueue, icon: ChefHat, color: "text-warning" },
    { label: "Revenue", value: formatPrice(data.revenue), icon: TrendingUp, color: "text-success" },
    { label: "Avg. Order Value", value: formatPrice(data.averageOrderValue), icon: TrendingUp, color: "text-ivory" },
  ];

  return (
    <div>
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

"use client";

import {
  CalendarDays,
  ShoppingBag,
  Users,
  TrendingUp,
  ChefHat,
  Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { adminStats } from "@/lib/data";

export default function AdminOverview() {
  const stats = [
    {
      label: "Today's Reservations",
      value: adminStats.todayReservations,
      icon: CalendarDays,
      color: "text-gold",
    },
    {
      label: "Today's Orders",
      value: adminStats.todayOrders,
      icon: ShoppingBag,
      color: "text-ivory",
    },
    {
      label: "Current Covers",
      value: adminStats.currentCovers,
      icon: Users,
      color: "text-ivory",
    },
    {
      label: "Kitchen Queue",
      value: adminStats.kitchenQueue,
      icon: ChefHat,
      color: "text-warning",
    },
    {
      label: "Revenue",
      value: formatPrice(adminStats.revenue),
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Avg. Order Value",
      value: formatPrice(adminStats.averageOrderValue),
      icon: TrendingUp,
      color: "text-ivory",
    },
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface border border-border/50 p-4"
            >
              <Icon size={16} className={`${stat.color} mb-3`} strokeWidth={1.5} />
              <p className="text-2xl font-bold text-ivory mb-1">{stat.value}</p>
              <p className="text-ivory-dim text-xs">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Occupancy */}
      <div className="bg-surface border border-border/50 p-6 mb-8">
        <h3 className="text-sm font-medium text-ivory mb-4">Occupancy</h3>
        <div className="w-full h-3 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-muted rounded-full transition-all duration-1000"
            style={{ width: `${adminStats.occupancy}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-ivory-dim text-xs">0%</span>
          <span className="text-gold text-xs font-medium">
            {adminStats.occupancy}%
          </span>
          <span className="text-ivory-dim text-xs">100%</span>
        </div>
      </div>

      {/* Popular Dishes */}
      <div className="bg-surface border border-border/50 p-6">
        <h3 className="text-sm font-medium text-ivory mb-4">Popular Dishes Today</h3>
        <div className="space-y-3">
          {adminStats.popularDishes.map((dish, i) => (
            <div
              key={dish.name}
              className="flex items-center justify-between"
            >
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

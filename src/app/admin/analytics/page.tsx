"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { formatPrice } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const revenueData = [
    { day: "Mon", revenue: 1850000 },
    { day: "Tue", revenue: 2100000 },
    { day: "Wed", revenue: 1950000 },
    { day: "Thu", revenue: 2300000 },
    { day: "Fri", revenue: 2850000 },
    { day: "Sat", revenue: 3200000 },
    { day: "Sun", revenue: 2400000 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));

  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl font-bold text-ivory mb-6">Analytics</h1>

        {/* Revenue Chart */}
        <div className="bg-surface border border-border/50 p-6 mb-8">
          <h3 className="text-sm font-medium text-ivory mb-6">
            Weekly Revenue
          </h3>
          <div className="flex items-end gap-3 h-48">
            {revenueData.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-ivory-dim text-[10px]">
                  {formatPrice(d.revenue)}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-gold to-gold-muted transition-all duration-1000"
                  style={{
                    height: `${(d.revenue / maxRevenue) * 100}%`,
                  }}
                />
                <span className="text-ivory-dim text-xs">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Total Revenue (Week)</p>
            <p className="text-2xl font-bold text-ivory">
              {formatPrice(revenueData.reduce((a, b) => a + b.revenue, 0))}
            </p>
          </div>
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Avg. Daily Revenue</p>
            <p className="text-2xl font-bold text-ivory">
              {formatPrice(
                Math.round(
                  revenueData.reduce((a, b) => a + b.revenue, 0) / 7
                )
              )}
            </p>
          </div>
          <div className="bg-surface border border-border/50 p-5">
            <p className="text-ivory-dim text-xs mb-2">Best Day</p>
            <p className="text-2xl font-bold text-ivory">
              {revenueData.sort((a, b) => b.revenue - a.revenue)[0].day}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

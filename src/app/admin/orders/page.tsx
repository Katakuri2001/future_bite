"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";

const orders = [
  { id: "1042", table: 8, items: "2× Wagyu, 1× Risotto, 1× Water", total: 17200, status: "preparing", time: "2:41" },
  { id: "1043", table: 3, items: "2× Tartare, 1× Bisque", total: 8000, status: "pending", time: "4:05" },
  { id: "1044", table: 6, items: "4× Cod, 2× Chocolate", total: 24000, status: "plating", time: "1:29" },
  { id: "1045", table: 1, items: "1× Omakase, 2× Cocktail", total: 11200, status: "served", time: "0:00" },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  preparing: "bg-gold/20 text-gold",
  plating: "bg-accent text-ivory",
  ready: "bg-success/20 text-success",
  served: "bg-ivory-dim/20 text-ivory-dim",
  completed: "bg-ivory-dim/20 text-ivory-dim",
};

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Orders</h1>
        </div>

        <div className="bg-surface border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Order
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Table
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Items
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Total
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">
                    Elapsed
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/30 hover:bg-surface-elevated transition-colors"
                  >
                    <td className="px-4 py-3 text-ivory font-mono text-sm">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">{order.table}</td>
                    <td className="px-4 py-3 text-ivory-muted text-sm">
                      {order.items}
                    </td>
                    <td className="px-4 py-3 text-gold text-sm font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider px-2 py-1 inline-block",
                          statusColors[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-sm font-mono">
                      {order.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

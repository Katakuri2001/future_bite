"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  preparing: "bg-gold/20 text-gold",
  plating: "bg-accent text-ivory",
  ready: "bg-success/20 text-success",
  served: "bg-ivory-dim/20 text-ivory-dim",
  completed: "bg-ivory-dim/20 text-ivory-dim",
};

interface AdminOrder {
  id: string;
  table: number;
  items: string;
  total: number;
  status: string;
  time: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(() => {});
  }, []);

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
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Order</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Table</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Items</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Total</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Status</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Elapsed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-3 text-ivory font-mono text-sm">#{order.id}</td>
                    <td className="px-4 py-3 text-ivory text-sm">{order.table}</td>
                    <td className="px-4 py-3 text-ivory-muted text-sm max-w-xs truncate">{order.items}</td>
                    <td className="px-4 py-3 text-gold text-sm font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 inline-block", statusColors[order.status] || "bg-ivory-dim/20 text-ivory-dim")}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-sm font-mono">{order.time}</td>
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

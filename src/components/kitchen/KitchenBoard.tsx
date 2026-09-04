"use client";

import { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flame,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KitchenOrder, OrderStatus } from "@/lib/types";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: KitchenOrder;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}) {
  const priorityColors = {
    normal: "border-l-border-light",
    urgent: "border-l-warning",
    delayed: "border-l-error",
  };

  const statusActions: Record<OrderStatus, { label: string; next: OrderStatus | null }> = {
    pending: { label: "ACCEPT", next: "accepted" },
    accepted: { label: "START", next: "preparing" },
    preparing: { label: "READY", next: "plating" },
    plating: { label: "SERVED", next: "served" },
    ready: { label: "SERVED", next: "served" },
    served: { label: "COMPLETED", next: "completed" },
    completed: { label: "", next: null },
    cancelled: { label: "", next: null },
  };

  const action = statusActions[order.status];

  return (
    <div
      className={cn(
        "bg-surface border border-border/50 border-l-4 p-4 mb-3",
        priorityColors[order.priority]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-ivory font-mono text-sm font-bold">
              {order.orderNumber}
            </span>
            <span className="text-ivory-dim text-xs">TABLE {order.tableNumber}</span>
          </div>
          {order.priority === "urgent" && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-warning text-[10px] uppercase tracking-wider font-medium">
                Urgent
              </span>
            </div>
          )}
          {order.priority === "delayed" && (
            <div className="flex items-center gap-1 mt-1">
              <Flame size={12} className="text-error" />
              <span className="text-error text-[10px] uppercase tracking-wider font-medium">
                Delayed
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-ivory-dim">
          <Clock size={12} />
          <span className="text-xs font-mono">{formatElapsed(order.elapsed)}</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-ivory font-medium">
                {item.quantity} × {item.name}
              </span>
              {item.status === "ready" && (
                <CheckCircle size={12} className="text-success" />
              )}
              {item.status === "preparing" && (
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              )}
            </div>
            {item.specialInstructions && (
              <span className="text-ivory-dim text-xs italic">
                {item.specialInstructions}
              </span>
            )}
          </div>
        ))}
      </div>

      {action.next && (
        <button
          onClick={() => onStatusChange(order.id, action.next!)}
          className={cn(
            "w-full py-3 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200",
            order.status === "pending"
              ? "bg-gold text-bg hover:bg-gold-muted"
              : order.status === "preparing" || order.status === "plating"
              ? "bg-accent text-ivory hover:bg-accent-light"
              : "bg-surface-elevated text-ivory border border-border-light hover:border-gold hover:text-gold"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetch("/api/kitchen")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          elapsed: o.elapsed + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const newOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter(
    (o) => o.status === "accepted" || o.status === "preparing"
  );
  const readyOrders = orders.filter(
    (o) => o.status === "plating" || o.status === "ready"
  );
  const servedOrders = orders.filter(
    (o) => o.status === "served" || o.status === "completed"
  );

  const columns = [
    { title: "NEW", orders: newOrders, color: "text-warning" },
    { title: "PREPARING", orders: preparingOrders, color: "text-gold" },
    { title: "READY", orders: readyOrders, color: "text-success" },
    { title: "SERVED", orders: servedOrders, color: "text-ivory-dim" },
  ];

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat size={20} className="text-gold" />
          <h1 className="text-lg font-bold text-ivory tracking-wide">
            KITCHEN DISPLAY
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-ivory-dim text-xs">
            {orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length} active orders
          </span>
          <button
            onClick={() => setLastRefresh(new Date())}
            className="text-ivory-dim hover:text-gold transition-colors p-2"
            aria-label="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="flex items-center justify-between mb-4">
              <h2
                className={cn(
                  "text-xs font-bold tracking-[0.2em] uppercase",
                  col.color
                )}
              >
                {col.title}
              </h2>
              <span className="text-ivory-dim text-xs bg-surface px-2 py-0.5">
                {col.orders.length}
              </span>
            </div>
            <div className="space-y-3">
              {col.orders.length === 0 && (
                <div className="text-center py-8 text-ivory-dim text-xs">
                  No orders
                </div>
              )}
              {col.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Utensils,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Receipt,
} from "lucide-react";
import WaiterLayout from "@/components/waiter/WaiterLayout";
import { cn, formatKyat } from "@/lib/utils";

interface Table {
  id: string;
  number: number;
  capacity: number;
  experience: string;
  location: string;
  status: string;
  hasOpenOrder: boolean;
  runningTotal: number;
}

interface ReadyDish {
  id: string;
  name: string;
  quantity: number;
  specialInstructions: string;
  orderNumber: string;
  tableNumber: number | null;
  orderedAt: string;
  readyForMinutes: number;
}

interface ServedDish {
  id: string;
  name: string;
  quantity: number;
  specialInstructions: string;
  orderNumber: string;
  tableNumber: number | null;
  orderedAt: string;
  servedAt: string;
  durationMinutes: number | null;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categorySlug: string;
  category: string;
  isAvailable: boolean;
}

export default function WaiterDashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ready, setReady] = useState<ReadyDish[]>([]);
  const [served, setServed] = useState<ServedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [category, setCategory] = useState("all");
  const [tray, setTray] = useState<
    { menuItemId: string; name: string; price: number; quantity: number }[]
  >([]);
  const [sending, setSending] = useState(false);
  const [servingId, setServingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/waiter/queue");
      const data = await res.json();
      if (data.success) {
        setReady(data.data.ready);
        setServed(data.data.served);
      }
    } catch {
      /* realtime refresh will retry */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [t, q] = await Promise.all([
        fetch("/api/waiter/tables").then((r) => r.json()),
        fetch("/api/waiter/queue").then((r) => r.json()),
      ]);
      if (t.success) setTables(t.data);
      if (q.success) {
        setReady(q.data.ready);
        setServed(q.data.served);
      }
      setError(null);
    } catch {
      setError("Could not reach the waiter service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        if (data.items) setMenu(data.items);
      } catch {
        /* menu is required to order; surfaced by the empty panel */
      }
    })();
  }, [refresh]);

  // Keep "waiting N minutes" honest without hammering the API.
  useEffect(() => {
    const t = setInterval(loadQueue, 30000);
    return () => clearInterval(t);
  }, [loadQueue]);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    menu.forEach((m) => seen.set(m.categorySlug, m.category));
    return [...seen.entries()];
  }, [menu]);

  const visibleMenu = useMemo(
    () => menu.filter((m) => category === "all" || m.categorySlug === category),
    [menu, category]
  );

  const trayTotal = tray.reduce((s, t) => s + t.price * t.quantity, 0);

  function addToTray(item: MenuItem) {
    setTray((prev) => {
      const found = prev.find((t) => t.menuItemId === item.id);
      if (found) {
        return prev.map((t) =>
          t.menuItemId === item.id
            ? { ...t, quantity: Math.min(50, t.quantity + 1) }
            : t
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function setTrayQty(menuItemId: string, qty: number) {
    setTray((prev) =>
      qty <= 0
        ? prev.filter((t) => t.menuItemId !== menuItemId)
        : prev.map((t) =>
            t.menuItemId === menuItemId ? { ...t, quantity: Math.min(50, qty) } : t
          )
    );
  }

  async function sendOrder() {
    if (!selectedTable || tray.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/waiter/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: selectedTable,
          items: tray.map((t) => ({ menuItemId: t.menuItemId, quantity: t.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Could not send the order.");
        return;
      }
      setFlash(
        data.data.appended
          ? `Added to the open bill for table ${selectedTable}`
          : `Order ${data.data.orderNumber} sent to the kitchen`
      );
      setTimeout(() => setFlash(null), 3500);
      setTray([]);
      await refresh();
    } catch {
      setError("Connection error — the order was not sent.");
    } finally {
      setSending(false);
    }
  }

  async function serve(itemId: string) {
    setServingId(itemId);
    try {
      const res = await fetch("/api/waiter/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Could not mark that dish served.");
        return;
      }
      await loadQueue();
    } catch {
      setError("Connection error.");
    } finally {
      setServingId(null);
    }
  }

  if (loading) {
    return (
      <WaiterLayout>
        <div className="flex items-center justify-center py-24 gap-3 text-ivory-dim">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm tracking-widest uppercase">Loading the floor</span>
        </div>
      </WaiterLayout>
    );
  }

  return (
    <WaiterLayout onRefresh={refresh}>
      <div className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="p-3 bg-error/10 border border-error/30 text-error text-sm flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {flash && (
          <div className="p-3 bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
            <CheckCircle2 size={14} />
            {flash}
          </div>
        )}

        {/* Floor strip */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xs tracking-[0.2em] uppercase text-ivory-dim">
              The floor
            </h1>
            {selectedTable && (
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setTray([]);
                }}
                className="text-xs text-ivory-dim hover:text-gold transition-colors inline-flex items-center gap-1"
              >
                <X size={12} /> Clear table
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t.number)}
                className={cn(
                  "p-3 text-left border transition-all duration-200",
                  selectedTable === t.number
                    ? "border-gold bg-gold/10"
                    : t.hasOpenOrder
                    ? "border-accent bg-accent/20 hover:border-gold/50"
                    : "border-border-light hover:border-gold/40"
                )}
              >
                <p className="text-ivory font-bold text-sm">T{t.number}</p>
                <p className="text-ivory-dim text-[10px] mt-0.5 truncate">
                  {t.capacity} seats
                </p>
                {t.hasOpenOrder && (
                  <p className="text-gold text-[10px] mt-1 tabular-nums">
                    {formatKyat(t.runningTotal)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Take an order */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={14} className="text-gold" />
              <h2 className="text-xs tracking-[0.2em] uppercase text-ivory-dim">
                {selectedTable ? `Order for table ${selectedTable}` : "Take an order"}
              </h2>
            </div>

            {!selectedTable ? (
              <div className="bg-surface border border-border/50 p-8 text-center">
                <p className="text-ivory-dim text-sm">Select a table above to start.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border/50 flex flex-col">
                {/* categories */}
                <div className="flex gap-1.5 p-3 border-b border-border/40 flex-wrap">
                  <button
                    onClick={() => setCategory("all")}
                    className={cn(
                      "px-3 py-1 text-[10px] tracking-[0.1em] uppercase border transition-colors",
                      category === "all"
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border-light text-ivory-dim hover:border-gold/40"
                    )}
                  >
                    All
                  </button>
                  {categories.map(([slug, name]) => (
                    <button
                      key={slug}
                      onClick={() => setCategory(slug)}
                      className={cn(
                        "px-3 py-1 text-[10px] tracking-[0.1em] uppercase border transition-colors",
                        category === slug
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border-light text-ivory-dim hover:border-gold/40"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* dishes */}
                <div className="max-h-72 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {visibleMenu.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addToTray(m)}
                      disabled={!m.isAvailable}
                      className="text-left p-2.5 border border-border-light hover:border-gold/50 transition-colors disabled:opacity-40"
                    >
                      <p className="text-ivory text-xs truncate">{m.name}</p>
                      <p className="text-gold text-[10px] mt-1 tabular-nums">
                        {formatKyat(m.price)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* tray */}
                <div className="border-t border-border/40 p-3">
                  {tray.length === 0 ? (
                    <p className="text-ivory-dim text-xs">Nothing added yet.</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5 mb-3">
                        {tray.map((t) => (
                          <li key={t.menuItemId} className="flex items-center justify-between text-xs">
                            <span className="text-ivory truncate">{t.name}</span>
                            <span className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setTrayQty(t.menuItemId, t.quantity - 1)}
                                className="w-5 h-5 border border-border-light text-ivory-dim hover:text-gold"
                              >
                                −
                              </button>
                              <span className="text-ivory tabular-nums w-4 text-center">
                                {t.quantity}
                              </span>
                              <button
                                onClick={() => setTrayQty(t.menuItemId, t.quantity + 1)}
                                className="w-5 h-5 border border-border-light text-ivory-dim hover:text-gold"
                              >
                                +
                              </button>
                              <span className="text-gold tabular-nums w-16 text-right">
                                {formatKyat(t.price * t.quantity)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-ivory-dim text-xs">
                          Subtotal (tax &amp; service added on the bill)
                        </span>
                        <span className="text-gold text-sm tabular-nums">
                          {formatKyat(trayTotal)}
                        </span>
                      </div>
                      <button
                        onClick={sendOrder}
                        disabled={sending}
                        className="btn-primary w-full text-xs py-3 disabled:opacity-50"
                      >
                        {sending ? "Sending..." : "Send to kitchen"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Ready to run */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-success" />
              <h2 className="text-xs tracking-[0.2em] uppercase text-ivory-dim">
                Ready to run
              </h2>
              {ready.length > 0 && (
                <span className="text-[10px] bg-success/20 text-success border border-success/30 px-1.5 py-0.5">
                  {ready.length}
                </span>
              )}
            </div>
            <div className="bg-surface border border-border/50 divide-y divide-border/30">
              {ready.length === 0 ? (
                <p className="p-8 text-center text-ivory-dim text-sm">
                  Nothing waiting. Dishes appear here the moment the kitchen
                  plates them.
                </p>
              ) : (
                ready.map((d) => (
                  <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ivory text-sm truncate">
                        {d.quantity} × {d.name}
                      </p>
                      <p className="text-ivory-dim text-xs mt-0.5">
                        Table {d.tableNumber ?? "—"} · {d.orderNumber}
                        {d.specialInstructions && (
                          <span className="italic ml-1">{d.specialInstructions}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] tracking-wider uppercase flex items-center gap-1",
                          d.readyForMinutes >= 10 ? "text-error" : "text-ivory-dim"
                        )}
                      >
                        <Clock size={11} />
                        {d.readyForMinutes}m
                      </span>
                      <button
                        onClick={() => serve(d.id)}
                        disabled={servingId === d.id}
                        className="btn-primary text-[10px] px-3 py-2 disabled:opacity-50"
                      >
                        {servingId === d.id ? "..." : "SERVED"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Served log */}
            {served.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt size={14} className="text-ivory-dim" />
                  <h2 className="text-xs tracking-[0.2em] uppercase text-ivory-dim">
                    Recently served
                  </h2>
                </div>
                <div className="bg-surface border border-border/50 divide-y divide-border/30 max-h-64 overflow-y-auto">
                  {served.map((d) => (
                    <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-ivory-muted text-sm truncate">
                          {d.quantity} × {d.name}
                        </p>
                        <p className="text-ivory-dim text-[10px] mt-0.5">
                          Table {d.tableNumber ?? "—"} ·{" "}
                          {new Date(d.servedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-gold text-xs tabular-nums shrink-0">
                        {d.durationMinutes ?? 0}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </WaiterLayout>
  );
}
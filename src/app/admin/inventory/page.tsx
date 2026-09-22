"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

interface TransactionRecord {
  id: string;
  supplyId: string;
  type: string;
  quantity: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  healthy: "bg-success/20 text-success",
  low: "bg-warning/20 text-warning",
  critical: "bg-error/20 text-error",
};

const unitOptions = ["kg", "g", "L", "ml", "pcs", "btl", "dozen", "pack"];

const emptyForm = {
  name: "",
  unit: "kg",
  currentStock: "",
  minimumStock: "0",
  cost: "",
  supplier: "",
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [activeTx, setActiveTx] = useState<string | null>(null);

  const fetchData = () => {
    fetch("/api/admin/inventory")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.data);
          setTransactions(data.transactions || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const criticalCount = items.filter((i) => i.status === "critical").length;

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      unit: item.unit,
      currentStock: String(item.currentStock),
      minimumStock: String(item.minimumStock),
      cost: String(item.cost),
      supplier: item.supplier || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        currentStock: parseFloat(form.currentStock) || 0,
        minimumStock: parseFloat(form.minimumStock) || 0,
        cost: parseFloat(form.cost) || 0,
      };
      const res = await fetch("/api/admin/inventory", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchData();
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ingredient permanently?")) return;
    const res = await fetch(`/api/admin/inventory?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchData();
  };

  const handleFix = async (id: string, delta: number, type = "adjustment") => {
    setFixing(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delta, type }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch {
      /* ignore */
    }
    setFixing(false);
    setAdjustId(null);
  };

  const txTypeLabels: Record<string, string> = {
    purchase: "Purchase",
    usage: "Used",
    adjustment: "Adjustment",
    waste: "Waste",
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Inventory</h1>
          <button
            onClick={openAdd}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus size={14} />
            Add Ingredient
          </button>
        </div>

        {criticalCount > 0 && (
          <div className="bg-error/10 border border-error/30 p-4 mb-6 flex items-center gap-3">
            <span className="text-error text-sm">
              {criticalCount} ingredient(s) are critically low and need immediate attention.
            </span>
          </div>
        )}

        <div className="bg-surface border border-border/50 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Ingredient</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Stock</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Min. Stock</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Cost</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Supplier</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Status</th>
                  <th className="text-right text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-3"><p className="text-ivory text-sm">{item.name}</p></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ivory text-sm">{item.currentStock} {item.unit}</span>
                        <button
                          onClick={() => setAdjustId(adjustId === item.id ? null : item.id)}
                          className="text-ivory-dim hover:text-gold transition-colors p-1"
                          aria-label={`Adjust stock for ${item.name}`}
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                      {adjustId === item.id && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            onClick={() => handleFix(item.id, 1, "purchase")}
                            disabled={fixing}
                            className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-success/20 text-success px-2 py-1 hover:bg-success/30 disabled:opacity-50"
                            title="Restock +1"
                          >
                            <ArrowUpRight size={11} /> +1
                          </button>
                          <button
                            onClick={() => handleFix(item.id, -1, "usage")}
                            disabled={fixing}
                            className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-error/20 text-error px-2 py-1 hover:bg-error/30 disabled:opacity-50"
                            title="Use -1"
                          >
                            <ArrowDownRight size={11} /> -1
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-sm">{item.minimumStock} {item.unit}</td>
                    <td className="px-4 py-3 text-ivory text-sm">${item.cost}/{item.unit}</td>
                    <td className="px-4 py-3 text-ivory-muted text-sm">{item.supplier || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-1 inline-block", statusColors[item.status])}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-ivory-dim hover:text-gold transition-colors p-1"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setActiveTx(activeTx === item.id ? null : item.id)}
                          className="text-ivory-dim hover:text-accent transition-colors p-1"
                          aria-label={`History for ${item.name}`}
                        >
                          ◷
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-ivory-dim hover:text-error transition-colors p-1"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ivory-dim text-sm">
                      No ingredients registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activeTx && (
          <div className="bg-surface border border-border/50 overflow-hidden mb-8">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-ivory">
                Transaction History
              </h3>
              <button
                onClick={() => setActiveTx(null)}
                className="text-ivory-dim hover:text-ivory p-1"
                aria-label="Close history"
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Type</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Qty</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Notes</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">By</th>
                    <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => t.supplyId === activeTx)
                    .slice(0, 10)
                    .map((t) => (
                      <tr key={t.id} className="border-b border-border/30">
                        <td className="px-4 py-2">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider px-2 py-0.5",
                            t.quantity > 0
                              ? "bg-success/20 text-success"
                              : "bg-error/20 text-error"
                          )}>
                            {txTypeLabels[t.type] || t.type}
                          </span>
                        </td>
                        <td className={cn("px-4 py-2 text-sm", t.quantity > 0 ? "text-success" : "text-error")}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </td>
                        <td className="px-4 py-2 text-ivory-dim text-xs">{t.notes || "—"}</td>
                        <td className="px-4 py-2 text-ivory-dim text-xs">{t.createdBy || "—"}</td>
                        <td className="px-4 py-2 text-ivory-dim text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  {transactions.filter((t) => t.supplyId === activeTx).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-ivory-dim text-sm">
                        No transactions recorded for this ingredient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <form onSubmit={handleSubmit} className="bg-surface border border-border/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
                  {editingId ? "Edit Ingredient" : "Add Ingredient"}
                </h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-ivory-dim hover:text-ivory p-1" aria-label="Close">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">
                    Ingredient Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    placeholder="Wagyu Beef"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Current Stock</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.currentStock}
                      onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                      className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Min. Stock</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.minimumStock}
                      onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                      className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Cost / Unit</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Supplier</label>
                  <input
                    type="text"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    placeholder="Premium Meats Co."
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-ivory-dim hover:text-ivory transition-colors uppercase tracking-[0.15em]"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50">
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Ingredient"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
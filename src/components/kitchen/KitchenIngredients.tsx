"use client";

import { useState, useEffect } from "react";
import { Package, Plus, X, Minus, History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  supplier: string;
  status: "healthy" | "low" | "critical";
}

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

const emptyAddForm = {
  name: "",
  unit: "kg",
  currentStock: "",
  minimumStock: "0",
  cost: "",
  supplier: "",
};

export default function KitchenIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [mode, setMode] = useState<"usage" | "restock">("usage");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [adding, setAdding] = useState(false);

  const fetchAll = () => {
    fetch("/api/kitchen/ingredients")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIngredients(data.data);
          setTransactions(data.transactions || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerId || !quantity) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kitchen/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: registerId,
          type: mode,
          quantity: parseFloat(quantity),
          notes,
          createdBy: "kitchen",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegisterId(null);
        setQuantity("");
        setNotes("");
        fetchAll();
      }
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/kitchen/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          unit: addForm.unit,
          currentStock: parseFloat(addForm.currentStock) || 0,
          minimumStock: parseFloat(addForm.minimumStock) || 0,
          cost: parseFloat(addForm.cost) || 0,
          supplier: addForm.supplier.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setAddForm(emptyAddForm);
        fetchAll();
      }
    } catch {
      /* ignore */
    }
    setAdding(false);
  };

  const criticalCount = ingredients.filter((i) => i.status === "critical").length;

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Package size={20} className="text-gold" />
          <div>
            <h1 className="text-lg font-bold text-ivory tracking-wide">
              INGREDIENTS REGISTER
            </h1>
            <p className="text-ivory-dim text-xs mt-0.5">
              Register stock usage and restocks in real time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="text-[10px] uppercase tracking-wider bg-error/20 text-error border border-error/30 px-2 py-1">
              {criticalCount} critical
            </span>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary text-[10px] uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={12} />
            Add Ingredient
          </button>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-colors",
              showHistory
                ? "border-gold text-gold bg-gold/10"
                : "border-border-light text-ivory-dim hover:border-gold/50"
            )}
          >
            Register
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ingredients.map((ing) => (
          <div key={ing.id} className="bg-surface border border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-ivory text-sm font-medium">{ing.name}</h3>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider px-1.5 py-0.5",
                  statusColors[ing.status]
                )}
              >
                {ing.status}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className={cn(
                  "text-xl font-bold font-mono",
                  ing.status === "critical"
                    ? "text-error"
                    : ing.status === "low"
                    ? "text-warning"
                    : "text-ivory"
                )}
              >
                {ing.currentStock}
              </span>
              <span className="text-ivory-dim text-xs">{ing.unit}</span>
            </div>
            <p className="text-ivory-dim text-[10px] uppercase mb-4">
              Min {ing.minimumStock} {ing.unit}
              {ing.supplier ? ` · ${ing.supplier}` : ""}
            </p>

            {registerId === ing.id ? (
              <form onSubmit={register} className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("usage")}
                    className={cn(
                      "flex-1 text-[10px] uppercase tracking-wider py-1.5 border transition-colors",
                      mode === "usage"
                        ? "border-error text-error bg-error/10"
                        : "border-border-light text-ivory-dim hover:border-error/50"
                    )}
                  >
                    <Minus size={11} className="inline mr-1" />
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("restock")}
                    className={cn(
                      "flex-1 text-[10px] uppercase tracking-wider py-1.5 border transition-colors",
                      mode === "restock"
                        ? "border-success text-success bg-success/10"
                        : "border-border-light text-ivory-dim hover:border-success/50"
                    )}
                  >
                    <Plus size={11} className="inline mr-1" />
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterId(null)}
                    className="text-ivory-dim hover:text-ivory px-1"
                    aria-label="Cancel"
                  >
                    <X size={13} />
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Qty (${ing.unit})`}
                  className="w-full bg-bg border border-border-light text-ivory px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (e.g. order #8)"
                  className="w-full bg-bg border border-border-light text-ivory px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    "w-full py-2 text-[10px] font-bold tracking-[0.15em] uppercase disabled:opacity-50",
                    mode === "usage"
                      ? "bg-error text-ivory hover:bg-error/90"
                      : "bg-success text-bg hover:bg-success/90"
                  )}
                >
                  {busy ? "Saving..." : mode === "usage" ? "Register Usage" : "Restock"}
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setRegisterId(ing.id);
                  setMode("usage");
                  setQuantity("");
                  setNotes("");
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-[0.15em] border border-border-light text-ivory-dim hover:border-gold hover:text-gold transition-colors"
              >
                <History size={12} />
                Register
              </button>
            )}
          </div>
        ))}
        {ingredients.length === 0 && (
          <div className="col-span-full text-center py-16 text-ivory-dim text-sm border border-border/30">
            No ingredients registered. Add ingredients from the admin Inventory page.
          </div>
        )}
      </div>

      {showHistory && (
        <div className="mt-8 bg-surface border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-ivory">
              Recent Transactions
            </h3>
            <button
              onClick={() => setShowHistory(false)}
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
                  <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Ingredient</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Type</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Qty</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">Notes</th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-ivory-dim px-4 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map((t) => {
                  const ing = ingredients.find((i) => i.id === t.supplyId);
                  return (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className="px-4 py-2 text-ivory text-sm">{ing?.name || t.supplyId}</td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider px-2 py-0.5",
                          t.quantity > 0 ? "bg-success/20 text-success" : "bg-error/20 text-error"
                        )}>
                          {t.type}
                        </span>
                      </td>
                      <td className={cn("px-4 py-2 text-sm", t.quantity > 0 ? "text-success" : "text-error")}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="px-4 py-2 text-ivory-dim text-xs">{t.notes || "—"}</td>
                      <td className="px-4 py-2 text-ivory-dim text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ivory-dim text-sm">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleAdd} className="bg-surface border border-border/50 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
                Add Ingredient
              </h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-ivory-dim hover:text-ivory p-1" aria-label="Close">
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
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  placeholder="Fresh Truffle"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Unit</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  >
                    {unitOptions.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Opening Stock</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={addForm.currentStock}
                    onChange={(e) => setAddForm({ ...addForm, currentStock: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
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
                    value={addForm.minimumStock}
                    onChange={(e) => setAddForm({ ...addForm, minimumStock: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Cost / Unit</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={addForm.cost}
                    onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
                    className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5">Supplier</label>
                <input
                  type="text"
                  value={addForm.supplier}
                  onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                  className="w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  placeholder="Premium Meats Co."
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="text-xs text-ivory-dim hover:text-ivory transition-colors uppercase tracking-[0.15em]"
                >
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50 flex items-center gap-2">
                  {adding && <Loader2 size={12} className="animate-spin" />}
                  {adding ? "Saving..." : "Add Ingredient"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
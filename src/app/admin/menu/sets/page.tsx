"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import type { MenuSet } from "@/lib/types";

interface DishOption {
  id: string;
  name: string;
  price: number;
  category: string;
}

const inputCls =
  "w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none";
const labelCls =
  "block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5";

export default function AdminMenuSetsPage() {
  const [sets, setSets] = useState<MenuSet[]>([]);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [selected, setSelected] = useState<Record<string, number>>({}); // dishId -> qty

  const fetchAll = useCallback(() => {
    fetch("/api/admin/menu-sets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSets(data.data);
      })
      .catch(() => {});
    fetch("/api/admin/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDishes(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const computedTotal = dishes.reduce((sum, d) => sum + (selected[d.id] || 0) * d.price, 0);
  const effectivePrice = price && parseFloat(price) > 0 ? parseFloat(price) : computedTotal;

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setIsAvailable(true);
    setIsFeatured(false);
    setDisplayOrder("0");
    setSelected({});
    setError("");
    setShowForm(true);
  };

  const openEdit = (set: MenuSet) => {
    setEditingId(set.id);
    setName(set.name);
    setDescription(set.description || "");
    setPrice(set.price > 0 ? String(set.price) : "");
    setImageUrl(set.imageUrl || "");
    setIsAvailable(set.isAvailable);
    setIsFeatured(set.isFeatured);
    setDisplayOrder(String(set.displayOrder || 0));
    const sel: Record<string, number> = {};
    for (const it of set.items) sel[it.dishId] = it.quantity;
    setSelected(sel);
    setError("");
    setShowForm(true);
  };

  const toggleDish = (dishId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[dishId]) delete next[dishId];
      else next[dishId] = 1;
      return next;
    });
  };

  const setQty = (dishId: string, qty: number) => {
    setSelected((prev) => ({ ...prev, [dishId]: Math.max(1, qty || 1) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Set name is required");
      return;
    }
    if (Object.keys(selected).length === 0) {
      setError("Add at least one dish to the set");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const items = Object.entries(selected).map(([dishId, qty]) => ({ dishId, quantity: qty }));
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        description: description.trim(),
        price: price ? parseFloat(price) : 0,
        imageUrl: imageUrl.trim(),
        isAvailable,
        isFeatured,
        displayOrder: parseInt(displayOrder) || 0,
        items,
      };
      const res = await fetch("/api/admin/menu-sets", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        fetchAll();
      } else {
        setError(data.error || "Failed to save menu set");
      }
    } catch {
      setError("Connection error");
    }
    setSaving(false);
  };

  const handleDelete = async (set: MenuSet) => {
    if (!confirm(`Delete menu set "${set.name}"?`)) return;
    const res = await fetch(`/api/admin/menu-sets?id=${set.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchAll();
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ivory">Menu Sets</h1>
            <p className="text-ivory-dim text-sm mt-1">
              Curated sets of dishes — tasting menus, combos and pairings.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus size={14} />
            New Set
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sets.map((set) => (
            <div key={set.id} className="bg-surface border border-border/50 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-ivory text-sm font-medium">{set.name}</h3>
                  <p className="text-ivory-dim text-xs mt-0.5">
                    {set.items.length} {set.items.length === 1 ? "dish" : "dishes"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(set)}
                    className="text-ivory-dim hover:text-gold transition-colors p-1"
                    aria-label={`Edit ${set.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(set)}
                    className="text-ivory-dim hover:text-error transition-colors p-1"
                    aria-label={`Delete ${set.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {set.description && (
                <p className="text-ivory-dim text-xs mb-3">{set.description}</p>
              )}
              {set.items.length > 0 && (
                <div className="space-y-1 mb-4">
                  {set.items.slice(0, 4).map((it) => (
                    <div key={it.dishId} className="flex justify-between text-xs">
                      <span className="text-ivory-dim">{it.quantity} × {it.name}</span>
                      <span className="text-ivory-dim">{formatPrice(it.price * it.quantity)}</span>
                    </div>
                  ))}
                  {set.items.length > 4 && (
                    <p className="text-ivory-dim text-[10px]">+{set.items.length - 4} more</p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex gap-2">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0.5",
                    set.isAvailable ? "bg-success/20 text-success" : "bg-error/20 text-error"
                  )}>
                    {set.isAvailable ? "Available" : "Hidden"}
                  </span>
                  {set.isFeatured && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gold/20 text-gold">
                      ★ Featured
                    </span>
                  )}
                </div>
                <span className="text-gold text-sm font-medium">
                  {formatPrice(set.effectivePrice)}
                </span>
              </div>
            </div>
          ))}
          {sets.length === 0 && (
            <div className="col-span-full text-center py-16 text-ivory-dim text-sm border border-border/30">
              No menu sets yet. Click &ldquo;New Set&rdquo; to build one from your dishes.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSubmit} className="bg-surface border border-border/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-surface z-10">
              <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
                {editingId ? "Edit Menu Set" : "New Menu Set"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-ivory-dim hover:text-ivory p-1" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {error && (
                <div className="p-3 bg-error/10 border border-error/30 text-error text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Set Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="Chef's Tasting Menu"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Price (0 = auto from dishes)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputCls}
                    placeholder="auto"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(inputCls, "min-h-16 resize-y")}
                  placeholder="A journey through our kitchen's signature dishes."
                />
              </div>

              <div>
                <label className={labelCls}>Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={inputCls}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + " mb-0"}>Dishes in this set</label>
                  <span className="text-[10px] uppercase tracking-wider text-gold">
                    Computed total: {formatPrice(computedTotal)}
                  </span>
                </div>
                <div className="border border-border/50 max-h-56 overflow-y-auto divide-y divide-border/30">
                  {dishes.map((dish) => (
                    <div key={dish.id} className="flex items-center gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!selected[dish.id]}
                        onChange={() => toggleDish(dish.id)}
                        className="accent-gold"
                      />
                      <span className="flex-1 text-sm text-ivory">{dish.name}</span>
                      <span className="text-ivory-dim text-xs">{dish.category}</span>
                      <span className="text-ivory-dim text-xs w-16 text-right">{formatPrice(dish.price)}</span>
                      {selected[dish.id] ? (
                        <input
                          type="number"
                          min={1}
                          value={selected[dish.id]}
                          onChange={(e) => setQty(dish.id, parseInt(e.target.value) || 1)}
                          className="w-14 bg-bg border border-border-light text-ivory px-2 py-1 text-xs focus:border-gold focus:outline-none"
                        />
                      ) : (
                        <div className="w-14" />
                      )}
                    </div>
                  ))}
                  {dishes.length === 0 && (
                    <div className="p-6 text-center text-ivory-dim text-sm">
                      No dishes available. Add dishes first.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="accent-gold"
                  />
                  <span className="text-xs text-ivory-dim">Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-gold"
                  />
                  <span className="text-xs text-ivory-dim">Featured</span>
                </label>
                <div>
                  <label className={labelCls}>Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] uppercase tracking-wider text-ivory-dim mb-1">Final Price</p>
                  <p className="text-gold font-bold">{formatPrice(effectivePrice)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-ivory-dim hover:text-ivory transition-colors uppercase tracking-[0.15em]"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Set"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
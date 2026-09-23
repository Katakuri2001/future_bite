"use client";

import { useEffect, useState, useCallback } from "react";
import { UtensilsCrossed, Plus, Pencil } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import DishFormModal, { type DishFormValue } from "@/components/menu/DishFormModal";

interface KitchenDish {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  description: string;
  preparationTime: number;
  isAvailable: boolean;
  isFeatured: boolean;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  imageUrl: string;
  costPrice: number;
  pointsValue: number;
  displayOrder: number;
}

export default function KitchenMenu() {
  const [dishes, setDishes] = useState<KitchenDish[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<DishFormValue> | null>(null);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDishes(data.data);
      })
      .catch(() => {});
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleAvailability = async (dish: KitchenDish) => {
    const res = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dish.id, isAvailable: !dish.isAvailable }),
    });
    const data = await res.json();
    if (data.success) fetchAll();
  };

  const catList =
    categories.length > 0
      ? categories
      : [...new Map(dishes.map((d) => [d.categoryId, { id: d.categoryId, name: d.category }])).values()];

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UtensilsCrossed size={20} className="text-gold" />
          <div>
            <h1 className="text-lg font-bold text-ivory tracking-wide">MENU</h1>
            <p className="text-ivory-dim text-xs mt-0.5">
              Add and manage dishes from the kitchen — no admin needed
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
        >
          <Plus size={14} />
          Add Dish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-surface border border-border/50 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-ivory text-sm font-medium">{dish.name}</h3>
                <p className="text-ivory-dim text-[10px] uppercase tracking-wider mt-0.5">
                  {dish.category} · {dish.preparationTime}m prep
                </p>
              </div>
              <span className="text-gold text-sm font-medium">{formatPrice(dish.price)}</span>
            </div>
            {dish.description && (
              <p className="text-ivory-dim text-xs mb-3 line-clamp-2">{dish.description}</p>
            )}
            {dish.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {dish.ingredients.slice(0, 4).map((ing, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-bg border border-border/40 text-ivory-dim">
                    {ing}
                  </span>
                ))}
                {dish.ingredients.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-ivory-dim">
                    +{dish.ingredients.length - 4}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <button
                onClick={() => toggleAvailability(dish)}
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-1 transition-colors",
                  dish.isAvailable
                    ? "bg-success/20 text-success hover:bg-success/30"
                    : "bg-error/20 text-error hover:bg-error/30"
                )}
              >
                {dish.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button
                onClick={() => {
                  setEditing({ ...(dish as unknown as Partial<DishFormValue>) });
                  setShowForm(true);
                }}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ivory-dim hover:text-gold transition-colors px-2 py-1"
              >
                <Pencil size={11} />
                Edit
              </button>
            </div>
          </div>
        ))}
        {dishes.length === 0 && (
          <div className="col-span-full text-center py-16 text-ivory-dim text-sm border border-border/30">
            No dishes yet. Add your first dish from here.
          </div>
        )}
      </div>

      {showForm && (
        <DishFormModal
          key={editing?.id || "new"}
          initial={editing}
          categories={catList}
          onClose={() => setShowForm(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
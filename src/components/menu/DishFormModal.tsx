"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DishFormValue {
  id?: string;
  name: string;
  categoryId: string;
  category?: string;
  description: string;
  price: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: string;
  costPrice: string;
  pointsValue: string;
  displayOrder: string;
}

const emptyForm: DishFormValue = {
  name: "",
  categoryId: "",
  description: "",
  price: "",
  imageUrl: "",
  ingredients: [],
  allergens: [],
  dietary: [],
  isAvailable: true,
  isFeatured: false,
  preparationTime: "15",
  costPrice: "",
  pointsValue: "0",
  displayOrder: "0",
};

function tagsToText(tags: string[]): string {
  return tags.join(", ");
}

function textToTags(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildForm(initial?: Partial<DishFormValue> | null): DishFormValue {
  if (!initial?.id) return emptyForm;
  return {
    id: initial.id,
    name: initial.name || "",
    categoryId: initial.categoryId || "",
    category: initial.category || "",
    description: initial.description || "",
    price: initial.price?.toString() || "",
    imageUrl: initial.imageUrl || "",
    ingredients: initial.ingredients || [],
    allergens: initial.allergens || [],
    dietary: initial.dietary || [],
    isAvailable: initial.isAvailable ?? true,
    isFeatured: initial.isFeatured ?? false,
    preparationTime: initial.preparationTime?.toString() || "15",
    costPrice: initial.costPrice?.toString() || "",
    pointsValue: initial.pointsValue?.toString() || "0",
    displayOrder: initial.displayOrder?.toString() || "0",
  };
}

const inputCls =
  "w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none";
const labelCls =
  "block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5";

/**
 * Shared dish create/edit modal. Mount it with a stable `key` per target
 * (e.g. `key={editing?.id || "new"}`) so each open gets a fresh form.
 */
export default function DishFormModal({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial?: Partial<DishFormValue> | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DishFormValue>(() => buildForm(initial));
  const [ingredientsText, setIngredientsText] = useState(() =>
    tagsToText(initial?.ingredients || [])
  );
  const [allergensText, setAllergensText] = useState(() =>
    tagsToText(initial?.allergens || [])
  );
  const [dietaryText, setDietaryText] = useState(() =>
    tagsToText(initial?.dietary || [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Dish name is required");
      return;
    }
    if (!form.categoryId) {
      setError("Select a category");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        imageUrl: form.imageUrl.trim(),
        ingredients: textToTags(ingredientsText),
        allergens: textToTags(allergensText),
        dietary: textToTags(dietaryText),
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
        preparationTime: parseInt(form.preparationTime) || 15,
        costPrice: parseFloat(form.costPrice) || 0,
        pointsValue: parseInt(form.pointsValue) || 0,
        displayOrder: parseInt(form.displayOrder) || 0,
      };
      const res = await fetch("/api/admin/menu", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to save dish");
      }
    } catch {
      setError("Connection error");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-surface z-10">
          <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
            {form.id ? "Edit Dish" : "Add Dish"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ivory-dim hover:text-ivory p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dish Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="Wagyu A5 Omakase"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={inputCls}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={cn(inputCls, "min-h-20 resize-y")}
              placeholder="What makes this dish special?"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Price *</label>
              <input
                type="number"
                min={0}
                step="any"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputCls}
                placeholder="6800"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Prep Time (min)</label>
              <input
                type="number"
                min={0}
                value={form.preparationTime}
                onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Cost Price</label>
              <input
                type="number"
                min={0}
                step="any"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Points Value</label>
              <input
                type="number"
                min={0}
                value={form.pointsValue}
                onChange={(e) => setForm({ ...form, pointsValue: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Image URL</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className={inputCls}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Ingredients (comma-separated)</label>
              <input
                type="text"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className={inputCls}
                placeholder="Wagyu, Wasabi, Ginger"
              />
            </div>
            <div>
              <label className={labelCls}>Allergens</label>
              <input
                type="text"
                value={allergensText}
                onChange={(e) => setAllergensText(e.target.value)}
                className={inputCls}
                placeholder="Soy, Dairy"
              />
            </div>
            <div>
              <label className={labelCls}>Dietary</label>
              <input
                type="text"
                value={dietaryText}
                onChange={(e) => setDietaryText(e.target.value)}
                className={inputCls}
                placeholder="Gluten-free, Vegan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="accent-gold"
              />
              <span className="text-xs text-ivory-dim">Available</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-gold"
              />
              <span className="text-xs text-ivory-dim">Featured</span>
            </label>
            <div>
              <label className={labelCls}>Display Order</label>
              <input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-ivory-dim hover:text-ivory transition-colors uppercase tracking-[0.15em]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Saving..." : form.id ? "Save Changes" : "Add Dish"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
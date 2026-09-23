"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import DishFormModal, { type DishFormValue } from "@/components/menu/DishFormModal";

interface AdminMenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  dietary: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  costPrice: number;
  pointsValue: number;
  displayOrder: number;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<DishFormValue> | null>(null);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(() => {
    fetch("/api/admin/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMenuItems(data.data);
      })
      .catch(() => {});
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        } else if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const catList = categories.length > 0 ? categories : menuItems.map((i) => ({ id: i.categoryId, name: i.category }));

  const filtered = menuItems.filter((i) => {
    const inCategory = selectedCategory === "all" || i.categoryId === selectedCategory;
    const inSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase());
    return inCategory && inSearch;
  });

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setEditing({ ...(item as unknown as Partial<DishFormValue>) });
    setShowForm(true);
  };

  const handleDelete = async (item: AdminMenuItem) => {
    if (!confirm(`Delete "${item.name}" permanently?`)) return;
    const res = await fetch(`/api/admin/menu?id=${item.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchAll();
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-bold text-ivory">Menu Management</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/menu/sets"
              className="text-xs py-2 px-4 border border-border-light text-ivory-dim hover:border-gold hover:text-gold transition-colors flex items-center gap-2"
            >
              <Layers size={14} />
              Menu Sets
            </Link>
            <button
              onClick={openAdd}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Plus size={14} />
              Add Dish
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-1.5 text-xs tracking-wider uppercase border transition-all",
              selectedCategory === "all"
                ? "border-gold text-gold bg-gold/10"
                : "border-border-light text-ivory-dim hover:border-gold/50"
            )}
          >
            All
          </button>
          {[...new Map(catList.map((c) => [c.id, c])).values()].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-1.5 text-xs tracking-wider uppercase border transition-all",
                selectedCategory === cat.id
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border-light text-ivory-dim hover:border-gold/50"
              )}
            >
              {cat.name}
            </button>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="ml-auto bg-bg border border-border-light text-ivory px-3 py-1.5 text-xs focus:border-gold focus:outline-none w-48"
          />
        </div>

        <div className="bg-surface border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Dish</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Category</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Price</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Prep</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Status</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Featured</th>
                  <th className="text-right text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-surface-elevated transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-ivory text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-ivory-dim text-xs mt-0.5 line-clamp-1 max-w-md">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">{item.category}</td>
                    <td className="px-4 py-3 text-gold text-sm font-medium">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3 text-ivory-dim text-sm">{item.preparationTime}m</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-2 py-1 inline-block",
                        item.isAvailable ? "bg-success/20 text-success" : "bg-error/20 text-error"
                      )}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory-dim text-sm">{item.isFeatured ? "★" : "—"}</td>
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
                          onClick={() => handleDelete(item)}
                          className="text-ivory-dim hover:text-error transition-colors p-1"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ivory-dim text-sm">
                      No dishes found. Click &ldquo;Add Dish&rdquo; to create your first menu item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
    </AdminLayout>
  );
}
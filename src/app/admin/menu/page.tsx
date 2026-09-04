"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { cn, formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface AdminMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/admin/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMenuItems(data.data);
      })
      .catch(() => {});
  }, []);

  const categories = [...new Set(menuItems.map((i) => i.category))];

  const filtered =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((i) => i.category === selectedCategory);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ivory">Menu Management</h1>
          <button className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
            <Plus size={14} />
            Add Dish
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 text-xs tracking-wider uppercase border transition-all",
                selectedCategory === cat
                  ? "border-gold text-gold bg-gold/10"
                  : "border-border-light text-ivory-dim hover:border-gold/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Dish</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Category</th>
                  <th className="text-left text-[10px] tracking-[0.1em] uppercase text-ivory-dim px-4 py-3">Price</th>
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
                    </td>
                    <td className="px-4 py-3 text-ivory text-sm">{item.category}</td>
                    <td className="px-4 py-3 text-gold text-sm font-medium">{formatPrice(item.price)}</td>
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
                        <button className="text-ivory-dim hover:text-gold transition-colors p-1"><Pencil size={14} /></button>
                        <button className="text-ivory-dim hover:text-error transition-colors p-1"><Trash2 size={14} /></button>
                      </div>
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

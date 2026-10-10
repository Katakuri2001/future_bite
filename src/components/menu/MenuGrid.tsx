"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, Plus, Loader2, AlertCircle } from "lucide-react";
import { cn, formatKyat } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  imageUrl: string;
  dietary: string[];
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
}

export default function MenuGrid() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { addItem } = useCart();

  // Menu is served from the database so admin/kitchen edits appear immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setItems(data.items || data.data?.items || []);
        setCategories(data.categories || data.data?.categories || []);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            "The menu is unavailable right now. Please refresh or call us to order."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToOrder = useCallback(
    (item: MenuItem) => {
      addItem({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      });
    },
    [addItem]
  );

  const filtered = items.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.categorySlug === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-ivory-dim">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm tracking-widest uppercase">Loading menu</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertCircle size={28} className="text-error" strokeWidth={1.5} />
        <p className="text-ivory-muted text-sm max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-10">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the menu..."
          aria-label="Search the menu"
          className="w-full bg-surface border border-border-light text-ivory pl-11 pr-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
        />
      </div>

      {/* Categories */}
      <div className="flex justify-center gap-2 mb-12 flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-5 py-2 text-xs tracking-[0.1em] uppercase border transition-all duration-300",
            activeCategory === "all"
              ? "border-gold bg-gold/10 text-gold"
              : "border-border-light text-ivory-dim hover:border-gold/50"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={cn(
              "px-5 py-2 text-xs tracking-[0.1em] uppercase border transition-all duration-300",
              activeCategory === cat.slug
                ? "border-gold bg-gold/10 text-gold"
                : "border-border-light text-ivory-dim hover:border-gold/50"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="group bg-surface border border-border/50 hover:border-border-light transition-all duration-500 overflow-hidden flex flex-col"
          >
            <Link
              href={`/menu/${item.slug}`}
              className="block img-zoom aspect-[4/3] overflow-hidden bg-bg relative"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-bg" />
              )}
            </Link>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <Link href={`/menu/${item.slug}`}>
                  <h3 className="text-display text-lg text-ivory group-hover:text-gold transition-colors duration-300">
                    {item.name}
                  </h3>
                </Link>
                <span className="text-gold font-medium text-sm whitespace-nowrap">
                  {formatKyat(item.price)}
                </span>
              </div>
              <p className="text-ivory-muted text-sm leading-relaxed mb-3 line-clamp-2 flex-1">
                {item.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(item.dietary || []).map((d) => (
                  <span
                    key={d}
                    className="text-[10px] tracking-[0.1em] uppercase text-accent-light border border-accent px-2 py-0.5"
                  >
                    {d}
                  </span>
                ))}
                <span className="text-[10px] tracking-[0.1em] uppercase text-ivory-dim">
                  {item.category}
                </span>
              </div>
              <button
                onClick={() => addToOrder(item)}
                disabled={!item.isAvailable}
                className="btn-outline text-xs py-3 w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {item.isAvailable ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Plus size={13} /> Add to Order
                  </span>
                ) : (
                  "Unavailable"
                )}
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <SlidersHorizontal
            size={32}
            className="text-ivory-dim mx-auto mb-4"
          />
          <p className="text-ivory-muted text-sm">
            No dishes found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { menuItems, menuCategories } from "@/lib/data";

export default function MenuGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.categorySlug === activeCategory;
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        {menuCategories.map((cat) => (
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
          <Link
            key={item.id}
            href={`/menu/${item.slug}`}
            className="group bg-surface border border-border/50 hover:border-border-light transition-all duration-500 overflow-hidden"
          >
            <div className="img-zoom aspect-[4/3] overflow-hidden bg-bg relative">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-display text-lg text-ivory group-hover:text-gold transition-colors duration-300">
                  {item.name}
                </h3>
                <span className="text-gold font-medium text-sm whitespace-nowrap">
                  {formatPrice(item.price)}
                </span>
              </div>
              <p className="text-ivory-muted text-sm leading-relaxed mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.dietary.map((d) => (
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
            </div>
          </Link>
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

"use client";

import { useState } from "react";
import KitchenBoard from "@/components/kitchen/KitchenBoard";
import KitchenIngredients from "@/components/kitchen/KitchenIngredients";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "orders", label: "Orders" },
  { id: "ingredients", label: "Ingredients" },
];

export default function KitchenTabs() {
  const [tab, setTab] = useState("orders");

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-1 px-4 md:px-6 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-5 py-2.5 text-xs font-bold tracking-[0.15em] uppercase border-b-2 transition-colors",
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-transparent text-ivory-dim hover:text-ivory"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "orders" ? <KitchenBoard /> : <KitchenIngredients />}
    </div>
  );
}
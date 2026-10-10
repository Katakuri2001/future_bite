"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatKyat } from "@/lib/utils";

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, close, setQuantity, removeItem } =
    useCart();

  if (!isOpen) return null;

  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Scrim */}
      <button
        onClick={close}
        aria-label="Close cart"
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-label="Your order"
        className="relative w-full max-w-md bg-surface border-l border-border-light flex flex-col h-full"
      >
        <header className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-gold" strokeWidth={1.5} />
            <h2 className="text-display text-lg text-ivory">Your Order</h2>
            {count > 0 && (
              <span className="text-xs bg-gold/15 text-gold border border-gold/30 px-2 py-0.5">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={close}
            aria-label="Close cart"
            className="text-ivory-dim hover:text-ivory transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag size={32} className="text-ivory-dim" strokeWidth={1} />
            <p className="text-ivory-muted text-sm">Your order is empty.</p>
            <Link
              href="/menu"
              onClick={close}
              className="btn-outline text-xs py-3 px-6"
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-border/30">
              {items.map((item) => (
                <li key={`${item.menuItemId}-${item.specialInstructions || ""}`} className="p-4">
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <div className="relative w-16 h-16 shrink-0 bg-bg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-ivory text-sm font-medium truncate">
                          {item.name}
                        </h3>
                        <span className="text-gold text-sm whitespace-nowrap">
                          {formatKyat(item.price * item.quantity)}
                        </span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-ivory-dim text-xs mt-1 italic truncate">
                          {item.specialInstructions}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border-light">
                          <button
                            onClick={() => setQuantity(item.menuItemId, item.quantity - 1)}
                            aria-label={`Decrease ${item.name}`}
                            className="px-2.5 py-1.5 text-ivory-dim hover:text-gold transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-3 text-sm text-ivory tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(item.menuItemId, item.quantity + 1)}
                            aria-label={`Increase ${item.name}`}
                            className="px-2.5 py-1.5 text-ivory-dim hover:text-gold transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-ivory-dim hover:text-error transition-colors"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-border/50 p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Subtotal</span>
                <span className="text-ivory tabular-nums">{formatKyat(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Tax (10%)</span>
                <span className="text-ivory-dim tabular-nums">{formatKyat(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Service (5%)</span>
                <span className="text-ivory-dim tabular-nums">
                  {formatKyat(serviceCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-3 mt-1 border-t border-border/40">
                <span className="text-ivory">Total</span>
                <span className="text-gold tabular-nums">{formatKyat(total)}</span>
              </div>
              <Link
                href="/order"
                onClick={close}
                className="btn-primary w-full text-sm py-4 mt-4 block text-center"
              >
                Review &amp; Place Order
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
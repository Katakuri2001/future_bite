"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatKyat } from "@/lib/utils";

interface PlacedOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
}

export default function OrderPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // Only signed-in customers can order; bounce to login if not.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        setSignedIn(res.ok);
        if (!res.ok) router.replace("/login");
      } catch {
        setSignedIn(false);
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  async function placeOrder() {
    setError(null);
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send ids and quantities only — the server prices every line.
        body: JSON.stringify({
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            specialInstructions: i.specialInstructions || "",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "We could not place your order.");
        return;
      }
      setPlaced(data.data);
      clear();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center gap-3 text-ivory-dim">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm tracking-widest uppercase">Checking session</span>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 size={44} className="text-gold mx-auto mb-6" strokeWidth={1} />
          <p className="text-label mb-3">Order received</p>
          <h1 className="text-display-md text-ivory mb-4">Thank you</h1>
          <p className="text-ivory-muted text-sm mb-8">
            Your order{" "}
            <span className="text-gold font-medium">{placed.orderNumber}</span> has
            been sent to the kitchen. You will earn{" "}
            <span className="text-gold font-medium">
              {Math.floor(placed.total / 10000)} point
              {Math.floor(placed.total / 10000) === 1 ? "" : "s"}
            </span>{" "}
            once payment is settled.
          </p>
          <div className="bg-surface border border-border/50 p-6 mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ivory-muted">Order</span>
              <span className="text-ivory">{placed.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ivory-muted">Status</span>
              <span className="text-ivory uppercase">{placed.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ivory-muted">Payment</span>
              <span className="text-gold uppercase">{placed.paymentStatus}</span>
            </div>
            <div className="flex justify-between text-base pt-2 mt-2 border-t border-border/40">
              <span className="text-ivory">Total</span>
              <span className="text-gold">{formatKyat(placed.total)}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/menu" className="btn-primary text-xs py-3 px-8">
              Order More
            </Link>
            <Link href="/account" className="btn-outline text-xs py-3 px-8">
              View Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  return (
    <div className="min-h-screen bg-bg py-16 px-4">
      <div className="container-narrow mx-auto">
        <p className="text-label mb-3">Checkout</p>
        <h1 className="text-display-md text-ivory mb-10">Review your order</h1>

        {items.length === 0 ? (
          <div className="bg-surface border border-border/50 p-12 text-center">
            <ShoppingBag size={32} className="text-ivory-dim mx-auto mb-4" strokeWidth={1} />
            <p className="text-ivory-muted text-sm mb-6">
              Your order is empty.
            </p>
            <Link href="/menu" className="btn-primary text-xs py-3 px-8">
              Browse the menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            {/* Items */}
            <div className="bg-surface border border-border/50">
              <ul className="divide-y divide-border/30">
                {items.map((item) => (
                  <li key={`${item.menuItemId}-${item.specialInstructions || ""}`} className="p-5 flex justify-between gap-4">
                    <div>
                      <h2 className="text-ivory font-medium">{item.name}</h2>
                      <p className="text-ivory-dim text-xs mt-1">
                        {formatKyat(item.price)} × {item.quantity}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-ivory-dim text-xs mt-1 italic">
                          {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="text-gold whitespace-nowrap tabular-nums">
                      {formatKyat(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-28 h-fit">
              <div className="bg-surface border border-border/50 p-6">
                {error && (
                  <div className="mb-5 p-3 bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2 mb-5">
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
                    <span className="text-ivory-dim tabular-nums">{formatKyat(serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-3 mt-2 border-t border-border/40">
                    <span className="text-ivory">Total</span>
                    <span className="text-gold tabular-nums">{formatKyat(total)}</span>
                  </div>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="btn-primary w-full text-sm py-4 disabled:opacity-50"
                >
                  {placing ? "Placing order..." : "Place Order"}
                  {!placing && <ArrowRight size={15} />}
                </button>
                <p className="text-ivory-dim text-[11px] mt-4 leading-relaxed">
                  Payment is taken at your table. Royal points are credited once
                  your bill is settled — 1 point per 10,000 K.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
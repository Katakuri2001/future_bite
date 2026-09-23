"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  Link2,
  Check,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import ReceiptView from "@/components/receipts/ReceiptView";
import type { Receipt } from "@/lib/types";

interface PosDish {
  id: string;
  name: string;
  price: number;
  categorySlug: string;
  category: string;
  description: string;
}

interface PosCategory {
  id: string;
  name: string;
  slug: string;
}

interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

const inputCls =
  "w-full bg-bg border border-border-light text-ivory px-3 py-2.5 text-sm focus:border-gold focus:outline-none";
const labelCls =
  "block text-[10px] tracking-[0.15em] uppercase text-ivory-dim mb-1.5";

export default function POSWorkspace() {
  const router = useRouter();
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [dishes, setDishes] = useState<PosDish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [receiptType, setReceiptType] = useState<"e" | "physical">("e");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<{
    receipt: Receipt;
    receiptUrl: string;
    orderNumber: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [cashierName, setCashierName] = useState("");
  const [role, setRole] = useState("");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.data?.user) {
          const u = data.data.user;
          setCashierName(u.name || "");
          setRole(u.role || "");
          setAuthorized(true);
          if (u.role === "customer") {
            router.push("/");
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch {
        if (cancelled) return;
        router.push("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetchMenu = useCallback(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (Array.isArray(data.items)) setDishes(data.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const addToCart = (dish: PosDish) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === dish.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === dish.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { menuItemId: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  };

  const changeQty = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + delta } : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (menuItemId: string) => {
    setCart((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
  };

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + tax + service;

  const checkout = async () => {
    if (cart.length === 0) return;
    setError("");
    setCheckingOut(true);
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            addons: [],
            specialInstructions: "",
          })),
          tableNumber: tableNumber ? parseInt(tableNumber, 10) : undefined,
          customerName: customerName || "Guest",
          paymentMethod,
          receiptType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutResult({
          receipt: data.data.receipt,
          receiptUrl: data.data.receiptUrl,
          orderNumber: data.data.order.orderNumber,
        });
        setCart([]);
        setTableNumber("");
        setCustomerName("");
      } else {
        setError(data.error || "Checkout failed");
      }
    } catch {
      setError("Connection error");
    }
    setCheckingOut(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const copyLink = async () => {
    if (!checkoutResult) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + checkoutResult.receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const filtered = dishes.filter(
    (d) => selectedCategory === "all" || d.categorySlug === selectedCategory
  );

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-bg print:hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-4 px-4 md:px-6 py-3">
          <Image
            src="/future_bite_logo.jpeg"
            alt="FutureBite"
            width={96}
            height={52}
            className="h-8 w-auto object-contain"
          />
          <div className="flex-1">
            <h1 className="text-sm font-bold text-ivory tracking-[0.15em] uppercase">
              Point of Sale
            </h1>
            <p className="text-ivory-dim text-xs">
              {cashierName ? `${cashierName} · ` : ""}
              {cart.length} item{cart.length === 1 ? "" : "s"} in cart
            </p>
          </div>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="text-xs text-ivory-dim hover:text-gold transition-colors"
            >
              Admin
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-ivory-dim hover:text-error transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
        {/* Menu */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4 flex-wrap">
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
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={cn(
                  "px-4 py-1.5 text-xs tracking-wider uppercase border transition-all",
                  selectedCategory === cat.slug
                    ? "border-gold text-gold bg-gold/10"
                    : "border-border-light text-ivory-dim hover:border-gold/50"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((dish) => (
              <button
                key={dish.id}
                onClick={() => addToCart(dish)}
                className="bg-surface border border-border/50 p-4 text-left hover:border-gold/60 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-ivory text-sm font-medium group-hover:text-gold transition-colors">
                    {dish.name}
                  </span>
                  <Plus size={14} className="text-ivory-dim group-hover:text-gold shrink-0 mt-0.5" />
                </div>
                <p className="text-gold text-sm font-bold">{formatPrice(dish.price)}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-ivory-dim text-sm border border-border/30">
                No dishes in this category.
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-surface border border-border/50 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-gold" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-ivory">
              Current Order
            </h2>
          </div>

          <div className="flex-1 space-y-2 mb-4 max-h-64 lg:max-h-none overflow-y-auto">
            {cart.length === 0 && (
              <p className="text-ivory-dim text-xs text-center py-8">
                Tap dishes to add them to the order.
              </p>
            )}
            {cart.map((line) => (
              <div key={line.menuItemId} className="flex items-center gap-2 border border-border/40 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-ivory text-xs font-medium truncate">{line.name}</p>
                  <p className="text-ivory-dim text-[10px]">{formatPrice(line.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQty(line.menuItemId, -1)}
                    className="text-ivory-dim hover:text-gold p-0.5"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-ivory text-xs w-5 text-center">{line.quantity}</span>
                  <button
                    onClick={() => changeQty(line.menuItemId, 1)}
                    className="text-ivory-dim hover:text-gold p-0.5"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-gold text-xs font-medium w-16 text-right">
                  {formatPrice(line.price * line.quantity)}
                </span>
                <button
                  onClick={() => removeLine(line.menuItemId)}
                  className="text-ivory-dim hover:text-error p-0.5"
                  aria-label={`Remove ${line.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Table No.</label>
                <input
                  type="number"
                  min={1}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className={inputCls}
                  placeholder="Takeaway"
                />
              </div>
              <div>
                <label className={labelCls}>Customer</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputCls}
                  placeholder="Guest"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "card", "qr"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={cn(
                      "py-2 text-[10px] uppercase tracking-wider border transition-colors",
                      paymentMethod === m
                        ? "border-gold text-gold bg-gold/10"
                        : "border-border-light text-ivory-dim hover:border-gold/50"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Receipt Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptType("e")}
                  className={cn(
                    "py-2 text-[10px] uppercase tracking-wider border transition-colors",
                    receiptType === "e"
                      ? "border-gold text-gold bg-gold/10"
                      : "border-border-light text-ivory-dim hover:border-gold/50"
                  )}
                >
                  E-Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptType("physical")}
                  className={cn(
                    "py-2 text-[10px] uppercase tracking-wider border transition-colors",
                    receiptType === "physical"
                      ? "border-gold text-gold bg-gold/10"
                      : "border-border-light text-ivory-dim hover:border-gold/50"
                  )}
                >
                  Physical
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-3 space-y-1.5 mb-4">
            <div className="flex justify-between text-xs text-ivory-dim">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-ivory-dim">
              <span>Tax (10%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-xs text-ivory-dim">
              <span>Service (5%)</span>
              <span>{formatPrice(service)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-ivory pt-1">
              <span>TOTAL</span>
              <span className="text-gold">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={checkingOut || cart.length === 0}
            className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {checkingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CreditCard size={16} />
            )}
            {checkingOut ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </div>

      {/* Receipt modal — the only thing visible when printing */}
      {checkoutResult && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 p-4 print:static print:bg-white print:p-0 print:overflow-visible">
          <div className="w-full max-w-sm mx-auto print:max-w-none">
            <div className="print:hidden flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ivory uppercase tracking-[0.15em]">
                Sale Complete — {checkoutResult.orderNumber}
              </h2>
              <button
                onClick={() => setCheckoutResult(null)}
                className="text-ivory-dim hover:text-ivory p-1"
                aria-label="Close receipt"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white p-6 print:p-0">
              <ReceiptView receipt={checkoutResult.receipt} />
            </div>

            <div className="print:hidden mt-4 space-y-3 w-full max-w-sm mx-auto">
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-gold text-bg text-xs font-bold py-3 uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-gold-muted transition-colors"
                >
                  <Printer size={14} />
                  Print {checkoutResult.receipt.receiptType === "physical" ? "Receipt" : "Copy"}
                </button>
                {checkoutResult.receipt.receiptType === "e" && (
                  <button
                    onClick={copyLink}
                    className="flex-1 border border-border-light text-ivory text-xs font-bold py-3 uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:border-gold hover:text-gold transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Link2 size={14} />}
                    {copied ? "Copied!" : "Copy E-Receipt Link"}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-ivory-dim">
                <span>E-receipt: {window.location.origin}{checkoutResult.receiptUrl}</span>
              </div>
              <button
                onClick={() => setCheckoutResult(null)}
                className="w-full text-xs text-ivory-dim hover:text-ivory py-2 transition-colors uppercase tracking-[0.15em]"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "futurebite.cart.v1";

/** Matches the server's tax and service-charge rules in `createOrder`. */
export const TAX_RATE = 0.1;
export const SERVICE_CHARGE_RATE = 0.05;

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Discard anything malformed rather than crashing the whole cart.
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.menuItemId === "string" &&
        typeof i.price === "number" &&
        typeof i.quantity === "number" &&
        i.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read from storage after mount so SSR and the first client render agree.
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — cart stays in memory */
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (incoming: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.menuItemId === incoming.menuItemId &&
            (i.specialInstructions || "") === (incoming.specialInstructions || "")
        );
        if (existing) {
          return prev.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(50, i.quantity + quantity) }
              : i
          );
        }
        return [...prev, { ...incoming, quantity: Math.min(50, quantity) }];
      });
      setIsOpen(true);
    },
    []
  );

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menuItemId !== menuItemId)
        : prev.map((i) =>
            i.menuItemId === menuItemId
              ? { ...i, quantity: Math.min(50, quantity) }
              : i
          )
    );
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      isOpen,
      addItem,
      setQuantity,
      removeItem,
      clear,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [items, isOpen, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
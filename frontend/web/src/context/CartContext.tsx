import React, { createContext, useContext, useState, ReactNode } from 'react'

type CartItem = {
  dish_id: string
  name: string
  price: number
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem,'quantity'>, qty?: number) => void
  removeItem: (dish_id: string) => void
  updateQty: (dish_id: string, qty: number) => void
  clear: () => void
  total: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function useCart(){
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }){
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch (e) { return [] }
  })

  function addItem(item: Omit<CartItem,'quantity'>, qty = 1){
    setItems(prev => {
      const exists = prev.find(i => i.dish_id === item.dish_id)
      if (exists) return prev.map(i => i.dish_id === item.dish_id ? { ...i, quantity: i.quantity + qty } : i)
      return [{ ...item, quantity: qty }, ...prev]
    })
  }

  function removeItem(dish_id: string){ setItems(prev => prev.filter(i => i.dish_id !== dish_id)) }

  function updateQty(dish_id: string, qty: number){
    if (qty <= 0) return removeItem(dish_id)
    setItems(prev => prev.map(i => i.dish_id === dish_id ? { ...i, quantity: qty } : i))
  }

  function clear(){ setItems([]) }

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0)

  // persist
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(items)) }, [items])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  )
}

export type { CartItem }

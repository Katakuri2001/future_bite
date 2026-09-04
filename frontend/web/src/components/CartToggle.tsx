import React, { useState } from 'react'
import CartDrawer from './CartDrawer'
import { useCart } from '../context/CartContext'

export default function CartToggle(){
  const [open, setOpen] = useState(false)
  const { items } = useCart()

  return (
    <>
      <button onClick={()=>setOpen(true)} className="relative p-2 rounded hover:bg-slate-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {items.length>0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs px-1 rounded-full">{items.length}</span>}
      </button>
      <CartDrawer open={open} onClose={()=>setOpen(false)} />
    </>
  )
}

import React from 'react'
import { useCart } from '../context/CartContext'

export default function CartDrawer({ open, onClose }: { open: boolean, onClose: ()=>void }){
  const { items, updateQty, removeItem, total, clear } = useCart()

  async function handleCheckout(){
    // simple stub: call /api/orders when backend is wired
    try{
      // Example payload
      const payload = { items: items.map(i=>({ dish_id: i.dish_id, quantity: i.quantity, price: i.price })), total_amount: total }
      // await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      alert('Checkout stub — order would be created.');
      clear()
      onClose()
    }catch(e){ console.error(e); alert('Checkout failed') }
  }

  return (
    <div className={`${open ? 'translate-x-0' : 'translate-x-full'} fixed right-0 top-0 h-full w-80 bg-[#071017] shadow-lg transition-transform duration-200 z-50`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="font-semibold">Cart</div>
        <button onClick={onClose} className="text-gray-300">Close</button>
      </div>
      <div className="p-4 flex-1 overflow-auto">
        {items.length === 0 && <div className="text-gray-400">Your cart is empty</div>}
        <div className="space-y-3">
          {items.map(it=> (
            <div key={it.dish_id} className="flex items-center justify-between p-2 rounded bg-[#061018]">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-gray-400">${(it.price/100).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min={1} value={it.quantity} onChange={e=>updateQty(it.dish_id, Number(e.target.value))} className="w-16 p-1 rounded bg-transparent border border-gray-700 text-center" />
                <button onClick={()=>removeItem(it.dish_id)} className="text-rose-400">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Total</div>
          <div className="font-semibold text-green-300">${(total/100).toFixed(2)}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckout} disabled={items.length===0} className="flex-1 bg-[#08323a] px-3 py-2 rounded">Checkout</button>
          <button onClick={()=>{ clear(); onClose() }} className="px-3 py-2 bg-slate-800 rounded">Clear</button>
        </div>
      </div>
    </div>
  )
}

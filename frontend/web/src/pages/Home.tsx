import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'

export default function Home() {
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dishes')
      .then(r => r.json())
      .then(data => { setDishes(data.dishes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const { addItem } = useCart()

  return (
    <div>
      <section className="card mb-6">
        <h2 className="text-3xl font-semibold neon">Welcome to FutureBite</h2>
        <p className="text-gray-300 mt-2">Immersive futuristic dining & ordering system.</p>
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Featured Dishes</h3>
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map(d => (
              <div key={d.id} className="card">
                <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md mb-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-sm text-gray-400">{d.category}</div>
                  </div>
                  <div className="text-green-300">${(d.price/100).toFixed(2)}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={()=>addItem({ dish_id: d.id, name: d.name, price: d.price })} className="px-3 py-1 bg-[#08323a] rounded">Add to cart</button>
                  <button className="px-3 py-1 bg-slate-800 rounded">Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 card">
        <h3 className="text-lg font-semibold">Today’s Specials</h3>
        <p className="text-gray-400">(Specials will appear here)</p>
      </section>
    </div>
  )
}

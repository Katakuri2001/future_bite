import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import AdminNav from '../components/AdminNav'

type Order = {
  id: string
  user_id?: string
  table_id?: string
  total_amount: number
  status: string
  created_at: string
}

export default function Admin() {
  const token = localStorage.getItem('token')
  const { connected, messages, send } = useWebSocket(token, 'admin')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [meChecking, setMeChecking] = useState(true)
  const [showOrder, setShowOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])

  useEffect(() => {
    // Check /api/me to ensure admin
    fetch('/api/me', { headers: { Authorization: `Bearer ${token || ''}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.role !== 'admin') {
          window.location.href = '/auth'
          return
        }
        setMeChecking(false)
      })
      .catch(() => { window.location.href = '/auth' })

    fetch('/api/orders', { headers: { Authorization: `Bearer ${token || ''}` } })
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!messages || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.type === 'order:update' && last.order) {
      setOrders(prev => {
        const exists = prev.find(o => o.id === last.order.id)
        if (exists) return prev.map(o => o.id === last.order.id ? last.order : o)
        return [last.order, ...prev]
      })
    }
  }, [messages])

  async function updateStatus(id: string, status: string) {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? data.order : o))
        // send a WS message optionally
        send({ type: 'order:action', orderId: id, status })
      }
    } catch (e) { console.error(e) }
  }

  async function openDetails(id: string) {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token || ''}` } })
      const data = await res.json()
      if (res.ok) {
        setShowOrder(data.order)
        setOrderItems(data.items || [])
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl neon">Admin Dashboard</h2>
          <div className="text-sm text-gray-400">Live orders and management</div>
        </div>
        <div className="flex items-center gap-4">
          <AdminNav />
          <div className="text-sm">
            WebSocket: {connected ? <span className="text-green-300">connected</span> : <span className="text-rose-400">disconnected</span>}
          </div>
        </div>
      </div>

      <section className="card">
        <h3 className="font-semibold mb-3">Incoming Orders</h3>
        {loading ? <p>Loading...</p> : (
          <div className="flex flex-col gap-3">
            {orders.length === 0 && <div className="text-gray-400">No orders yet</div>}
            {orders.map(o => (
              <div key={o.id} className="p-3 rounded border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="font-medium">Order {o.id}</div>
                  <div className="text-sm text-gray-400">Table: {o.table_id || 'N/A'} — User: {o.user_id || 'guest'}</div>
                  <div className="text-sm text-gray-300">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-green-300">${(o.total_amount/100).toFixed(2)}</div>
                  <div className="text-sm px-2 py-1 rounded bg-slate-800">{o.status}</div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateStatus(o.id,'started')} className="px-3 py-1 bg-[#08121a] rounded">Start</button>
                    <button onClick={()=>updateStatus(o.id,'completed')} className="px-3 py-1 bg-[#04261a] rounded">Complete</button>
                    <button onClick={()=>updateStatus(o.id,'rejected')} className="px-3 py-1 bg-[#2a041a] rounded">Reject</button>
                    <button onClick={()=>openDetails(o.id)} className="px-3 py-1 bg-[#0f1230] rounded">Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {showOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#061018] p-6 rounded-lg max-w-xl w-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl neon">Order {showOrder.id}</h3>
                <div className="text-sm text-gray-400">Table: {showOrder.table_id || 'N/A'}</div>
              </div>
              <button onClick={()=>setShowOrder(null)} className="text-gray-300">Close</button>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Items</h4>
              <ul className="mt-2 space-y-2">
                {orderItems.map(it => (
                  <li key={it.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.dish_id}</div>
                      <div className="text-sm text-gray-400">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-green-300">${(it.price/100).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

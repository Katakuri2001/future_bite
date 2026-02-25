import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'

type Supply = { id: string, name: string, quantity:number, restock_date?:string, price?: number }

export default function AdminSupplies(){
  const token = localStorage.getItem('token')
  const [items, setItems] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({name:'',quantity:0,restock_date:'',price:0})

  async function load(){
    setLoading(true)
    try{
      const res = await fetch('/api/supplies')
      const data = await res.json()
      setItems(data.supplies || [])
    }catch(e){console.error(e)}
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function submit(e:React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch('/api/supplies',{ method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token||''}` }, body: JSON.stringify(form) })
      if (!res.ok) { alert('Error'); return }
      await load()
      setForm({name:'',quantity:0,restock_date:'',price:0})
    }catch(e){console.error(e)}
  }

  async function remove(id:string){ if (!confirm('Delete supply?')) return; await fetch('/api/supplies/'+id,{ method:'DELETE', headers:{ Authorization:`Bearer ${token||''}` } }); load() }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl neon">Supplies</h3>
          <p className="text-gray-400">Kitchen supplies management</p>
        </div>
        <AdminNav />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card">
          {loading ? <p>Loading...</p> : (
            <div className="space-y-3">
              {items.map(s => (
                <div key={s.id} className="p-3 rounded border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-400">Qty: {s.quantity} • Restock: {s.restock_date || 'N/A'}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-green-300">${(s.price||0)/100}</div>
                    <button onClick={()=>remove(s.id)} className="px-2 py-1 bg-[#2a041a] rounded">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="card">
          <h4 className="font-semibold mb-3">Add Supply</h4>
          <div className="mb-2">
            <label className="block text-sm text-gray-300">Name</label>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
          </div>
          <div className="mb-2">
            <label className="block text-sm text-gray-300">Quantity</label>
            <input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
          </div>
          <div className="mb-2">
            <label className="block text-sm text-gray-300">Restock Date</label>
            <input value={form.restock_date} onChange={e=>setForm({...form,restock_date:e.target.value})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
          </div>
          <div className="mb-2">
            <label className="block text-sm text-gray-300">Price (cents)</label>
            <input type="number" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-[#08121a] rounded">Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}


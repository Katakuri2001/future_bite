import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'

type Dish = {
  id: string
  name: string
  description?: string
  price: number
  points?: number
  category?: string
  available?: number
}

export default function AdminDishes(){
  const token = localStorage.getItem('token')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Dish | null>(null)
  const [form, setForm] = useState<any>({name:'',price:'',points:0,category:'main',available:1,description:''})

  async function load(){
    setLoading(true)
    try{
      const res = await fetch('/api/dishes')
      const data = await res.json()
      setDishes(data.dishes || [])
    }catch(e){console.error(e)}
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  function resetForm(){ setForm({name:'',price:'',points:0,category:'main',available:1,description:''}); setEditing(null) }

  async function submit(e:React.FormEvent){
    e.preventDefault()
    const payload = { ...form, price: Math.round(parseFloat(form.price||0)*100) }
    try{
      let res
      if (editing) {
        res = await fetch('/api/dishes/'+editing.id, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token||''}` }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/dishes', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token||''}` }, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (!res.ok) { alert(JSON.stringify(data)); return }
      await load()
      resetForm()
    }catch(e){console.error(e)}
  }

  async function remove(id:string){
    if (!confirm('Delete dish?')) return
    const res = await fetch('/api/dishes/'+id, { method: 'DELETE', headers: { Authorization:`Bearer ${token||''}` } })
    if (res.ok) load()
  }

  function edit(d:Dish){ setEditing(d); setForm({ name:d.name, price: (d.price/100).toString(), points: d.points||0, category:d.category||'main', available:d.available||1, description:d.description||'' }) }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl neon">Dish Management</h3>
          <p className="text-gray-400">Create, edit and delete dishes</p>
        </div>
        <AdminNav />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="card">
            <h4 className="font-semibold mb-3">Dishes</h4>
            {loading ? <p>Loading...</p> : (
              <div className="space-y-3">
                {dishes.map(d=> (
                  <div key={d.id} className="p-3 rounded border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-sm text-gray-400">{d.category} • {d.points || 0} pts</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-green-300">${(d.price/100).toFixed(2)}</div>
                      <button onClick={()=>edit(d)} className="px-2 py-1 bg-[#08121a] rounded">Edit</button>
                      <button onClick={()=>remove(d.id)} className="px-2 py-1 bg-[#2a041a] rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <form onSubmit={submit} className="card">
            <h4 className="font-semibold mb-3">{editing ? 'Edit Dish' : 'Add Dish'}</h4>
            <div className="mb-2">
              <label className="block text-sm text-gray-300">Name</label>
              <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-300">Price (USD)</label>
              <input required value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-300">Points</label>
              <input value={form.points} onChange={e=>setForm({...form,points:Number(e.target.value)})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-300">Category</label>
              <input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full p-2 rounded bg-transparent border border-gray-700" />
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-[#08121a] rounded">{editing ? 'Save' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="px-3 py-2 bg-slate-800 rounded">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

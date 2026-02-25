import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'

export default function AdminBookings(){
  const token = localStorage.getItem('token')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load(){
    setLoading(true)
    try{
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
    }catch(e){console.error(e)}
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl neon">Bookings</h3>
          <p className="text-gray-400">View table bookings and statuses</p>
        </div>
        <AdminNav />
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <div className="space-y-3">
            {bookings.length === 0 && <div className="text-gray-400">No bookings</div>}
            {bookings.map(b => (
              <div key={b.id} className="p-3 rounded border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="font-medium">Table {b.table_id}</div>
                  <div className="text-sm text-gray-400">User: {b.user_id || 'guest'}</div>
                  <div className="text-sm text-gray-300">{new Date(b.booking_time).toLocaleString()}</div>
                </div>
                <div className="text-sm px-2 py-1 rounded bg-slate-800">{b.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

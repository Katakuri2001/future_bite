import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav'

export default function AdminAnalytics(){
  const token = localStorage.getItem('token')
  const [top, setTop] = useState<any[]>([])
  const [daily, setDaily] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      try{
        const res = await fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token||''}` } })
        const data = await res.json()
        setTop(data.top_dishes || [])
        setDaily(data.daily_sales || [])
      }catch(e){console.error(e)}
      setLoading(false)
    }
    load()
  },[])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl neon">Analytics</h3>
          <p className="text-gray-400">Sales and popularity overview</p>
        </div>
        <AdminNav />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="font-semibold mb-3">Top Dishes</h4>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {top.map((t, i)=> (
                <li key={i} className="flex items-center justify-between">
                  <div>{t.name || t.dish_id}</div>
                  <div className="text-gray-300">{t.sold_count || t.sold_count}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h4 className="font-semibold mb-3">Daily Sales (last 14 days)</h4>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2 text-sm text-gray-300">
              {daily.map((d,i)=> (
                <li key={i} className="flex items-center justify-between">
                  <div>{d.date}</div>
                  <div>${((d.income||d.income)/100).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

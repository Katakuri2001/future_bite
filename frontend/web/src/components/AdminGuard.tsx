import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function AdminGuard({ children }: { children: React.ReactNode }){
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState(false)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    fetch('/api/me', { headers: { Authorization: `Bearer ${token||''}` } }).then(r=>r.json()).then(d=>{
      if (d.user && d.user.role === 'admin') setOk(true)
      else setOk(false)
      setChecking(false)
    }).catch(()=>{ setOk(false); setChecking(false) })
  },[])

  if (checking) return <div className="p-4">Checking...</div>
  if (!ok) return <Navigate to="/auth" replace />
  return <>{children}</>
}

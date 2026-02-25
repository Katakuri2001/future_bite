import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function AdminNav(){
  const [open, setOpen] = useState(false)
  const active = 'text-sm text-white bg-slate-800 px-2 py-1 rounded transition'
  const inactive = 'text-sm text-gray-300'

  return (
    <div className="flex items-center">
      <button
        className="md:hidden p-2 rounded hover:bg-slate-800"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close admin menu' : 'Open admin menu'}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className={`overflow-hidden origin-top transition-all duration-200 ease-out ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100 md:flex flex-col md:flex-row md:items-center gap-3`}>
        <NavLink to="/admin" className={({isActive}) => isActive ? active : inactive} onClick={() => setOpen(false)}>Dashboard</NavLink>
        <NavLink to="/admin/dishes" className={({isActive}) => isActive ? active : inactive} onClick={() => setOpen(false)}>Dishes</NavLink>
        <NavLink to="/admin/bookings" className={({isActive}) => isActive ? active : inactive} onClick={() => setOpen(false)}>Bookings</NavLink>
        <NavLink to="/admin/supplies" className={({isActive}) => isActive ? active : inactive} onClick={() => setOpen(false)}>Supplies</NavLink>
        <NavLink to="/admin/analytics" className={({isActive}) => isActive ? active : inactive} onClick={() => setOpen(false)}>Analytics</NavLink>
      </div>
    </div>
  )
}

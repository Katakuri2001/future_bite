import React, { useState } from 'react'

export default function Auth() {
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const payload: any = { email, password }
    if (mode === 'signup') payload.name = name
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setMessage(JSON.stringify(data)); return }
      if (data.token) {
        localStorage.setItem('token', data.token)
        setMessage('Success. Token saved.')
      } else {
        setMessage('Success')
      }
    } catch (e) { setMessage('Network error') }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card mb-4">
        <h2 className="text-2xl font-semibold neon">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <p className="text-gray-400 text-sm">Access ordering and loyalty points</p>
      </div>

      <form onSubmit={submit} className="card">
        {mode === 'signup' && (
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 rounded bg-transparent border border-gray-700" />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 rounded bg-transparent border border-gray-700" />
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 rounded bg-transparent border border-gray-700" />
        </div>

        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-[#08121a] border border-[#0f1724] rounded text-white">{mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
          <button type="button" onClick={()=>setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-gray-400">{mode === 'login' ? 'Create account' : 'Have an account?'}</button>
        </div>

        {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
      </form>
    </div>
  )
}

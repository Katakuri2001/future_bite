import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Api from '../utils/api'

type User = { id: string, name: string, email: string, role?: string }

const AuthContext = createContext<{ user: User | null, token: string | null, login: (email:string,password:string)=>Promise<void>, logout: ()=>void } | undefined>(undefined)

export function useAuth(){
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }){
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('me')||'null') } catch(e){ return null } })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  useEffect(()=>{
    if (token && !user) {
      Api.me().then((res:any)=>{ if (res.user) { setUser(res.user); localStorage.setItem('me', JSON.stringify(res.user)) } }).catch(()=>{})
    }
  },[token])

  async function login(email:string, password:string){
    const res:any = await Api.login({ email, password })
    if (res.token) {
      localStorage.setItem('token', res.token)
      setToken(res.token)
      if (res.user) { setUser(res.user); localStorage.setItem('me', JSON.stringify(res.user)) }
      return
    }
    throw new Error(res.message || 'Login failed')
  }

  function logout(){ localStorage.removeItem('token'); localStorage.removeItem('me'); setToken(null); setUser(null) }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

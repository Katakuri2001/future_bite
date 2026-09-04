import { useEffect, useRef, useState } from 'react'

export function useWebSocket(token?: string | null, role: string = 'user', tableId?: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const retryRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const t = token || localStorage.getItem('token')
    const host = location.host
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${host}/api/ws?token=${encodeURIComponent(t || '')}&role=${role}${tableId ? `&tableId=${encodeURIComponent(tableId)}` : ''}`

    let cancelled = false

    function connect(){
      if (cancelled) return
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws
        ws.addEventListener('open', () => { retryRef.current = 0; setConnected(true) })
        ws.addEventListener('message', ev => {
          try { const data = JSON.parse(ev.data); setMessages(m => [...m, data]) } catch (e) { }
        })
        ws.addEventListener('close', () => { setConnected(false); scheduleReconnect() })
        ws.addEventListener('error', () => { setConnected(false); scheduleReconnect() })
      } catch (e) {
        setConnected(false); scheduleReconnect()
      }
    }

    function scheduleReconnect(){
      if (cancelled) return
      retryRef.current = Math.min(10, retryRef.current + 1)
      const delay = Math.min(30000, 500 * Math.pow(1.6, retryRef.current))
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => connect(), delay)
    }

    connect()

    return () => {
      cancelled = true
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [token, role, tableId])

  function send(obj: any) {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(obj))
    return true
  }

  return { connected, messages, send }
}

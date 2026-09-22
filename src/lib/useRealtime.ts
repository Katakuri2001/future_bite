"use client";

import { useEffect, useRef } from "react";

const getBase = () =>
  process.env.NEXT_PUBLIC_REALTIME_URL || "ws://localhost:8788";

export function useRealtime(onUpdate: () => void): void {
  const ref = useRef<WebSocket | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      if (!mounted.current) return;
      let token = "";
      try {
        token = localStorage.getItem("token") || "";
      } catch {
        /* ignore */
      }
      const base = getBase();
      const ws = new WebSocket(`${base}/ws${token ? `?token=${token}` : ""}`);
      ref.current = ws;

      ws.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          onUpdate();
        } catch {
          /* swallow */
        }
      };
      ws.onclose = () => {
        if (!mounted.current) return;
        timeout = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();

      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 30_000);

      ws.addEventListener("close", () => clearInterval(heartbeat), { once: true });
    }

    connect();

    return () => {
      mounted.current = false;
      clearTimeout(timeout);
      ref.current?.close();
    };
  }, [onUpdate]);
}
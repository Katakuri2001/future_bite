export class OrderManager {
  private sessions = new Set<WebSocket>();
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
  }

  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body = await request.json().catch(() => ({ type: "updated" }));
      this.broadcast(body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket upgrade", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    server.addEventListener("message", (event) => {
      const data = typeof event.data === "string" ? event.data : "";
      if (data === "ping") {
        try {
          server.send("pong");
        } catch {
          /* ignore */
        }
      }
    });
    server.addEventListener("close", () => this.sessions.delete(server));
    server.addEventListener("error", () => this.sessions.delete(server));

    server.send(JSON.stringify({ type: "connected" }));

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: unknown): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    for (const ws of this.sessions) {
      try {
        ws.send(data);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }
}
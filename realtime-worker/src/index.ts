import { OrderManager } from "./orderManager";

export { OrderManager };

interface Env {
  ORDER_MANAGER: DurableObjectNamespace;
  SESSIONS: KVNamespace;
  REALTIME_SECRET?: string;
  LOCAL_MODE?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function corsHeaders(auth = false): Record<string, string> {
  return {
    ...CORS_HEADERS,
    ...(auth ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Internal endpoint used by the Next.js worker (via service binding)
    // to push "data changed" signals to connected socket clients.
    if (request.method === "POST" && url.pathname === "/notify") {
      if (env.REALTIME_SECRET) {
        const expected = `Bearer ${env.REALTIME_SECRET}`;
        if (request.headers.get("Authorization") !== expected) {
          return new Response("unauthorized", { status: 401, headers: corsHeaders() });
        }
      }
      const body = await request.json().catch(() => ({ type: "updated" }));
      const id = env.ORDER_MANAGER.idFromName("global");
      const stub = env.ORDER_MANAGER.get(id);
      await stub.fetch("https://internal/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // WebSocket endpoint for browsers: wss://<worker>/ws?token=<sessionToken>
    if (request.method === "GET" && url.pathname === "/ws") {
      const token = url.searchParams.get("token") || "";
      const session = await env.SESSIONS.get(`session:${token}`);
      if (!session && !env.LOCAL_MODE) {
        return new Response("unauthorized", { status: 401, headers: corsHeaders() });
      }
      const id = env.ORDER_MANAGER.idFromName("global");
      const stub = env.ORDER_MANAGER.get(id);
      return stub.fetch(request);
    }

    return new Response("not found", { status: 404, headers: corsHeaders() });
  },
} satisfies ExportedHandler<Env>;
import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function elapsed(createdAt: string | undefined): string {
  if (!createdAt) return "";
  const diff = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const orders = (await listOrders()).map((order: any) => ({
    id: order.orderNumber.replace("#", ""),
    table: order.tableNumber,
    items: (order.items || [])
      .map((i: any) => `${i.quantity}× ${i.name}`)
      .join(", "),
    total: order.total,
    status: order.status,
    time: elapsed(order.createdAt),
    createdAt: order.createdAt,
  }));

  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as any).items) ||
    (body as any).items.length === 0
  ) {
    return NextResponse.json(
      { success: false, error: "items is required" },
      { status: 400 }
    );
  }

  const order = await createOrder(body as any);
  return NextResponse.json({ success: true, data: order });
}
import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/lib/db";

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

export async function GET() {
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
  const body = await request.json();
  if (body?.items && Array.isArray(body.items) && body.items.length > 0) {
    const order = await createOrder(body);
    return NextResponse.json({ success: true, data: order });
  }
  return NextResponse.json({ success: true, data: body });
}
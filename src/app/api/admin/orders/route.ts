import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/mock-db";

export async function GET() {
  const db = await readDB();
  const orders = Object.values(db.orders)
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((order: any) => ({
      id: order.orderNumber.replace("#", ""),
      table: order.tableNumber,
      items: order.items.map((i: any) => `${i.quantity}× ${i.name}`).join(", "),
      total: order.total,
      status: order.status,
      time: "",
      createdAt: order.createdAt,
    }));

  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: body });
}
import { NextRequest, NextResponse } from "next/server";
import {
  listKitchenOrders,
  createKitchenOrder,
  updateOrderStatus,
} from "@/lib/db";

export async function GET() {
  const data = await listKitchenOrders();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderNumber, tableNumber, items, priority, status } = body;

  const newOrder = await createKitchenOrder({
    orderNumber,
    tableNumber,
    items,
    priority,
    status,
  });

  return NextResponse.json({ success: true, data: newOrder });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json(
      { success: false, error: "id and status are required" },
      { status: 400 }
    );
  }
  const updated = await updateOrderStatus(id, status);
  return NextResponse.json({ success: true, data: updated });
}
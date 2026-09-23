import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/db";
import { requireSession, requireStaff } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const { tableId, tableNumber, items, specialInstructions } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, error: "Items are required" },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder({
      tableId,
      tableNumber,
      items,
      specialInstructions,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: order.items.map((i: any) => ({
          ...i,
          variants: undefined,
          addons: undefined,
        })),
      },
    });
  } catch (e: any) {
    console.error("orders POST error:", e);
    return NextResponse.json(
      { success: false, error: String((e && (e.message || e)) || e) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  const orders = await listOrders();

  return NextResponse.json({ success: true, data: orders });
}
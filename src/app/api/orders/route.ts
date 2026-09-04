import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

let orders: Record<string, any> = {};
let orderCounter = 1000;

function calculateOrderTotals(items: any[]) {
  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;
  return { subtotal, tax, serviceCharge, total };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tableId, tableNumber, items, specialInstructions } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, error: "Items are required" },
      { status: 400 }
    );
  }

  // Validate and calculate server-side
  const validatedItems = items.map((item: any) => ({
    menuItemId: item.menuItemId || item.id,
    name: item.name || "Unknown",
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    price: Math.max(0, parseInt(item.price) || 0),
    variants: item.variants || [],
    addons: item.addons || [],
    specialInstructions: item.specialInstructions || "",
  }));

  const { subtotal, tax, serviceCharge, total } = calculateOrderTotals(validatedItems);
  const orderNumber = `#${++orderCounter}`;
  const id = `ord-${randomUUID().slice(0, 8)}`;

  const order = {
    id,
    orderNumber,
    tableId,
    tableNumber,
    items: validatedItems,
    subtotal,
    tax,
    serviceCharge,
    total,
    status: "pending",
    paymentStatus: "pending",
    specialInstructions: specialInstructions || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders[id] = order;

  return NextResponse.json({
    success: true,
    data: order,
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: Object.values(orders).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
}

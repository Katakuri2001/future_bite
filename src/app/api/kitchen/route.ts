import { NextRequest, NextResponse } from "next/server";

const kitchenOrders: any[] = [
  { id: "ord-001", orderNumber: "#1042", tableNumber: 8, priority: "normal", status: "preparing", elapsed: 161, items: [{ id: "oi-1", name: "Wagyu A5 Omakase", quantity: 2, status: "preparing", specialInstructions: "Medium rare" }, { id: "oi-2", name: "Truffle Risotto Cosmos", quantity: 1, status: "pending", specialInstructions: "" }, { id: "oi-3", name: "Water", quantity: 2, status: "ready", specialInstructions: "Sparkling" }] },
  { id: "ord-002", orderNumber: "#1043", tableNumber: 3, priority: "urgent", status: "pending", elapsed: 245, items: [{ id: "oi-4", name: "Nebula Tartare", quantity: 2, status: "pending", specialInstructions: "" }, { id: "oi-5", name: "Quantum Lobster Bisque", quantity: 1, status: "pending", specialInstructions: "Extra croutons" }] },
  { id: "ord-003", orderNumber: "#1044", tableNumber: 6, priority: "normal", status: "plating", elapsed: 89, items: [{ id: "oi-6", name: "Black Cod Stellaris", quantity: 4, status: "ready", specialInstructions: "" }, { id: "oi-7", name: "Chocolate Eclipse", quantity: 2, status: "pending", specialInstructions: "Allergen: nuts" }] },
];

let orderCounter = 1044;

export async function GET() {
  return NextResponse.json({ success: true, data: kitchenOrders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderNumber, tableNumber, items } = body;

  orderCounter++;
  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber: `#${orderNumber || orderCounter}`,
    tableNumber: tableNumber || Math.floor(Math.random() * 10) + 1,
    priority: "normal",
    status: "pending",
    elapsed: 0,
    items: items || [{ id: `oi-${Date.now()}`, name: "New Dish", quantity: 1, status: "pending", specialInstructions: "" }],
  };

  kitchenOrders.unshift(newOrder);

  return NextResponse.json({ success: true, data: newOrder });
}

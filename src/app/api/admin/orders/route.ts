import { NextRequest, NextResponse } from "next/server";

const orders = [
  { id: "1042", table: 8, items: "2× Wagyu A5 Omakase, 1× Truffle Risotto Cosmos, 2× Water", total: 17200, status: "preparing", time: "2:41" },
  { id: "1043", table: 3, items: "2× Nebula Tartare, 1× Quantum Lobster Bisque", total: 8000, status: "pending", time: "4:05" },
  { id: "1044", table: 6, items: "4× Black Cod Stellaris, 2× Chocolate Eclipse", total: 24000, status: "plating", time: "1:29" },
  { id: "1045", table: 1, items: "1× Wagyu A5 Omakase, 2× FutureBite Signature Cocktail", total: 11200, status: "served", time: "0:00" },
];

export async function GET() {
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newOrder = { id: `${Date.now()}`, ...body, createdAt: new Date().toISOString() };
  orders.unshift(newOrder);
  return NextResponse.json({ success: true, data: newOrder });
}

import { NextRequest, NextResponse } from "next/server";

let menuItems: Record<string, any> = {
  "dish-001": { id: "dish-001", name: "Nebula Tartare", price: 2800, category: "Starters", isAvailable: true, isFeatured: true },
  "dish-002": { id: "dish-002", name: "Quantum Lobster Bisque", price: 2400, category: "Starters", isAvailable: true, isFeatured: false },
  "dish-003": { id: "dish-003", name: "Wagyu A5 Omakase", price: 6800, category: "Mains", isAvailable: true, isFeatured: true },
  "dish-004": { id: "dish-004", name: "Black Cod Stellaris", price: 4200, category: "Mains", isAvailable: true, isFeatured: true },
  "dish-005": { id: "dish-005", name: "Truffle Risotto Cosmos", price: 3600, category: "Chef's Selection", isAvailable: true, isFeatured: true },
  "dish-006": { id: "dish-006", name: "Chocolate Eclipse", price: 1800, category: "Desserts", isAvailable: true, isFeatured: true },
  "dish-007": { id: "dish-007", name: "Yuzu Panna Cotta Nebula", price: 1600, category: "Desserts", isAvailable: true, isFeatured: false },
  "dish-008": { id: "dish-008", name: "FutureBite Signature Cocktail", price: 2200, category: "Drinks", isAvailable: true, isFeatured: true },
};

export async function GET() {
  return NextResponse.json({ success: true, data: Object.values(menuItems) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newItem = { id: `dish-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
  menuItems[newItem.id] = newItem;
  return NextResponse.json({ success: true, data: newItem });
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json();
  if (menuItems[id]) {
    menuItems[id] = { ...menuItems[id], ...updates };
    return NextResponse.json({ success: true, data: menuItems[id] });
  }
  return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id && menuItems[id]) {
    delete menuItems[id];
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
}

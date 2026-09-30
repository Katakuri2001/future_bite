import { NextRequest, NextResponse } from "next/server";
import {
  listSupplies,
  adjustSupplyStock,
  listSupplyTransactions,
  createSupply,
} from "@/lib/db";
import { requireKitchen } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireKitchen(request);
  if (auth instanceof NextResponse) return auth;
  const [data, transactions] = await Promise.all([
    listSupplies(),
    listSupplyTransactions(),
  ]);
  return NextResponse.json({ success: true, data, transactions });
}

/**
 * POST supports two payload shapes:
 *  1. Create a new ingredient — `{ name, unit, currentStock?, minimumStock?, cost?, supplier? }`
 *     (no `id`). Creates the supply and logs the opening transaction.
 *  2. Register usage/restock — `{ id, type, quantity, notes?, createdBy? }` (existing behaviour).
 */
export async function POST(request: NextRequest) {
  const auth = await requireKitchen(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();

  // Create a brand-new ingredient.
  if (body?.name && !body?.id) {
    const { name, unit, currentStock, minimumStock, cost, supplier, notes } = body;
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Ingredient name is required" },
        { status: 400 }
      );
    }
    const created = await createSupply({
      name,
      unit: unit || "pcs",
      currentStock: parseFloat(currentStock) || 0,
      minimumStock: parseFloat(minimumStock) || 0,
      cost: parseFloat(cost) || 0,
      supplier: supplier || "",
      initialType: "adjustment",
      notes: notes || "Added from kitchen",
    });
    return NextResponse.json({ success: true, data: created, created: true });
  }

  // Register usage / restock against an existing ingredient.
  const { id, type, quantity, notes, createdBy } = body;
  if (!id || quantity === undefined) {
    return NextResponse.json(
      { success: false, error: "id and quantity are required (or provide name to create)" },
      { status: 400 }
    );
  }
  const amount = parseFloat(quantity);
  const delta =
    type === "usage" || type === "waste"
      ? -Math.abs(amount)
      : Math.abs(amount);
  const updated = await adjustSupplyStock(
    id,
    delta,
    type || "usage",
    notes || "",
    createdBy || ""
  );
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Ingredient not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}
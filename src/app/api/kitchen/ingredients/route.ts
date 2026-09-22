import { NextRequest, NextResponse } from "next/server";
import {
  listSupplies,
  adjustSupplyStock,
  listSupplyTransactions,
} from "@/lib/db";

export async function GET() {
  const [data, transactions] = await Promise.all([
    listSupplies(),
    listSupplyTransactions(),
  ]);
  return NextResponse.json({ success: true, data, transactions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, type, quantity, notes, createdBy } = body;
  if (!id || quantity === undefined) {
    return NextResponse.json(
      { success: false, error: "id and quantity are required" },
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
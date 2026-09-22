import { NextRequest, NextResponse } from "next/server";
import {
  listSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
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
  const item = await createSupply(body);
  return NextResponse.json({ success: true, data: item });
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const updated = await updateSupply(id, updates);
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, delta, type, notes, createdBy } = body;
  if (!id || delta === undefined) {
    return NextResponse.json(
      { success: false, error: "id and delta are required" },
      { status: 400 }
    );
  }
  const updated = await adjustSupplyStock(
    id,
    parseFloat(delta),
    type || "adjustment",
    notes || "",
    createdBy || ""
  );
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteSupply(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json(
    { success: false, error: "Item not found" },
    { status: 404 }
  );
}
import { NextRequest, NextResponse } from "next/server";
import {
  listSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  adjustSupplyStock,
  listSupplyTransactions,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const [data, transactions] = await Promise.all([
      listSupplies(),
      listSupplyTransactions(),
    ]);
    return NextResponse.json({ success: true, data, transactions });
  } catch (e) {
    console.error("admin/inventory GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const item = await createSupply(body);
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error("admin/inventory POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that item" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, ...updates } = await request.json();
    const updated = await updateSupply(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("admin/inventory PUT error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that item" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
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
  } catch (e) {
    console.error("admin/inventory PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Could not adjust that stock" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
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
  } catch (e) {
    console.error("admin/inventory DELETE error:", e);
    return NextResponse.json(
      { success: false, error: "Could not remove that item" },
      { status: 500 }
    );
  }
}
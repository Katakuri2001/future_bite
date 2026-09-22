import { NextRequest, NextResponse } from "next/server";
import { getAllDishes, createDish, updateDish, deleteDish } from "@/lib/db";

export async function GET() {
  const data = await getAllDishes();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newItem = await createDish(body);
  return NextResponse.json({ success: true, data: newItem });
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const updated = await updateDish(id, updates);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteDish(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
}
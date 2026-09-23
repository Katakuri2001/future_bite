import { NextRequest, NextResponse } from "next/server";
import { getAllDishes, createDish, updateDish, deleteDish } from "@/lib/db";
import { requireMenuAccess, requireAdmin } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await requireMenuAccess(request);
  if (auth instanceof NextResponse) return auth;
  const data = await getAllDishes();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await requireMenuAccess(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  if (!body?.name) {
    return NextResponse.json(
      { success: false, error: "Dish name is required" },
      { status: 400 }
    );
  }
  const newItem = await createDish({ ...body, slug: body.slug || slugify(body.name) });
  return NextResponse.json({ success: true, data: newItem });
}

export async function PUT(request: NextRequest) {
  const auth = await requireMenuAccess(request);
  if (auth instanceof NextResponse) return auth;
  const { id, ...updates } = await request.json();
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Dish id is required" },
      { status: 400 }
    );
  }
  const updated = await updateDish(id, updates);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest) {
  // Deletion stays admin/manager-only — kitchen can create and edit, not destroy.
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteDish(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false, error: "Dish not found" }, { status: 404 });
}
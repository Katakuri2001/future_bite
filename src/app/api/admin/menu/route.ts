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
  try {
    const data = await getAllDishes();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin/menu GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load the menu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMenuAccess(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json(
        { success: false, error: "Dish name is required" },
        { status: 400 }
      );
    }
    const newItem = await createDish({ ...body, slug: body.slug || slugify(body.name) });
    return NextResponse.json({ success: true, data: newItem });
  } catch (e) {
    console.error("admin/menu POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that dish" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMenuAccess(request);
  if (auth instanceof NextResponse) return auth;
  try {
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
  } catch (e) {
    console.error("admin/menu PUT error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that dish" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Deletion stays admin/manager-only — kitchen can create and edit, not destroy.
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const removed = await deleteDish(id);
      if (!removed) {
        return NextResponse.json(
          { success: false, error: "Dish not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { id, removed: true },
        message: "Dish removed from the menu. Past orders keep their record.",
      });
    }
    return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
  } catch (e) {
    console.error("admin/menu DELETE error:", e);
    return NextResponse.json(
      { success: false, error: "Could not remove that dish" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import {
  listMenuSets,
  getMenuSetById,
  createMenuSet,
  updateMenuSet,
  deleteMenuSet,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const set = await getMenuSetById(id);
      if (!set) {
        return NextResponse.json(
          { success: false, error: "Menu set not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: set });
    }
    const data = await listMenuSets();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin/menu-sets GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load menu sets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json(
        { success: false, error: "Menu set name is required" },
        { status: 400 }
      );
    }
    const set = await createMenuSet(body);
    return NextResponse.json({ success: true, data: set });
  } catch (e) {
    console.error("admin/menu-sets POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that menu set" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu set id is required" },
        { status: 400 }
      );
    }
    const updated = await updateMenuSet(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Menu set not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("admin/menu-sets PUT error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that menu set" },
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
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu set id is required" },
        { status: 400 }
      );
    }
    await deleteMenuSet(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/menu-sets DELETE error:", e);
    return NextResponse.json(
      { success: false, error: "Could not remove that menu set" },
      { status: 500 }
    );
  }
}
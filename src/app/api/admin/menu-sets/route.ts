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
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  if (!body?.name) {
    return NextResponse.json(
      { success: false, error: "Menu set name is required" },
      { status: 400 }
    );
  }
  const set = await createMenuSet(body);
  return NextResponse.json({ success: true, data: set });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
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
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
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
}
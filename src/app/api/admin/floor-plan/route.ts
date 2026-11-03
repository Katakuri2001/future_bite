import { NextRequest, NextResponse } from "next/server";
import {
  listTables,
  listReservations,
  createTable,
  updateTable,
  deleteTable,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const [tables, reservations] = await Promise.all([
      listTables(),
      listReservations(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const todayReservations = reservations.filter((r) => r.date === today);

    const floorPlanTables = tables.map((t) => {
      const res = todayReservations.find(
        (r) => r.tableNumber === Number(t.number) && r.status !== "cancelled"
      );
      return {
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        experience: t.experience,
        status: t.status,
        location: t.location || "",
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        ...(res
          ? {
              currentReservation: {
                id: res.id,
                guestName: res.customerName,
                partySize: res.partySize,
                time: res.time,
              },
            }
          : {}),
      };
    });

    return NextResponse.json({ success: true, data: floorPlanTables });
  } catch (e) {
    console.error("admin/floor-plan GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load the floor plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const table = await createTable(body);
    return NextResponse.json({ success: true, data: table });
  } catch (e) {
    console.error("admin/floor-plan POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not create that table" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, ...updates } = await request.json();
    const updated = await updateTable(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("admin/floor-plan PUT error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that table" },
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
      await deleteTable(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: "Table id is required" },
      { status: 400 }
    );
  } catch (e) {
    console.error("admin/floor-plan DELETE error:", e);
    return NextResponse.json(
      { success: false, error: "Could not remove that table" },
      { status: 500 }
    );
  }
}
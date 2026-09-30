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
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  const table = await createTable(body);
  return NextResponse.json({ success: true, data: table });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id, ...updates } = await request.json();
  const updated = await updateTable(id, updates);
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Table not found" },
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
  if (id) {
    await deleteTable(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json(
    { success: false, error: "Table not found" },
    { status: 404 }
  );
}
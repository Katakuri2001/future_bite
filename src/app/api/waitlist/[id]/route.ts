import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { seatWaitlistedGuest, cancelWaitlistEntry } from "@/lib/db";

const schema = z.object({
  action: z.enum(["seat", "cancel"]),
  tableNumber: z.number().int().positive().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "action must be seat or cancel" },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === "seat") {
      if (!parsed.data.tableNumber) {
        return NextResponse.json(
          { success: false, error: "tableNumber is required to seat a guest" },
          { status: 400 }
        );
      }
      const updated = await seatWaitlistedGuest(id, parsed.data.tableNumber);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Guest not found or already seated" },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { id: updated.id, status: updated.status, seatedTable: updated.seated_table },
        message: `Seated at table ${parsed.data.tableNumber}`,
      });
    }

    const updated = await cancelWaitlistEntry(id);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Guest not found or already seated" },
        { status: 409 }
      );
    }
    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
      message: "Removed from the waitlist",
    });
  } catch (e) {
    console.error("waitlist PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that waitlist entry" },
      { status: 500 }
    );
  }
}
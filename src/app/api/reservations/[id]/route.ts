import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { getDB } from "@/lib/db";

const schema = z.object({
  status: z.enum(["confirmed", "seated", "completed", "cancelled", "no-show"]),
});

/**
 * Advance a reservation through its lifecycle: confirmed -> seated -> completed,
 * or cancelled / no-show when the guest does not arrive.
 *
 * Staff only.
 */
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
      { success: false, error: "status must be confirmed/seated/completed/cancelled/no-show" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  try {
    const db = getDB();
    const current = await db
      .prepare("SELECT * FROM reservations WHERE id = ?")
      .bind(id)
      .first<any>();
    if (!current) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Once a reservation has ended it stays that way: completed/cancelled/no-show
    // are terminal states. A cancelled or no-show reservation cannot be revived.
    if (current.status === "completed" || current.status === "cancelled" || current.status === "no-show") {
      return NextResponse.json(
        { success: false, error: `This reservation is already ${current.status}.` },
        { status: 409 }
      );
    }

    // You cannot seat or complete a reservation that has been cancelled, nor
    // cancel one that has already been seated/completed.
    if (status === "cancelled" || status === "no-show") {
      if (current.status !== "confirmed") {
        return NextResponse.json(
          { success: false, error: `Only a confirmed reservation can be ${status}.` },
          { status: 409 }
        );
      }
    }

    if (status === "seated" || status === "completed") {
      if (current.status !== "confirmed") {
        return NextResponse.json(
          { success: false, error: `Only a confirmed reservation can be ${status}.` },
          { status: 409 }
        );
      }
    }

    await db
      .prepare(
        `UPDATE reservations SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = ?`
      )
      .bind(status, id)
      .run();

    const updated = await db
      .prepare("SELECT * FROM reservations WHERE id = ?")
      .bind(id)
      .first<any>();

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        orderNumber: updated.order_number,
        tableNumber: updated.table_number,
        customerName: updated.customer_name,
      },
      message: `Reservation ${status}.`,
    });
  } catch (e) {
    console.error("reservations PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that reservation." },
      { status: 500 }
    );
  }
}
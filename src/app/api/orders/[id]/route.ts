import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { cancelOrder } from "@/lib/db";

/**
 * Cancel an unpaid order.
 *
 * Paid orders are refused — they need a refund, which is a different operation.
 * Cancellation moves every dish to cancelled, withdraws the kitchen ticket, and
 * voids any unpaid bill so the table is free again.
 */
const schema = z.object({
  reason: z.string().max(200).optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.pathname.split("/").pop();
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Order id is required" },
      { status: 400 }
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // A body is optional for cancellation.
  }

  try {
    const order = await cancelOrder(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
      },
      message: "Order cancelled",
    });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    const conflict = /already|refund|cancel/i.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: conflict ? 409 : 500 }
    );
  }
}
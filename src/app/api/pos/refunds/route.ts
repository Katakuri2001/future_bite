import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { refundOrder } from "@/lib/db";

/**
 * Refund a settled (paid) order.
 *
 * Refunds reverse the loyalty ledger — points earned come off the guest's
 * balance, total_spent is adjusted, and a coupon that was spent on the bill is
 * released for reuse. The order and its receipt are marked refunded rather
 * than cancelled, because money did change hands; it was just returned.
 */
const schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

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
      { success: false, error: "orderId is required" },
      { status: 400 }
    );
  }

  try {
    const order = await refundOrder({
      orderId: parsed.data.orderId,
      reason: parsed.data.reason,
      refundedBy: auth.session.name || "admin",
    });

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
        total: order.total,
        refundedAt: order.refunded_at,
      },
      message: "Order refunded",
    });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    const conflict = /not found|already|paid/i.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: conflict ? 409 : 500 }
    );
  }
}
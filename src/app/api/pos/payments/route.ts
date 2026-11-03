import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePOS } from "@/lib/auth";
import { recordPayment, listPayments } from "@/lib/db";

const paySchema = z.object({
  receiptId: z.string().min(1),
  amount: z.number().int().positive(),
  method: z.enum(["cash", "card", "qr"]).default("cash"),
  tipAmount: z.number().int().min(0).optional().default(0),
});

/**
 * Record a (possibly partial) payment against a bill.
 *
 * A bill can be settled in more than one transaction — part cash, part card,
 * or in instalments. The bill becomes `paid` only when the sum of payments
 * reaches the total, and points are minted at that moment and not before.
 *
 * GET lists the payments already recorded against a bill.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePOS(request);
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

  const parsed = paySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "receiptId and a positive amount are required" },
      { status: 400 }
    );
  }

  try {
    const result = await recordPayment({
      receiptId: parsed.data.receiptId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      createdBy: auth.session.name || "cashier",
      tipAmount: parsed.data.tipAmount,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        paidSoFar: result.paidSoFar,
        total: result.total,
        fullyPaid: result.fullyPaid,
        remaining: Math.max(0, result.total - result.paidSoFar),
        pointsEarned: result.pointsEarned,
        pointsBalance: result.pointsBalance,
        tipAmount: result.tipAmount,
      },
      message: result.fullyPaid
        ? "Bill fully paid"
        : `Partial payment recorded — ${Math.max(0, result.total - result.paidSoFar)} remaining`,
    });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    const conflict = /already|void|refunded|not found|positive/i.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: conflict ? 409 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requirePOS(request);
  if (auth instanceof NextResponse) return auth;

  const receiptId = request.nextUrl.searchParams.get("receiptId");
  if (!receiptId) {
    return NextResponse.json(
      { success: false, error: "receiptId is required" },
      { status: 400 }
    );
  }

  try {
    const payments = await listPayments(receiptId);
    const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
    const totalTipped = payments.reduce((s: number, p: any) => s + (p.tip_amount || 0), 0);
    return NextResponse.json({
      success: true,
      data: { payments, totalPaid, totalTipped },
    });
  } catch (e) {
    console.error("payments GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load payments" },
      { status: 500 }
    );
  }
}
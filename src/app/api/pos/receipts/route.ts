import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePOS } from "@/lib/auth";
import { issueTableBill, getDB, payReceipt, voidReceipt } from "@/lib/db";

/**
 * Issue a bill for a table that has already eaten.
 *
 * Creates an UNPAID receipt the waiter hands over. No money moves and no
 * points are minted here — those happen when the bill is marked paid, so a
 * bill that is voided in the meantime costs nothing.
 *
 * A bill can be split equally among N guests (splitCount). Each guest gets
 * their own receipt for their share.
 */
const issueSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().optional(),
  couponCode: z.string().optional(),
  splitCount: z.number().int().min(1).max(10).optional(),
});

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

  const parsed = issueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "orderId is required" },
      { status: 400 }
    );
  }

  try {
    const { receipt, receipts, order } = await issueTableBill({
      orderId: parsed.data.orderId,
      customerId: parsed.data.customerId,
      couponCode: parsed.data.couponCode,
      splitCount: parsed.data.splitCount,
      issuedBy: auth.session.name || "cashier",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: receipt.id,
        receiptNo: receipt.receiptNo,
        tableNumber: receipt.tableNumber,
        orderNumber: receipt.orderNumber,
        customerName: receipt.customerName,
        subtotal: receipt.subtotal,
        discount: receipt.discount,
        couponCode: receipt.couponCode,
        tax: receipt.tax,
        serviceCharge: receipt.serviceCharge,
        total: receipt.total,
        status: receipt.status,
        billedAt: receipt.billedAt,
        items: receipt.items,
        splitCount: parsed.data.splitCount || 1,
        receipts: (receipts || []).map((r: any) => ({
          id: r.id,
          receiptNo: r.receiptNo,
          total: r.total,
          splitIndex: r.splitIndex,
        })),
      },
    });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    const badRequest =
      /already|cancel|settled|required|invalid coupon|not found|nothing to bill/i.test(
        message
      );
    return NextResponse.json(
      { success: false, error: message },
      { status: badRequest ? 409 : 500 }
    );
  }
}

/**
 * Receipts for the cashier to work through, grouped by table.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePOS(request);
  if (auth instanceof NextResponse) return auth;

  const scope = request.nextUrl.searchParams.get("scope") || "unpaid";
  const today = new Date().toISOString().slice(0, 10);

  const COLUMNS = `id, receipt_no, order_id, order_number, customer_name,
              table_number, subtotal, discount, coupon_code, tax,
              service_charge, total, status, payment_method, billed_at,
              paid_at, voided_at, points_earned, created_at`;

  try {
    const db = getDB();
    const rows =
      scope === "today"
        ? await db
            .prepare(
              `SELECT ${COLUMNS} FROM receipts
                WHERE substr(COALESCE(billed_at, created_at), 1, 10) = ?
                ORDER BY COALESCE(billed_at, created_at) DESC`
            )
            .bind(today)
            .all<any>()
        : await db
            .prepare(
              `SELECT ${COLUMNS} FROM receipts
                WHERE status = 'unpaid'
                ORDER BY billed_at ASC`
            )
            .all<any>();

    const receipts = rows.results || [];

    const byTable = new Map<string, any[]>();
    for (const r of receipts) {
      const key = r.table_number != null ? `T${r.table_number}` : "No table";
      if (!byTable.has(key)) byTable.set(key, []);
      byTable.get(key)!.push({
        id: r.id,
        receiptNo: r.receipt_no,
        orderId: r.order_id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        tableNumber: r.table_number,
        subtotal: r.subtotal,
        discount: r.discount || 0,
        couponCode: r.coupon_code,
        tax: r.tax,
        serviceCharge: r.service_charge,
        total: r.total,
        status: r.status,
        paymentMethod: r.payment_method,
        billedAt: r.billed_at,
        paidAt: r.paid_at,
        voidedAt: r.voided_at,
        pointsEarned: r.points_earned || 0,
        raisedAt: r.billed_at || r.created_at,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        scope,
        groups: [...byTable.entries()].map(([table, items]) => ({
          table,
          tableNumber: items[0].tableNumber,
          count: items.length,
          total: items.reduce((s: number, i: any) => s + i.total, 0),
          items,
        })),
        unpaidTotal: receipts
          .filter((r: any) => r.status === "unpaid")
          .reduce((s: number, r: any) => s + r.total, 0),
      },
    });
  } catch (e: any) {
    console.error("pos/receipts GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load receipts" },
      { status: 500 }
    );
  }
}

/**
 * Settle or withdraw a bill the cashier issued.
 */
export async function PATCH(request: NextRequest) {
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

  const schema = z.object({
    receiptId: z.string().min(1),
    status: z.enum(["paid", "void"]),
    paymentMethod: z.enum(["cash", "card", "qr"]).optional(),
    receiptType: z.enum(["e", "physical"]).optional(),
    voidReason: z.string().max(200).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "receiptId and a status of paid or void are required",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { receiptId, status, paymentMethod, receiptType, voidReason } =
    parsed.data;

  try {
    if (status === "void") {
      const voided = await voidReceipt({ receiptId, reason: voidReason });
      return NextResponse.json({
        success: true,
        data: { id: voided.id, status: voided.status },
        message: "Bill void — the table is open again.",
      });
    }

    const { receipt, pointsEarned } = await payReceipt({
      receiptId,
      paymentMethod,
      receiptType,
      createdBy: auth.session.name || "cashier",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: receipt.id,
        receiptNo: receipt.receipt_no,
        status: receipt.status,
        total: receipt.total,
        paymentMethod: receipt.payment_method,
        pointsEarned,
        pointsBalance: receipt.points_balance,
        paidAt: receipt.paid_at,
      },
      receiptUrl: `/receipts/${receipt.id}`,
    });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    const conflict = /already|void|not found|cannot/i.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: conflict ? 409 : 500 }
    );
  }
}
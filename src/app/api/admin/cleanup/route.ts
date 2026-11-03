import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

/**
 * Clean up abandoned orders.
 *
 * Orders that were placed but never settled (payment_status = 'pending') and
 * are older than the threshold are marked cancelled, their kitchen tickets
 * withdrawn, and any unpaid bill voided. This is the manual equivalent of
 * a cron job — run it from the admin dashboard or schedule it externally.
 *
 * Query params:
 *   hours — age threshold in hours (default 24, min 1, max 720)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const hours = Math.max(
    1,
    Math.min(720, parseInt(request.nextUrl.searchParams.get("hours") || "24"))
  );
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    const db = getDB();

    // Find abandoned orders: pending payment, older than the threshold, not
    // already cancelled or completed.
    const { results: abandoned } = await db
      .prepare(
        `SELECT id, order_number, table_number FROM orders
          WHERE payment_status = 'pending'
            AND status NOT IN ('completed', 'cancelled', 'refunded')
            AND created_at < ?`
      )
      .bind(cutoff)
      .all<any>();

    if (!abandoned || abandoned.length === 0) {
      return NextResponse.json({
        success: true,
        data: { cleaned: 0 },
        message: "No abandoned orders found.",
      });
    }

    let cleaned = 0;
    for (const order of abandoned) {
      // Move all dishes to cancelled.
      const { results: items } = await db
        .prepare("SELECT id FROM order_items WHERE order_id = ?")
        .bind(order.id)
        .all<any>();

      if (items && items.length > 0) {
        await db.batch(
          items.map((it: any) =>
            db
              .prepare(
                `UPDATE order_items SET status = 'cancelled',
                        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
                  WHERE id = ?`
              )
              .bind(it.id)
          )
        );
      }

      // Withdraw the kitchen ticket.
      await db
        .prepare(
          `UPDATE kitchen_orders SET status = 'cancelled',
                  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
            WHERE order_id = ?`
        )
        .bind(order.id)
        .run();

      // Void any unpaid bill.
      const unpaidBill = await db
        .prepare(
          `SELECT id FROM receipts WHERE order_id = ? AND status = 'unpaid' LIMIT 1`
        )
        .bind(order.id)
        .first<any>();
      if (unpaidBill) {
        await db
          .prepare(
            `UPDATE receipts SET status = 'void', voided_at = ?,
                    void_reason = 'Abandoned order cleanup'
              WHERE id = ?`
          )
          .bind(new Date().toISOString(), unpaidBill.id)
          .run();
      }

      // Mark the order cancelled.
      await db
        .prepare(
          `UPDATE orders SET status = 'cancelled', payment_status = 'cancelled',
                  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
            WHERE id = ?`
        )
        .bind(order.id)
        .run();

      // Free the table.
      if (order.table_number) {
        await db
          .prepare("UPDATE tables SET status = 'available' WHERE number = ?")
          .bind(order.table_number)
          .run();
      }

      cleaned++;
    }

    return NextResponse.json({
      success: true,
      data: { cleaned, hours, cutoff },
      message: `Cleaned ${cleaned} abandoned order${cleaned === 1 ? "" : "s"} older than ${hours} hours.`,
    });
  } catch (e) {
    console.error("admin/cleanup error:", e);
    return NextResponse.json(
      { success: false, error: "Could not clean up abandoned orders" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { requirePOS } from "@/lib/auth";
import { getDB } from "@/lib/db";

/**
 * Open table tabs, for the "settle a table" panel.
 *
 * Lists the unpaid orders a waiter opened, with the dish lines needed to show
 * the guest what they are being charged for. Amounts come from the stored
 * order, not recomputed here — the bill the guest was quoted must be the bill
 * they are shown.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePOS(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = getDB();
    const { results: orders } = await db
      .prepare(
        `SELECT o.id, o.order_number, o.table_number, o.subtotal, o.tax,
                o.service_charge, o.total, o.user_id, o.created_at,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
           FROM orders o
          WHERE o.payment_status = 'pending'
            AND o.table_number IS NOT NULL
            AND o.status NOT IN ('completed', 'cancelled')
          ORDER BY o.created_at ASC`
      )
      .all<any>();

    const tables = [];
    for (const o of orders || []) {
      const { results: items } = await db
        .prepare(
          `SELECT id, name, quantity, price, special_instructions
             FROM order_items WHERE order_id = ? ORDER BY created_at ASC`
        )
        .bind(o.id)
        .all<any>();

      tables.push({
        orderId: o.id,
        orderNumber: o.order_number,
        tableNumber: o.table_number,
        subtotal: o.subtotal,
        tax: o.tax,
        serviceCharge: o.service_charge,
        total: o.total,
        itemCount: o.item_count,
        // Already attached to an account — the cashier should know before
        // settling, or they may credit the wrong guest.
        hasAccount: Boolean(o.user_id),
        openedAt: o.created_at,
        items: (items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          specialInstructions: i.special_instructions || "",
        })),
      });
    }

    return NextResponse.json({ success: true, data: tables });
  } catch (e: any) {
    console.error("pos/tables error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load open tables" },
      { status: 500 }
    );
  }
}
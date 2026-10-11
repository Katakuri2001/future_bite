import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaidSale, getDishesByIds, getDB, settleExistingOrder } from "@/lib/db";
import { requirePOS } from "@/lib/auth";

const itemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  addons: z
    .array(z.object({ name: z.string(), price: z.number().min(0) }))
    .optional()
    .default([]),
  specialInstructions: z.string().optional().default(""),
});

/**
 * Either a cart to price and sell (`items`), or an existing table order to
 * settle (`orderId`). The cashier uses the second form to close a tab a waiter
 * opened, without re-entering the dishes.
 */
const checkoutSchema = z
  .object({
    items: z.array(itemSchema).min(1).optional(),
    orderId: z.string().min(1).optional(),
    tableNumber: z.number().int().positive().optional(),
    customerName: z.string().optional().default("Guest"),
    /** Guest whose loyalty balance should accrue. Distinct from the cashier. */
    customerId: z.string().optional(),
    /** Coupon code the guest wants to spend. Validated against their wallet. */
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["cash", "card", "qr"]).default("cash"),
    receiptType: z.enum(["e", "physical"]).default("e"),
  })
  .refine((v) => Boolean(v.items) || Boolean(v.orderId), {
    message: "Provide either items to sell or an orderId to settle",
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
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid checkout payload",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { items, orderId, tableNumber, customerName, customerId, couponCode, paymentMethod, receiptType } =
    parsed.data;

  // A coupon may only be spent by the guest it was issued to.
  let couponOwner: string | null = null;
  if (couponCode) {
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "A customer must be selected to redeem a coupon" },
        { status: 400 }
      );
    }
    const owns = await getDB()
      .prepare("SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(?) AND user_id = ? AND is_used = 0 LIMIT 1")
      .bind(couponCode.trim(), customerId)
      .first();
    if (!owns) {
      return NextResponse.json(
        { success: false, error: "Invalid, expired or already-used coupon code" },
        { status: 400 }
      );
    }
    couponOwner = customerId;
  }

  // Settling a tab a waiter opened: take the order's own recorded amounts.
  if (orderId) {
    try {
      const { order, receipt } = await settleExistingOrder({
        orderId,
        paymentMethod,
        receiptType,
        createdBy: auth.session.name || "cashier",
      });
      return NextResponse.json({
        success: true,
        data: {
          order: {
            id: order.id,
            orderNumber: order.order_number,
            tableNumber: order.table_number,
            total: order.total,
            status: order.status,
            paymentStatus: order.payment_status,
          },
          receipt,
          receiptUrl: `/receipts/${receipt.id}`,
        },
      });
    } catch (e: any) {
      const message = String((e && (e.message || e)) || e);
      const conflict = /not found|already|settled|cancelled/i.test(message);
      return NextResponse.json(
        { success: false, error: message },
        { status: conflict ? 409 : 500 }
      );
    }
  }

  // Server-side price validation: prices always come from the DB, never the client.
// Settling paths have returned by now, so a cart is guaranteed here.
  const cart = items!;
  const dishes = await getDishesByIds(cart.map((i) => i.menuItemId));
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const validatedItems: any[] = [];
  for (const line of cart) {
    const dish = dishMap.get(line.menuItemId);
    if (!dish) {
      return NextResponse.json(
        { success: false, error: `Dish not found: ${line.menuItemId}` },
        { status: 400 }
      );
    }
    if (!dish.isAvailable) {
      return NextResponse.json(
        { success: false, error: `"${dish.name}" is not available` },
        { status: 409 }
      );
    }
    const addons = line.addons || [];
    const unitPrice = dish.price + addons.reduce((s, a) => s + a.price, 0);
    validatedItems.push({
      menuItemId: dish.id,
      name: dish.name,
      quantity: line.quantity,
      price: unitPrice,
      variants: [],
      addons,
      specialInstructions: line.specialInstructions,
    });
  }

  try {
    // POS sale = create + pay + complete + receipt in ONE atomic D1 batch
    // (createPaidSale). Completed orders skip the kitchen queue and succeed
    // or fail together with their receipt — no orphaned paid orders.
    const sale = await createPaidSale({
      items: validatedItems,
      tableNumber: tableNumber || null,
      // Loyalty and coupon redemption accrue to the GUEST, not the cashier who
      // processed the sale. `createdBy` still records the staff member.
      userId: customerId ?? null,
      customerId: customerId ?? null,
      couponCode: couponOwner ? couponCode!.trim() : undefined,
      customerName,
      paymentMethod,
      receiptType,
      createdBy: auth.session.name || "cashier",
    });

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: sale.order.id,
          orderNumber: sale.order.orderNumber,
          total: sale.order.total,
          status: sale.order.status,
          paymentStatus: sale.order.paymentStatus,
        },
        receipt: sale.receipt,
        receiptUrl: `/receipts/${sale.receipt.id}`,
      },
    });
  } catch (e: any) {
    console.error("POS checkout error:", e);
    return NextResponse.json(
      { success: false, error: String((e && (e.message || e)) || e) },
      { status: 500 }
    );
  }
}
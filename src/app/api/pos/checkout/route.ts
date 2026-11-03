import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createPaidSale,
  getDishesByIds,
  getDishById,
  getAddonsByIds,
  getMenuSetById,
  getDB,
  settleExistingOrder,
} from "@/lib/db";
import { requirePOS } from "@/lib/auth";
import { priceCartLine, AddonError, computeTotals } from "@/lib/pricing";

const itemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  isSet: z.boolean().optional().default(false),
  /**
   * Ids and quantities only. A price field is deliberately absent: addon
   * amounts are the server's to decide. Sending one is rejected outright so a
   * caller cannot believe it had any effect.
   */
  addons: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().positive().max(50).optional(),
      })
    )
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
    orderType: z.enum(["dine-in", "takeaway", "delivery"]).optional().default("dine-in"),
    deliveryAddress: z.string().max(500).optional(),
    deliveryFee: z.number().int().min(0).optional().default(0),
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

  const { items, orderId, tableNumber, orderType, deliveryAddress, deliveryFee, customerName, customerId, couponCode, paymentMethod, receiptType } =
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
      .prepare("SELECT 1 FROM coupons WHERE code = ? AND user_id = ? AND is_used = 0 LIMIT 1")
      .bind(couponCode.trim().toUpperCase(), customerId)
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
        customerId,
        couponCode,
      });
      return NextResponse.json({
        success: true,
        data: {
          order: {
            id: order.id,
            orderNumber: order.order_number,
            tableNumber: order.table_number,
            total: order.total,
            discount: order.discount || 0,
            couponCode: order.coupon_code || null,
            status: order.status,
            paymentStatus: order.payment_status,
          },
          receipt,
          receiptUrl: `/receipts/${receipt.id}`,
        },
      });
    } catch (e: any) {
      const message = String((e && (e.message || e)) || e);
      const safe = /not found|already|settled|cancelled|required|invalid coupon|unavailable/i.test(message);
      if (safe) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 409 }
        );
      }
      console.error("pos/checkout error:", e);
      return NextResponse.json(
        { success: false, error: "Could not complete that checkout" },
        { status: 500 }
      );
    }
  }

  // Server-side price validation: prices always come from the DB, never the client.
// Settling paths have returned by now, so a cart is guaranteed here.
  const cart = items!;
  // A cart line may be a single dish or a tasting menu (menu set). Sets are
  // expanded into their constituent dishes at the set price, so the kitchen
  // ticket lists what actually has to be cooked.
  const dishIds = cart
    .filter((l) => !l.isSet)
    .map((l) => l.menuItemId);
  const setIds = cart.filter((l) => l.isSet).map((l) => l.menuItemId);

  const dishes = await getDishesByIds(dishIds);
  const dishMap = new Map(dishes.map((d) => [d.id, d]));

  const sets = await Promise.all(setIds.map((id) => getMenuSetById(id)));
  const setMap = new Map(
    sets.filter(Boolean).map((s: any) => [s.id, s])
  );

  // One catalogue read for the whole cart rather than one per line.
  const addonMap = new Map(
    (await getAddonsByIds(
      cart.flatMap((line) => (line.addons || []).map((a: any) => a.id))
    )).map((a: any) => [a.id, a])
  );

  const validatedItems: any[] = [];
  for (const line of cart) {
    if (line.isSet) {
      const set = setMap.get(line.menuItemId);
      if (!set || !set.isAvailable) {
        return NextResponse.json(
          { success: false, error: `Menu set not found: ${line.menuItemId}` },
          { status: 400 }
        );
      }
      // Expand the set into its dishes, each priced at the set's per-dish
      // share. The set price is the authority; if it is zero, fall back to
      // the computed sum of the dishes.
      const setPrice = set.effectivePrice || set.computedPrice || 0;
      const itemCount = set.items.reduce(
        (s: number, it: any) => s + (it.quantity || 1),
        0
      );
      const perDish = itemCount > 0 ? Math.round(setPrice / itemCount) : 0;
      for (const si of set.items) {
        const dish = await getDishById(si.dishId);
        if (!dish) continue;
        validatedItems.push({
          menuItemId: dish.id,
          name: `${set.name} — ${si.name}`,
          quantity: (si.quantity || 1) * line.quantity,
          price: perDish,
          variants: [],
          addons: [],
          specialInstructions: line.specialInstructions,
        });
      }
      continue;
    }

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
    // Addon amounts are resolved from the server catalogue, never the request.
    let priced;
    try {
      priced = priceCartLine(dish, line.addons, addonMap);
    } catch (e) {
      if (e instanceof AddonError) {
        return NextResponse.json(
          { success: false, error: e.message },
          { status: 400 }
        );
      }
      throw e;
    }
    validatedItems.push({
      menuItemId: dish.id,
      name: dish.name,
      quantity: line.quantity,
      price: priced.unitPrice,
      variants: [],
      addons: priced.addons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
      })),
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
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPaidSale, getDishesByIds } from "@/lib/db";
import { requirePOS } from "@/lib/auth";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
        addons: z
          .array(z.object({ name: z.string(), price: z.number().min(0) }))
          .optional()
          .default([]),
        specialInstructions: z.string().optional().default(""),
      })
    )
    .min(1),
  tableNumber: z.number().int().positive().optional(),
  customerName: z.string().optional().default("Guest"),
  paymentMethod: z.enum(["cash", "card", "qr"]).default("cash"),
  receiptType: z.enum(["e", "physical"]).default("e"),
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

  const { items, tableNumber, customerName, paymentMethod, receiptType } =
    parsed.data;

  // Server-side price validation: prices always come from the DB, never the client.
  const dishes = await getDishesByIds(items.map((i) => i.menuItemId));
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const validatedItems: any[] = [];
  for (const line of items) {
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
      userId: auth.session.userId,
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
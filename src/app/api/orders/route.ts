import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, listOrders, getDishesByIds } from "@/lib/db";
import { requireSession, requireStaff } from "@/lib/auth";

/**
 * Customer order submission.
 *
 * The client sends only dish ids and quantities. Names, prices and availability
 * are always resolved from the database — a client-supplied price is ignored so
 * totals cannot be tampered with.
 */
const orderSchema = z.object({
  tableNumber: z.number().int().positive().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive().max(50),
        specialInstructions: z.string().max(500).optional().default(""),
      })
    )
    .min(1)
    .max(50),
  specialInstructions: z.string().max(500).optional().default(""),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
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

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid order payload",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { tableNumber, items, specialInstructions } = parsed.data;

  try {
    // Resolve authoritative dish data. Client prices are never trusted.
    const dishes = await getDishesByIds(items.map((i) => i.menuItemId));
    const byId = new Map(dishes.map((d) => [d.id, d]));

    const validatedItems: any[] = [];
    for (const line of items) {
      const dish = byId.get(line.menuItemId);
      if (!dish) {
        return NextResponse.json(
          { success: false, error: `Dish not found: ${line.menuItemId}` },
          { status: 400 }
        );
      }
      if (!dish.isAvailable) {
        return NextResponse.json(
          { success: false, error: `"${dish.name}" is currently unavailable` },
          { status: 409 }
        );
      }
      validatedItems.push({
        menuItemId: dish.id,
        name: dish.name,
        quantity: line.quantity,
        price: dish.price,
        variants: [],
        addons: [],
        specialInstructions: line.specialInstructions,
      });
    }

    const order = await createOrder({
      tableNumber: tableNumber ?? null,
      items: validatedItems,
      specialInstructions,
      // Attribute the order to the signed-in customer so it appears in their
      // account history and loyalty ledger.
      userId: auth.session.userId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items.map((i: any) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    });
  } catch (e: any) {
    console.error("orders POST error:", e);
    return NextResponse.json(
      { success: false, error: String((e && (e.message || e)) || e) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  const orders = await listOrders();

  return NextResponse.json({ success: true, data: orders });
}
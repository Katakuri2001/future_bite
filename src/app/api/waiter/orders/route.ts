import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWaiter } from "@/lib/auth";
import { takeTableOrder } from "@/lib/waiter";

/**
 * Take a table order, or add dishes to the table's open bill.
 *
 * Ids and quantities only — prices are always resolved from the database, so a
 * caller cannot dictate what a dish costs.
 */
const orderSchema = z.object({
  tableNumber: z.number().int().positive(),
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
});

export async function POST(request: NextRequest) {
  const auth = await requireWaiter(request);
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
        error: "Invalid order",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const result = await takeTableOrder({
      tableNumber: parsed.data.tableNumber,
      items: parsed.data.items,
      waiterId: auth.session.userId,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    const message = String((e && (e.message || e)) || e);
    // A dish that vanished or sold out is the caller's problem, not a 500.
    const badInput =
      message.startsWith("Dish not found") || message.includes("unavailable");
    return NextResponse.json(
      { success: false, error: message },
      { status: badInput ? 409 : 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  variants: z.array(z.string()).optional(),
  addons: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
  specialInstructions: z.string().optional(),
});

const orderSchema = z.object({
  tableId: z.string(),
  items: z.array(orderItemSchema).min(1),
  specialInstructions: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = orderSchema.parse(body);

    // Calculate totals server-side (never trust client prices)
    const subtotal = validated.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const serviceCharge = Math.round(subtotal * 0.05); // 5% service
    const total = subtotal + tax + serviceCharge;

    const orderNumber = `#${1000 + Math.floor(Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      data: {
        id: `ord-${Date.now()}`,
        orderNumber,
        ...validated,
        subtotal,
        tax,
        serviceCharge,
        total,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // In production: fetch orders from database
  return NextResponse.json({
    success: true,
    data: [],
  });
}

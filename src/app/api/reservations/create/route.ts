import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reservationSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  partySize: z.number().min(1).max(20),
  experience: z.enum(["window", "bar", "private", "main"]),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  specialRequests: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = reservationSchema.parse(body);

    // Generate confirmation code
    const confirmationCode = `FB-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 9999)
    ).padStart(4, "0")}`;

    // In production: validate table availability, create reservation in DB
    // For now, return a mock response

    return NextResponse.json({
      success: true,
      data: {
        id: `res-${Date.now()}`,
        confirmationCode,
        ...validated,
        status: "confirmed",
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

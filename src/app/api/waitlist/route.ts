import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { joinWaitlist, listWaitlist } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

const joinSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
  partySize: z.number().int().min(1).max(50),
  preferredTime: z.string().max(20).optional(),
  experience: z.enum(["standard", "premium", "vip"]).optional(),
});

/**
 * Join the waitlist — public, no auth.
 *
 * A guest who arrives to a full restaurant should not be turned away; they
 * leave a name and party size and are seated when something opens up.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Name and party size are required" },
      { status: 400 }
    );
  }

  try {
    const entry = await joinWaitlist(parsed.data);
    return NextResponse.json({
      success: true,
      data: {
        id: entry.id,
        name: entry.name,
        partySize: entry.party_size,
        status: entry.status,
      },
      message: "You are on the waitlist. We will seat you as soon as a table opens.",
    });
  } catch (e) {
    console.error("waitlist POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not join the waitlist" },
      { status: 500 }
    );
  }
}

/**
 * List the waitlist — staff only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status") || undefined;
  try {
    const data = await listWaitlist(status);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("waitlist GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load the waitlist" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getDB } from "@/lib/db";

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(1000),
  dishId: z.string().optional(),
});

/**
 * Submit a review.
 *
 * A review lands as `is_public = 0` and waits for moderation. The guest's
 * name is taken from their session so it cannot be forged, and only signed-in
 * customers may review — anonymous praise is indistinguishable from a sock
 * puppet.
 */
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

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Rating 1–5 and a review text are required" },
      { status: 400 }
    );
  }

  const user = await getDB()
    .prepare("SELECT id, name FROM users WHERE id = ?")
    .bind(auth.session.userId)
    .first<any>();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await getDB()
    .prepare(
      `INSERT INTO ratings (id, branch_id, user_id, name, rating, text, is_public)
       VALUES (?, 'default-branch', ?, ?, ?, ?, 0)`
    )
    .bind(id, user.id, user.name, parsed.data.rating, parsed.data.text)
    .run();

  return NextResponse.json({
    success: true,
    data: { id, status: "pending" },
    message: "Thank you — your review is awaiting moderation.",
  });
}

/**
 * Public, approved reviews. No auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const { results } = await getDB()
      .prepare(
        `SELECT id, name, rating, text, created_at
           FROM ratings
          WHERE is_public = 1
          ORDER BY created_at DESC
          LIMIT 50`
      )
      .all<any>();

    return NextResponse.json({
      success: true,
      data: (results || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    console.error("reviews GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load reviews" },
      { status: 500 }
    );
  }
}
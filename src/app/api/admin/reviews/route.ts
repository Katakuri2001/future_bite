import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { results } = await getDB()
      .prepare(
        `SELECT id, user_id, name, rating, text, is_public, created_at
           FROM ratings
          ORDER BY created_at DESC
          LIMIT 100`
      )
      .all<any>();

    return NextResponse.json({
      success: true,
      data: (results || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        isPublic: r.is_public === 1,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    console.error("admin/reviews GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load reviews" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
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

  const id = (body as any)?.id;
  const isPublic = (body as any)?.isPublic;
  if (!id || typeof isPublic !== "boolean") {
    return NextResponse.json(
      { success: false, error: "id and isPublic (boolean) are required" },
      { status: 400 }
    );
  }

  try {
    await getDB()
      .prepare("UPDATE ratings SET is_public = ? WHERE id = ?")
      .bind(isPublic ? 1 : 0, id)
      .run();
    return NextResponse.json({
      success: true,
      message: isPublic ? "Review published" : "Review hidden",
    });
  } catch (e) {
    console.error("admin/reviews PATCH error:", e);
    return NextResponse.json(
      { success: false, error: "Could not update that review" },
      { status: 500 }
    );
  }
}
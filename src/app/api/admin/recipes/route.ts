import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRecipe, setRecipe, getDishById } from "@/lib/db";

const recipeSchema = z.object({
  supplies: z.array(
    z.object({
      supplyId: z.string().min(1),
      quantity: z.number().positive(),
    })
  ),
});

/**
 * Manage a dish's recipe — which supplies it consumes and how much.
 *
 * GET  — list the supplies linked to a dish (with current stock).
 * PUT  — replace the recipe. An empty array removes all links, which means
 *        the dish no longer decrements stock on sale.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const dishId = request.nextUrl.searchParams.get("dishId");
  if (!dishId) {
    return NextResponse.json(
      { success: false, error: "dishId is required" },
      { status: 400 }
    );
  }

  try {
    const recipe = await getRecipe(dishId);
    return NextResponse.json({ success: true, data: recipe });
  } catch (e) {
    console.error("recipes GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load that recipe" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

  const dishId = (body as any)?.dishId;
  if (!dishId) {
    return NextResponse.json(
      { success: false, error: "dishId is required" },
      { status: 400 }
    );
  }

  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "supplies must be an array of {supplyId, quantity}" },
      { status: 400 }
    );
  }

  try {
    await setRecipe(dishId, parsed.data.supplies);
    const recipe = await getRecipe(dishId);
    return NextResponse.json({ success: true, data: recipe });
  } catch (e) {
    console.error("recipes PUT error:", e);
    return NextResponse.json(
      { success: false, error: "Could not save that recipe" },
      { status: 500 }
    );
  }
}
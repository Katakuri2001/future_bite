import { NextResponse } from "next/server";
import { listDishes, listCategories } from "@/lib/db";

export async function GET() {
  const [categories, items] = await Promise.all([listCategories(), listDishes()]);

  return NextResponse.json({ categories, items });
}
import { NextResponse } from "next/server";
import { menuItems, menuCategories } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    categories: menuCategories,
    items: menuItems,
  });
}

import { NextResponse } from "next/server";
import { listDishes } from "@/lib/db";

export async function GET() {
  const categories = [
    { id: "cat-1", name: "Starters", slug: "starters", description: "Begin your journey", displayOrder: 1 },
    { id: "cat-2", name: "Mains", slug: "mains", description: "The heart of the experience", displayOrder: 2 },
    { id: "cat-3", name: "Chef's Selection", slug: "chefs-selection", description: "Curated by our kitchen", displayOrder: 3 },
    { id: "cat-4", name: "Desserts", slug: "desserts", description: "A sweet conclusion", displayOrder: 4 },
    { id: "cat-5", name: "Drinks", slug: "drinks", description: "Crafted beverages", displayOrder: 5 },
  ];

  const items = await listDishes();

  return NextResponse.json({ categories, items });
}
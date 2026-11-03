import { NextResponse } from "next/server";
import { listDishes, listCategories, listMenuSets } from "@/lib/db";

export async function GET() {
  const [categories, items, sets] = await Promise.all([
    listCategories(),
    listDishes(),
    listMenuSets(),
  ]);

  // Menu sets are surfaced as purchasable items alongside dishes, so a guest
  // can buy a tasting menu the same way they buy a single plate. The set's
  // effective price is the override if one was set, otherwise the sum of its
  // dishes. Unavailable sets are hidden.
  const setItems = (sets || [])
    .filter((s: any) => s.isAvailable)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      price: s.effectivePrice,
      category: "Tasting Menus",
      categorySlug: "tasting-menus",
      imageUrl: s.imageUrl,
      dietary: [],
      allergens: [],
      isAvailable: s.isAvailable,
      isSet: true,
      setItems: s.items,
    }));

  return NextResponse.json({
    categories: [...categories, { id: "cat-sets", name: "Tasting Menus", slug: "tasting-menus" }],
    items: [...items, ...setItems],
  });
}
import type { Metadata } from "next";
import KitchenLayout from "@/components/kitchen/KitchenLayout";
import KitchenIngredients from "@/components/kitchen/KitchenIngredients";

export const metadata: Metadata = {
  title: "Kitchen — Ingredients",
  description: "Ingredient stock register and transactions",
};

export default function KitchenIngredientsPage() {
  return (
    <KitchenLayout>
      <KitchenIngredients />
    </KitchenLayout>
  );
}
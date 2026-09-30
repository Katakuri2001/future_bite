import type { Metadata } from "next";
import KitchenLayout from "@/components/kitchen/KitchenLayout";
import KitchenMenu from "@/components/kitchen/KitchenMenu";

export const metadata: Metadata = {
  title: "Kitchen — Menu",
  description: "Add and manage menu dishes from the kitchen",
};

export default function KitchenMenuPage() {
  return (
    <KitchenLayout>
      <KitchenMenu />
    </KitchenLayout>
  );
}
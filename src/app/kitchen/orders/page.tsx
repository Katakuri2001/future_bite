import type { Metadata } from "next";
import KitchenLayout from "@/components/kitchen/KitchenLayout";
import KitchenBoard from "@/components/kitchen/KitchenBoard";

export const metadata: Metadata = {
  title: "Kitchen Display — Orders",
  description: "Kitchen order management system",
};

export default function KitchenOrdersPage() {
  return (
    <KitchenLayout>
      <KitchenBoard />
    </KitchenLayout>
  );
}
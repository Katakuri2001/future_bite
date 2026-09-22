import type { Metadata } from "next";
import KitchenTabs from "@/components/kitchen/KitchenTabs";

export const metadata: Metadata = {
  title: "Kitchen Display",
  description: "Kitchen order management system",
};

export default function KitchenPage() {
  return <KitchenTabs />;
}
import type { Metadata } from "next";
import KitchenBoard from "@/components/kitchen/KitchenBoard";

export const metadata: Metadata = {
  title: "Kitchen Display",
  description: "Kitchen order management system",
};

export default function KitchenPage() {
  return <KitchenBoard />;
}

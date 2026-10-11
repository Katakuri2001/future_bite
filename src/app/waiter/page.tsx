import type { Metadata } from "next";
import WaiterDashboard from "@/components/waiter/WaiterDashboard";

export const metadata: Metadata = {
  title: "Waiter Station",
  description: "Take table orders, run dishes, track service times.",
};

export default function WaiterPage() {
  return <WaiterDashboard />;
}
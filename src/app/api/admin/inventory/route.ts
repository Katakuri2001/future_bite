import { NextRequest, NextResponse } from "next/server";

let inventory = [
  { id: "inv-1", name: "Wagyu Beef A5", unit: "kg", currentStock: 4.5, minimumStock: 2, cost: 180, supplier: "Premium Meats Co.", status: "healthy" as const },
  { id: "inv-2", name: "Black Winter Truffle", unit: "g", currentStock: 120, minimumStock: 50, cost: 8.5, supplier: "Truffle House", status: "healthy" as const },
  { id: "inv-3", name: "Maine Lobster", unit: "pcs", currentStock: 8, minimumStock: 5, cost: 45, supplier: "Ocean Fresh", status: "low" as const },
  { id: "inv-4", name: "Valrhona Dark Chocolate", unit: "kg", currentStock: 2.1, minimumStock: 1, cost: 35, supplier: "Choco Artisans", status: "healthy" as const },
  { id: "inv-5", name: "Champagne (Moët)", unit: "btl", currentStock: 3, minimumStock: 6, cost: 55, supplier: "Fine Wines Ltd.", status: "critical" as const },
  { id: "inv-6", name: "Carnaroli Rice", unit: "kg", currentStock: 5.8, minimumStock: 3, cost: 12, supplier: "Italian Imports", status: "healthy" as const },
  { id: "inv-7", name: "Yuzu Juice", unit: "L", currentStock: 0.8, minimumStock: 1, cost: 28, supplier: "Asian Ingredients", status: "critical" as const },
];

export async function GET() {
  return NextResponse.json({ success: true, data: inventory });
}

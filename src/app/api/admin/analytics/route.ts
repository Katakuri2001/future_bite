import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const stats = {
    todayReservations: 12,
    todayOrders: 47,
    currentCovers: 28,
    kitchenQueue: 3,
    revenue: 2850000,
    averageOrderValue: 60600,
    occupancy: 78,
    popularDishes: [
      { name: "Wagyu A5 Omakase", orders: 18 },
      { name: "Truffle Risotto Cosmos", orders: 15 },
      { name: "Black Cod Stellaris", orders: 12 },
      { name: "Nebula Tartare", orders: 10 },
      { name: "Chocolate Eclipse", orders: 9 },
    ],
    weeklyRevenue: [
      { day: "Mon", revenue: 1850000 },
      { day: "Tue", revenue: 2100000 },
      { day: "Wed", revenue: 1950000 },
      { day: "Thu", revenue: 2300000 },
      { day: "Fri", revenue: 2850000 },
      { day: "Sat", revenue: 3200000 },
      { day: "Sun", revenue: 2400000 },
    ],
  };

  return NextResponse.json({ success: true, data: stats });
}

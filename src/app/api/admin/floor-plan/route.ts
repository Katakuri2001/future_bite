import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const floorPlanTables = [
    { id: "tbl-1", number: 1, capacity: 2, experience: "window", status: "available", x: 5, y: 10, width: 80, height: 60 },
    { id: "tbl-2", number: 2, capacity: 2, experience: "window", status: "available", x: 15, y: 10, width: 80, height: 60 },
    { id: "tbl-3", number: 3, capacity: 4, experience: "window", status: "reserved", x: 25, y: 10, width: 100, height: 80, currentReservation: { id: "res-001", guestName: "Sarah Chen", partySize: 2, time: "19:30" } },
    { id: "tbl-4", number: 4, capacity: 4, experience: "main", status: "available", x: 40, y: 30, width: 100, height: 80 },
    { id: "tbl-5", number: 5, capacity: 6, experience: "main", status: "available", x: 55, y: 30, width: 120, height: 80 },
    { id: "tbl-6", number: 6, capacity: 8, experience: "main", status: "reserved", x: 70, y: 30, width: 140, height: 80 },
    { id: "tbl-7", number: 7, capacity: 2, experience: "bar", status: "available", x: 10, y: 55, width: 80, height: 60 },
    { id: "tbl-8", number: 8, capacity: 2, experience: "bar", status: "seated", x: 25, y: 55, width: 80, height: 60 },
    { id: "tbl-9", number: 9, capacity: 10, experience: "private", status: "available", x: 80, y: 55, width: 160, height: 100 },
    { id: "tbl-10", number: 10, capacity: 12, experience: "private", status: "reserved", x: 80, y: 70, width: 160, height: 100 },
  ];

  return NextResponse.json({ success: true, data: floorPlanTables });
}

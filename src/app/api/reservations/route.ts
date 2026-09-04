import { NextRequest, NextResponse } from "next/server";
import { tables } from "@/lib/data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const guests = parseInt(searchParams.get("guests") || "2");

  // Filter available tables
  const available = tables.filter(
    (t) => t.status === "available" && t.capacity >= guests
  );

  return NextResponse.json({
    date,
    time,
    guests,
    availableTables: available,
    total: available.length,
  });
}

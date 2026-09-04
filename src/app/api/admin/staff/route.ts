import { NextRequest, NextResponse } from "next/server";

let staff = [
  { id: "staff-1", name: "Alex Kim", email: "alex@futurebite.com", role: "admin", phone: "+95 9 100 100 100", isActive: true, shift: "All Day" },
  { id: "staff-2", name: "Chef Nakamura", email: "chef.nakamura@futurebite.com", role: "kitchen", phone: "+95 9 200 200 200", isActive: true, shift: "Evening" },
  { id: "staff-3", name: "Maya Thompson", email: "maya@futurebite.com", role: "manager", phone: "+95 9 300 300 300", isActive: true, shift: "Evening" },
  { id: "staff-4", name: "Soo-jin Park", email: "soojin@futurebite.com", role: "waiter", phone: "+95 9 400 400 400", isActive: true, shift: "Evening" },
  { id: "staff-5", name: "Daniel Oo", email: "daniel@futurebite.com", role: "host", phone: "+95 9 500 500 500", isActive: true, shift: "Evening" },
  { id: "staff-6", name: "Rachel Lim", email: "rachel@futurebite.com", role: "kitchen", phone: "+95 9 600 600 600", isActive: true, shift: "Evening" },
];

export async function GET() {
  return NextResponse.json({ success: true, data: staff });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newStaff = { id: `staff-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
  staff.push(newStaff);
  return NextResponse.json({ success: true, data: newStaff });
}

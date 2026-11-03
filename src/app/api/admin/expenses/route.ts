import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { listExpenses, createExpense, deleteExpense } from "@/lib/db";

const CATEGORIES = [
  "rent",
  "utilities",
  "payroll",
  "marketing",
  "equipment",
  "maintenance",
  "other",
] as const;

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  amount: z.number().int().positive(),
  description: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Operating expenses that are not inventory: rent, utilities, payroll,
 * marketing, equipment, maintenance. Tracked here so an owner can see what the
 * restaurant actually costs to run, alongside the revenue the POS already
 * records.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const from = request.nextUrl.searchParams.get("from") || undefined;
  const to = request.nextUrl.searchParams.get("to") || undefined;

  try {
    const data = await listExpenses({ from, to });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("admin/expenses GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "category, amount and date are required" },
      { status: 400 }
    );
  }

  try {
    const expense = await createExpense({
      ...parsed.data,
      createdBy: auth.session.name || "admin",
    });
    return NextResponse.json({ success: true, data: expense });
  } catch (e) {
    console.error("admin/expenses POST error:", e);
    return NextResponse.json(
      { success: false, error: "Could not record that expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 }
    );
  }

  try {
    const removed = await deleteExpense(id);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("admin/expenses DELETE error:", e);
    return NextResponse.json(
      { success: false, error: "Could not remove that expense" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

/**
 * Close-of-day (Z) report.
 *
 * Aggregates everything that moved money on a given day: receipts (sales),
 * payments & tips, and expenses. An owner can see what the restaurant took in
 * and what it cost, all from data already recorded.
 *
 * Query param: date=YYYY-MM-DD (defaults to today).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  try {
    const db = getDB();

    // All receipts issued that day.
    const { results: receipts } = await db
      .prepare(
        `SELECT id, receipt_no, total, status
           FROM receipts
          WHERE substr(COALESCE(billed_at, created_at), 1, 10) = ?
          ORDER BY COALESCE(billed_at, created_at)`
      )
      .bind(date)
      .all<any>();

    const paidReceipts = receipts.filter((r) => r.status === "paid");

    // All payments and tips recorded for those receipts.
    const receiptIds = receipts.map((r) => r.id);
    let payments: any[] = [];
    let tips: any[] = [];
    if (receiptIds.length > 0) {
      const placeholders = receiptIds.map(() => "?").join(",");
      const { results: p } = await db
        .prepare(
          `SELECT id, receipt_id, amount, tip_amount, method, created_at
             FROM payments
            WHERE receipt_id IN (${placeholders})
            ORDER BY created_at`
        )
        .bind(...receiptIds)
        .all<any>();
      payments = p || [];
      const { results: t } = await db
        .prepare(
          `SELECT id, receipt_id, amount, created_at
             FROM tips
            WHERE receipt_id IN (${placeholders})
            ORDER BY created_at`
        )
        .bind(...receiptIds)
        .all<any>();
      tips = t || [];
    }

    const totalTips =
      payments.reduce((s: number, p: any) => s + (p.tip_amount || 0), 0) +
      (tips || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);

    const cashPayments = payments.filter((p) => p.method === "cash");
    const cashTotal = cashPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const cashTips = cashPayments.reduce((s: number, p: any) => s + (p.tip_amount || 0), 0);

    // Expenses recorded that day.
    const { results: expenses } = await db
      .prepare(
        `SELECT category, amount FROM expenses WHERE date = ? ORDER BY created_at`
      )
      .bind(date)
      .all<any>();
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const totalSales = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + (e.amount || 0);
    }

    const net = totalSales + totalTips - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        date,
        summary: {
          receipts: receipts.length,
          paidReceipts: paidReceipts.length,
          totalSales,
          totalTips,
          totalExpenses,
          net: net,
        },
        payments: {
          cash: {
            count: cashPayments.length,
            total: cashTotal,
            tips: cashTips,
          },
          card: payments.filter((p) => p.method === "card").reduce(
            (s: number, p: any) => s + (p.amount || 0),
            0
          ),
          qr: payments.filter((p) => p.method === "qr").reduce(
            (s: number, p: any) => s + (p.amount || 0),
            0
          ),
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategory,
        },
      },
    });
  } catch (e) {
    console.error("admin/z-report error:", e);
    return NextResponse.json(
      { success: false, error: "Could not build the Z report" },
      { status: 500 }
    );
  }
}
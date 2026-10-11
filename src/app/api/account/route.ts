import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { listActiveCoupons } from "@/lib/db";

/**
 * Everything the signed-in customer's account page needs, in one round trip.
 * Every query is scoped by the session's userId — a customer can only ever
 * read their own loyalty balance, coupons, orders and reservations.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.session.userId;
  const db = getDB();

  const [profile, coupons, orders, reservations, pointsToNext, events] =
    await Promise.all([
      db
        .prepare(
          `SELECT id, email, name, role, phone, points, total_spent, created_at
           FROM users WHERE id = ?`
        )
        .bind(userId)
        .first<any>(),

      listActiveCoupons(userId),

      db
        .prepare(
          `SELECT id, order_number, table_number, subtotal, discount, tax,
                  service_charge, total, status, payment_status, created_at
           FROM orders WHERE user_id = ?
           ORDER BY created_at DESC LIMIT 20`
        )
        .bind(userId)
        .all<any>(),

      db
        .prepare(
          `SELECT id, confirmation_code, date, time, party_size, table_number,
                  experience, status, created_at
           FROM reservations WHERE LOWER(customer_email) = LOWER(?)
           ORDER BY date DESC LIMIT 20`
        )
        .bind(auth.session.email || "")
        .all<any>(),

      db
        .prepare(
          `SELECT points_earned, coupon_code, reason, created_at
           FROM loyalty_events WHERE user_id = ?
           ORDER BY created_at DESC LIMIT 10`
        )
        .bind(userId)
        .all<any>(),

      db
        .prepare(
          `SELECT COALESCE(SUM(points_earned), 0) AS earned,
                  COALESCE(SUM(points_redeemed), 0) AS redeemed
           FROM loyalty_events WHERE user_id = ?`
        )
        .bind(userId)
        .first<any>(),
    ]);

  const points = profile?.points || 0;
  // 100 points earns a 10,000 K coupon.
  const nextCouponAt = 100;
  const progressToNext = nextCouponAt
    ? Math.min(100, Math.round(((points % nextCouponAt) / nextCouponAt) * 100))
    : 100;

  return NextResponse.json({
    success: true,
    data: {
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            phone: profile.phone,
            points,
            totalSpent: profile.total_spent || 0,
            memberSince: profile.created_at,
          }
        : null,
      coupons: coupons.map((c: any) => ({
        code: c.code,
        amount: c.amount,
        expiresAt: c.expiresAt,
      })),
      orders: (orders.results || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        tableNumber: o.table_number,
        subtotal: o.subtotal,
        discount: o.discount || 0,
        total: o.total,
        status: o.status,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      })),
      reservations: (reservations.results || []).map((r: any) => ({
        id: r.id,
        confirmationCode: r.confirmation_code,
        date: r.date,
        time: r.time,
        partySize: r.party_size,
        tableNumber: r.table_number,
        experience: r.experience,
        status: r.status,
        createdAt: r.created_at,
      })),
      loyalty: {
        points,
        nextCouponAt,
        progressToNext,
        lifetimeEarned: (pointsToNext as any)?.earned || 0,
        lifetimeRedeemed: (pointsToNext as any)?.redeemed || 0,
        events: (events.results || []).map((e: any) => ({
          pointsEarned: e.points_earned,
          couponCode: e.coupon_code,
          reason: e.reason,
          createdAt: e.created_at,
        })),
      },
    },
  });
}
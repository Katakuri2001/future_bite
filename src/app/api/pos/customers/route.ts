import { NextRequest, NextResponse } from "next/server";
import { requirePOS } from "@/lib/auth";
import { getDB, tierForPoints } from "@/lib/db";

/**
 * Search Royal accounts at the till.
 *
 * The cashier types part of a name or email to attach an account to a table
 * bill. Only `role = 'customer'` rows are ever returned: staff must not be
 * attachable as loyalty recipients, and the response carries points balances,
 * so it must not leak other employees' records.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePOS(request);
  if (auth instanceof NextResponse) return auth;

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Escape LIKE wildcards so a guest searching for "100%" doesn't match
  // everything, and cap the result set — this runs on a till, not a report.
  const term = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const now = new Date().toISOString();

  try {
    const { results } = await getDB()
      .prepare(
        `SELECT u.id, u.name, u.email, u.points,
                (SELECT json_group_array(json_object('code', c.code, 'amount', c.amount))
                   FROM coupons c
                  WHERE c.user_id = u.id AND c.is_used = 0
                    AND (c.expires_at IS NULL OR c.expires_at > ?)) AS coupons
           FROM users u
          WHERE u.role = 'customer' AND u.is_active = 1
            AND (u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')
          ORDER BY u.points DESC
          LIMIT 8`
      )
      .bind(now, term, term)
      .all<any>();

    return NextResponse.json({
      success: true,
      data: (results || []).map((u: any) => {
        const coupons: { code: string; amount: number }[] = u.coupons
          ? JSON.parse(u.coupons)
          : [];
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          points: u.points || 0,
          tier: tierForPoints(u.points || 0),
          couponCount: coupons.length,
          // The cashier picks from the guest's actual coupons rather than typing
          // a code they would have to read off a phone. This is the same data
          // the guest sees on their own account page.
          coupons,
        };
      }),
    });
  } catch (e: any) {
    console.error("pos/customers search error:", e);
    return NextResponse.json(
      { success: false, error: "Could not search customers" },
      { status: 500 }
    );
  }
}
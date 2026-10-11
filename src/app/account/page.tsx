"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Gift,
  Award,
  Receipt,
  CalendarDays,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { formatKyat } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  pending: "text-ivory-dim border-ivory-dim/30",
  accepted: "text-blue-400 border-blue-400/30",
  preparing: "text-orange-400 border-orange-400/30",
  plating: "text-orange-400 border-orange-400/30",
  ready: "text-green-400 border-green-400/30",
  served: "text-gold border-gold/30",
  completed: "text-gold border-gold/30",
  cancelled: "text-error border-error/30",
  confirmed: "text-green-400 border-green-400/30",
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const json = await res.json();
        if (json.success) setData(json.data);
        else setError(json.error || "Could not load your account.");
      } catch {
        setError("Connection error. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center gap-3 text-ivory-dim">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm tracking-widest uppercase">Loading account</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={28} className="text-error mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-ivory-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const loyalty = data?.loyalty;
  const coupons: any[] = data?.coupons || [];
  const orders: any[] = data?.orders || [];
  const reservations: any[] = data?.reservations || [];

  return (
    <div className="min-h-screen bg-bg py-16 px-4 pb-24">
      <div className="container-narrow mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-12">
          <div>
            <p className="text-label mb-3">Your Account</p>
            <h1 className="text-display-md text-ivory">{profile?.name}</h1>
            <p className="text-ivory-dim text-sm mt-2">{profile?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-ivory-dim hover:text-error transition-colors text-xs tracking-widest uppercase"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Royal status */}
        <section className="bg-surface border border-border/50 p-6 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <Award size={20} className="text-gold" strokeWidth={1.5} />
            <h2 className="text-display text-lg text-ivory">Royal Points</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-display text-gold tabular-nums">
                {loyalty?.points ?? 0}
              </p>
              <p className="text-ivory-dim text-xs mt-1 tracking-widest uppercase">
                Points balance
              </p>
            </div>
            <div>
              <p className="text-3xl font-display text-ivory tabular-nums">
                {coupons.length}
              </p>
              <p className="text-ivory-dim text-xs mt-1 tracking-widest uppercase">
                Active coupons
              </p>
            </div>
            <div>
              <p className="text-3xl font-display text-ivory tabular-nums">
                {formatKyat(profile?.totalSpent || 0)}
              </p>
              <p className="text-ivory-dim text-xs mt-1 tracking-widest uppercase">
                Lifetime spend
              </p>
            </div>
          </div>

          {/* Progress to next coupon */}
          {loyalty?.points < loyalty?.nextCouponAt && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-ivory-dim mb-2">
                <span>
                  {loyalty?.nextCouponAt - loyalty?.points} points to your next{" "}
                  10,000 K coupon
                </span>
                <span>{loyalty?.points} / {loyalty?.nextCouponAt}</span>
              </div>
              <div className="h-1 bg-border-light overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-500"
                  style={{ width: `${loyalty?.progressToNext ?? 0}%` }}
                />
              </div>
              <p className="text-ivory-dim text-xs mt-3">
                Earn 1 point for every 10,000 K spent. Your points are credited
                once your bill is settled.
              </p>
            </div>
          )}

          {coupons.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/40">
              <p className="text-ivory-dim text-xs tracking-widest uppercase mb-3">
                Your coupons
              </p>
              <div className="flex flex-wrap gap-2">
                {coupons.map((c) => (
                  <span
                    key={c.code}
                    className="inline-flex items-center gap-2 border border-gold/40 bg-gold/5 text-gold px-3 py-1.5 text-xs font-mono"
                  >
                    <Gift size={12} /> {c.code} — {formatKyat(c.amount)}
                  </span>
                ))}
              </div>
              <p className="text-ivory-dim text-xs mt-3">
                Apply a coupon when your bill is settled at the table.
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-gold" strokeWidth={1.5} />
                <h2 className="text-display text-lg text-ivory">Your orders</h2>
              </div>
              <Link
                href="/menu"
                className="text-xs text-ivory-dim hover:text-gold transition-colors inline-flex items-center gap-1"
              >
                Order more <ArrowRight size={12} />
              </Link>
            </div>
            <div className="bg-surface border border-border/50">
              {orders.length === 0 ? (
                <p className="p-8 text-center text-ivory-dim text-sm">
                  No orders yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {orders.map((o) => (
                    <li key={o.id} className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-ivory font-medium text-sm">
                            {o.orderNumber}
                          </span>
                          <p className="text-ivory-dim text-xs mt-1">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-gold text-sm tabular-nums">
                            {formatKyat(o.total)}
                          </span>
                          {o.discount > 0 && (
                            <p className="text-[10px] text-ivory-dim mt-0.5">
                              −{formatKyat(o.discount)} coupon
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                            STATUS_TONE[o.status] || STATUS_TONE.pending
                          }`}
                        >
                          {o.status}
                        </span>
                        <span
                          className={`text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                            o.paymentStatus === "paid"
                              ? "text-green-400 border-green-400/30"
                              : "text-ivory-dim border-ivory-dim/30"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Reservations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-gold" strokeWidth={1.5} />
                <h2 className="text-display text-lg text-ivory">
                  Reservations
                </h2>
              </div>
              <Link
                href="/reserve"
                className="text-xs text-ivory-dim hover:text-gold transition-colors inline-flex items-center gap-1"
              >
                Book a table <ArrowRight size={12} />
              </Link>
            </div>
            <div className="bg-surface border border-border/50">
              {reservations.length === 0 ? (
                <p className="p-8 text-center text-ivory-dim text-sm">
                  No reservations found. Book using the same email as your
                  account.
                </p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {reservations.map((r) => (
                    <li key={r.id} className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-ivory font-medium text-sm">
                            {r.confirmationCode}
                          </span>
                          <p className="text-ivory-dim text-xs mt-1">
                            {r.date} · {r.time} · {r.partySize} guest
                            {r.partySize === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                            STATUS_TONE[r.status] || "text-ivory-dim border-ivory-dim/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Loyalty history */}
        {loyalty?.events?.length > 0 && (
          <section className="mt-8">
            <h2 className="text-display text-lg text-ivory mb-4">
              Points activity
            </h2>
            <div className="bg-surface border border-border/50">
              <ul className="divide-y divide-border/30">
                {loyalty.events.map((e: any, idx: number) => (
                  <li
                    key={idx}
                    className="p-4 flex justify-between items-center gap-3"
                  >
                    <div>
                      <p className="text-ivory text-sm">{e.reason}</p>
                      <p className="text-ivory-dim text-xs mt-0.5">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-sm tabular-nums ${
                        e.pointsEarned > 0 ? "text-gold" : "text-ivory-dim"
                      }`}
                    >
                      {e.pointsEarned > 0 ? `+${e.pointsEarned}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
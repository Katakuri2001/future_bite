"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRealtime } from "@/lib/useRealtime";
import type { UserRole } from "@/lib/db";

/**
 * Waiter shell: a single workspace plus the floor strip, rather than a
 * multi-page admin sidebar. A waiter runs one screen all evening, so the
 * navigation is one item and the space belongs to the floor.
 */
export default function WaiterLayout({
  children,
  onRefresh,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.data?.user) {
          setName(data.data.user.name || "");
          setRole(data.data.user.role);
          setAuthorized(true);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch {
        if (!cancelled) router.push("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Kitchen changes should appear without the waiter refreshing by hand.
  useRealtime(() => {
    if (onRefresh) onRefresh();
  });

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/future_bite_logo.jpeg"
              alt="FutureBite"
              width={96}
              height={52}
              className="h-8 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold">
                Floor Service
              </p>
              <p className="text-xs text-ivory-dim">Waiter station</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-ivory-dim">
              <User size={14} />
              <span className="text-sm text-ivory">{name}</span>
              {role && (
                <span className="text-[10px] tracking-[0.15em] uppercase text-gold">
                  {role}
                </span>
              )}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-ivory-dim hover:text-error transition-colors text-xs tracking-[0.15em] uppercase"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
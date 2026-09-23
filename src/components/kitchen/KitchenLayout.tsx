"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KitchenSidebar from "@/components/kitchen/KitchenSidebar";
import { Menu } from "lucide-react";
import type { UserRole } from "@/lib/db";

const ALLOWED_ROLES: UserRole[] = ["kitchen", "admin", "manager"];

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
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
          const userRole = data.data.user.role as UserRole;
          if (!ALLOWED_ROLES.includes(userRole)) {
            router.push("/");
            return;
          }
          setRole(userRole);
          setAuthorized(true);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <KitchenSidebar
        role={role}
        onNavigate={() => setSidebarOpen(false)}
        className={sidebarOpen ? "fixed inset-y-0 left-0 z-50 lg:hidden" : "hidden lg:flex flex-shrink-0"}
      />

      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border/50 rounded-lg text-ivory hover:text-gold transition-colors glass"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        aria-expanded={sidebarOpen}
      >
        <Menu size={20} />
      </button>

      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useSidebarCollapsed } from "@/lib/useSidebarCollapsed";
import { Menu, X } from "lucide-react";
import type { UserRole } from "@/lib/db";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, toggleCollapsed] = useSidebarCollapsed();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    // Verify the server-side session and fetch the real role (the httpOnly
    // cookie is sent automatically). Previously this only checked that a
    // token existed in localStorage.
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.data?.user) {
          setRole(data.data.user.role);
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

  // Close the mobile drawer when the route changes. Adjusting state during
  // render is the recommended alternative to a setState-in-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (sidebarOpen) setSidebarOpen(false);
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        role={role}
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        onNavigate={() => setSidebarOpen(false)}
        className={cn(
          "z-50 lg:relative flex-shrink-0",
          sidebarOpen && "lg:hidden fixed inset-y-0 left-0 animate-slide-in-left"
        )}
      />

      {/* Mobile menu toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border/50 rounded-lg text-ivory hover:text-gold transition-colors glass"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        aria-expanded={sidebarOpen}
      >
        <Menu size={20} />
      </button>

      <main className={cn(
        "flex-1 min-w-0 overflow-auto transition-all duration-300 ease-in-out lg:transition-none",
        isCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        <div className="p-4 lg:p-6">
          {/* Mobile close button inside sidebar area */}
          <div className="lg:hidden mb-4 flex justify-end">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 bg-surface border border-border/50 rounded-lg text-ivory hover:text-gold transition-colors glass"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
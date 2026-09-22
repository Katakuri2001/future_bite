"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      queueMicrotask(() => setAuthorized(true));
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, [mounted]);

  // Listen for sidebar toggle events
  useEffect(() => {
    if (!mounted) return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sidebar-collapsed" && e.newValue !== null) {
        setSidebarCollapsed(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  if (!authorized || !mounted) {
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
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
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
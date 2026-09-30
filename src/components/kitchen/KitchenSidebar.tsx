"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  Package,
  UtensilsCrossed,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db";

const navItems: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { href: "/kitchen/orders", label: "Orders", icon: ClipboardList },
  { href: "/kitchen/ingredients", label: "Ingredients", icon: Package },
  { href: "/kitchen/menu", label: "Menu", icon: UtensilsCrossed },
];

const STORAGE_KEY = "kitchen-sidebar-collapsed";

export default function KitchenSidebar({
  className,
  role,
  onNavigate,
}: {
  className?: string;
  role?: UserRole | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "false");
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isAdminRole = role === "admin" || role === "manager";

  const navigate = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        "min-h-screen flex flex-col glass border-r border-border/50 transition-all duration-300 ease-in-out overflow-y-auto",
        isCollapsed ? "w-16" : "w-60",
        className
      )}
      style={{
        background: "rgba(17, 17, 17, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Logo */}
      <div className={cn("p-4 border-b border-border/50 transition-all duration-300", isCollapsed && "px-3")}>
        <Link href="/kitchen/orders" onClick={navigate} className="block">
          {!isCollapsed && (
            <>
              <Image
                src="/future_bite_logo.jpeg"
                alt="FutureBite"
                width={110}
                height={60}
                className="h-8 w-auto object-contain mx-auto mb-2"
              />
              <span className="block text-[10px] tracking-[0.2em] uppercase text-gold text-center">
                Kitchen
              </span>
            </>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <Image
                src="/future_bite_logo.jpeg"
                alt="FutureBite"
                width={32}
                height={32}
                className="h-7 w-auto object-contain"
              />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Kitchen navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={navigate}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-lg group",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-ivory-dim hover:text-ivory hover:bg-surface-elevated"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={cn("flex-shrink-0 w-5 h-5 flex items-center justify-center", isCollapsed && "mx-auto")}>
                <Icon size={16} strokeWidth={1.5} />
              </div>
              {!isCollapsed && (
                <span className={cn("flex-1 truncate transition-opacity duration-200", isActive && "font-medium")}>
                  {item.label}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn("p-3 border-t border-border/50 transition-all duration-300", isCollapsed && "px-2")}>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-ivory-dim hover:text-ivory transition-colors w-full rounded-lg hover:bg-surface-elevated group"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={1.5} className="text-ivory-dim group-hover:text-gold transition-colors" />
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={1.5} className="text-ivory-dim group-hover:text-gold transition-colors" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>

        {isAdminRole && (
          <Link
            href="/admin"
            onClick={navigate}
            className={cn(
              "mt-2 flex items-center gap-3 px-3 py-2.5 text-sm text-ivory-dim hover:text-ivory transition-colors w-full rounded-lg hover:bg-surface-elevated",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Admin Dashboard" : undefined}
          >
            <LayoutDashboard size={16} strokeWidth={1.5} />
            {!isCollapsed && <span>Admin Dashboard</span>}
          </Link>
        )}

        <div className={cn("mt-2 pt-2 border-t border-border/50", isCollapsed && "hidden")}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ivory-dim hover:text-error transition-colors w-full rounded-lg hover:bg-surface-elevated"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </div>
        {isCollapsed && (
          <div className="mt-2">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center px-3 py-2 text-sm text-ivory-dim hover:text-error transition-colors w-full rounded-lg hover:bg-surface-elevated"
              title="Sign Out"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
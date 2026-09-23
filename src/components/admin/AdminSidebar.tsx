"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  ChefHat,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db";

const navItems: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  roles: UserRole[];
}[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays, roles: ["admin", "manager"] },
  { href: "/admin/floor-plan", label: "Floor Plan", icon: Map, roles: ["admin", "manager"] },
  { href: "/admin/kitchen", label: "Kitchen", icon: ChefHat, roles: ["admin", "manager", "kitchen"] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, roles: ["admin", "manager"] },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, roles: ["admin", "manager"] },
  { href: "/admin/inventory", label: "Inventory", icon: Package, roles: ["admin", "manager"] },
  { href: "/admin/staff", label: "Staff", icon: Users, roles: ["admin"] },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/pos", label: "POS", icon: CreditCard, roles: ["admin", "manager"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export default function AdminSidebar({
  className,
  role,
}: {
  className?: string;
  role?: UserRole | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  const handleSignOut = async () => {
    try {
      // Invalidate the server session and clear the httpOnly cookie —
      // otherwise the proxy would keep letting the stale cookie through.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const visibleItems = role
    ? navItems.filter((item) => item.roles.includes(role))
    : navItems;

  if (!mounted) {
    return (
      <aside className={cn("w-60 bg-surface border-r border-border/50 min-h-screen flex flex-col glass", className)} />
    );
  }

  return (
    <aside
      className={cn(
        "min-h-screen flex flex-col glass border-r border-border/50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60",
        className
      )}
      style={{
        background: "rgba(17, 17, 17, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Logo Section */}
      <div className={cn("p-4 border-b border-border/50 transition-all duration-300", isCollapsed && "px-3")}>
        <Link href="/admin" className="block">
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
                Admin
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
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Bottom Section - Toggle & Sign Out */}
      <div className={cn("p-3 border-t border-border/50 transition-all duration-300", isCollapsed && "px-2")}>
        {/* Collapse/Expand Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 text-sm text-ivory-dim hover:text-ivory transition-colors w-full rounded-lg hover:bg-surface-elevated group"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <>
              <ChevronRight size={16} strokeWidth={1.5} className="text-ivory-dim group-hover:text-gold transition-colors" />
              {!mounted && <span className="sr-only">Expand sidebar</span>}
            </>
          ) : (
            <>
              <ChevronLeft size={16} strokeWidth={1.5} className="text-ivory-dim group-hover:text-gold transition-colors" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>

        <div className={cn("mt-3 pt-3 border-t border-border/50", isCollapsed && "hidden")}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ivory-dim hover:text-error transition-colors w-full rounded-lg hover:bg-surface-elevated"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Sign Out when collapsed - icon only with tooltip */}
        {isCollapsed && (
          <div className="mt-3">
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

      {/* Resize handle for desktop */}
      {!isCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gold/20 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            // Could add manual resize logic here if needed
          }}
          aria-hidden="true"
        />
      )}
    </aside>
  );
}
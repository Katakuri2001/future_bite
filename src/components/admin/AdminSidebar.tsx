"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/floor-plan", label: "Floor Plan", icon: Map },
  { href: "/admin/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-surface border-r border-border/50 min-h-screen flex flex-col">
      <div className="p-5 border-b border-border/50">
        <Link href="/admin" className="block">
          <span className="text-display text-lg text-ivory tracking-wide">
            FutureBite
          </span>
          <span className="block text-[10px] tracking-[0.2em] uppercase text-gold mt-0.5">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-gold/10 text-gold border-l-2 border-gold"
                  : "text-ivory-dim hover:text-ivory hover:bg-surface-elevated border-l-2 border-transparent"
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-ivory-dim hover:text-error transition-colors w-full">
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

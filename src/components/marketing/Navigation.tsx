"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/experience", label: "Experience" },
  { href: "/about", label: "About" },
  { href: "/reserve", label: "Reservations" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-bg/95 backdrop-blur-md border-b border-border/50"
            : "bg-transparent"
        )}
      >
        <div className="container-wide mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="relative z-10">
              <span className="text-display text-2xl tracking-wide text-ivory">
                FutureBite
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-widest uppercase text-ivory-muted hover:text-gold transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/account"
                className="text-ivory-muted hover:text-gold transition-colors duration-300"
                aria-label="Account"
              >
                <User size={18} strokeWidth={1.5} />
              </Link>
              <Link href="/reserve" className="btn-primary text-xs py-3 px-6">
                Reserve
              </Link>
            </div>

            <button
              className="md:hidden relative z-10 text-ivory p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-bg transition-all duration-500 md:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-display text-3xl text-ivory hover:text-gold transition-colors duration-300"
              style={{
                animationDelay: mobileOpen ? `${i * 0.1}s` : "0s",
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                transitionDelay: mobileOpen ? `${i * 0.08}s` : "0s",
              }}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col items-center gap-4">
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="text-ivory-muted text-sm tracking-widest uppercase hover:text-gold transition-colors"
            >
              Account
            </Link>
            <Link
              href="/reserve"
              onClick={() => setMobileOpen(false)}
              className="btn-primary"
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

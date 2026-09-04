import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, LogIn } from "lucide-react";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "My Account",
  description:
    "Manage your FutureBite reservations and preferences.",
};

export default function AccountPage() {
  return (
    <MotionProvider>
      <Navigation />
      <main className="min-h-screen pt-28 pb-24">
        <div className="container-narrow mx-auto">
          <FadeIn>
            <div className="text-center">
              <p className="text-label mb-4">Your Account</p>
              <h1 className="text-display-md text-ivory mb-6">
                Reservations, In One Place
              </h1>
              <p className="text-body-lg max-w-xl mx-auto mb-12 text-ivory-muted">
                Sign in to view your upcoming reservations, past visits, and
                saved preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-surface border border-border/50 p-8 text-center">
                <CalendarDays
                  size={28}
                  className="text-gold mx-auto mb-4"
                  strokeWidth={1.5}
                />
                <h2 className="text-ivory font-display text-lg mb-2">
                  Your Reservations
                </h2>
                <p className="text-ivory-muted text-sm mb-6">
                  View and manage your upcoming table reservations.
                </p>
                <Link
                  href="/login"
                  className="btn-primary text-xs py-3 px-8 inline-block"
                >
                  Sign In To View
                </Link>
              </div>

              <div className="bg-surface border border-border/50 p-8 text-center">
                <LogIn size={28} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-ivory font-display text-lg mb-2">
                  New to FutureBite?
                </h2>
                <p className="text-ivory-muted text-sm mb-6">
                  Reserve a table in under a minute — no account required.
                </p>
                <Link
                  href="/reserve"
                  className="btn-outline text-xs py-3 px-8 inline-block"
                >
                  Reserve a Table
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </MotionProvider>
  );
}
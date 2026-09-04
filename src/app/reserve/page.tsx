import type { Metadata } from "next";
import { Suspense } from "react";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import ReservationFlow from "@/components/reservations/ReservationFlow";
import MotionProvider from "@/components/motion/MotionProvider";

export const metadata: Metadata = {
  title: "Reservations",
  description:
    "Reserve your table at FutureBite. An extraordinary dining experience in Yangon, Myanmar.",
};

export default function ReservePage() {
  return (
    <MotionProvider>
      <Navigation />
      <main className="min-h-screen pt-28 pb-16">
        <div className="section-padding !pt-8 !pb-0">
          <div className="container-narrow mx-auto">
            <div className="text-center mb-12">
              <p className="text-label mb-4">Reservations</p>
              <h1 className="text-display-md text-ivory">
                Reserve Your Table
              </h1>
            </div>
          </div>
        </div>
        <div className="section-padding !pt-0">
          <Suspense
            fallback={
              <div className="text-center py-20">
                <p className="text-ivory-dim text-sm">Loading...</p>
              </div>
            }
          >
            <ReservationFlow />
          </Suspense>
        </div>
      </main>
      <Footer />
    </MotionProvider>
  );
}

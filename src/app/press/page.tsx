import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Press",
  description: "Press coverage, facts and media enquiries for FutureBite.",
};

const coverage = [
  {
    outlet: "The Yangon Times",
    title: "A restaurant built on precision",
    date: "August 2026",
    excerpt:
      "FutureBite's kitchen runs on a data spine most dining rooms have never attempted — and a room that keeps all of it invisible.",
  },
  {
    outlet: "Monsoon Magazine",
    title: "The omakase worth planning a trip around",
    date: "June 2026",
    excerpt:
      "Ten courses, one seating, and a chef who has clearly thought about every single one of them.",
  },
  {
    outlet: "Irrawaddy Food",
    title: "How Yangon is changing its evening",
    date: "March 2026",
    excerpt:
      "A new generation of dining rooms is betting on the long dinner. FutureBite is among them.",
  },
];

export default function PressPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-label mb-4">Press</p>
              <h1 className="text-display-lg text-ivory mb-6">In The Papers</h1>
              <p className="text-body-lg max-w-xl mx-auto">
                Coverage, facts and media enquiries.
              </p>
            </div>

            <ul className="space-y-4 max-w-3xl mx-auto mb-16">
              {coverage.map((item) => (
                <li
                  key={item.title}
                  className="bg-surface border border-border/50 p-6"
                >
                  <p className="text-xs text-gold tracking-[0.15em] uppercase mb-2">
                    {item.outlet} · {item.date}
                  </p>
                  <h2 className="text-display text-xl text-ivory mb-2">
                    {item.title}
                  </h2>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    {item.excerpt}
                  </p>
                </li>
              ))}
            </ul>

            <div className="max-w-3xl mx-auto bg-surface border border-border/50 p-8">
              <h2 className="text-display text-2xl text-ivory mb-4">
                Fast facts
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Opened", "2024"],
                  ["Location", "Yangon, Myanmar"],
                  ["Seats", "48 across four experiences"],
                  ["Chef's counter", "10 seats, single seating"],
                  ["Service", "Tuesday — Sunday, 6:00 PM — 11:00 PM"],
                  ["Contact", "press@futurebite.com"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-ivory-dim text-xs tracking-[0.1em] uppercase">
                      {label}
                    </dt>
                    <dd className="text-ivory mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="text-center text-ivory-dim text-sm mt-12">
              Media enquiries:{" "}
              <a
                href="mailto:press@futurebite.com"
                className="text-gold hover:text-ivory transition-colors"
              >
                press@futurebite.com
              </a>
            </p>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the FutureBite team in Yangon.",
};

const roles = [
  {
    title: "Executive Chef",
    type: "Full time",
    location: "On site — Yangon",
    summary:
      "Own the kitchen end to end: menu development, sourcing, supplier relationships and a small, senior brigade.",
  },
  {
    title: "Sommelier",
    type: "Full time",
    location: "On site — Yangon",
    summary:
      "Build and curate the cellar, run tasting flights, and pair the list with the menu as it evolves.",
  },
  {
    title: "Sous Chef",
    type: "Full time",
    location: "On site — Yangon",
    summary:
      "Support the head chef across prep, service and development. Prior experience in a fine-dining kitchen essential.",
  },
  {
    title: "Front of House",
    type: "Full time / Part time",
    location: "On site — Yangon",
    summary:
      "Guest experience from arrival to farewell. Warmth and attention to detail matter more than years of experience.",
  },
  {
    title: "Reservations Manager",
    type: "Full time",
    location: "On site — Yangon",
    summary:
      "Own the booking calendar, guest relationships, and the balance between turning tables and keeping service unhurried.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-label mb-4">Careers</p>
              <h1 className="text-display-lg text-ivory mb-6">Work With Us</h1>
              <p className="text-body-lg max-w-xl mx-auto">
                We hire for precision and warmth in equal measure. If that
                sounds like you, we would like to meet you.
              </p>
            </div>

            <ul className="space-y-4 max-w-3xl mx-auto">
              {roles.map((role) => (
                <li
                  key={role.title}
                  className="bg-surface border border-border/50 p-6 hover:border-gold/40 transition-colors"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h2 className="text-display text-xl text-ivory">{role.title}</h2>
                    <span className="text-xs text-gold tracking-[0.1em] uppercase">
                      {role.type}
                    </span>
                  </div>
                  <p className="text-ivory-dim text-xs mb-3">{role.location}</p>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    {role.summary}
                  </p>
                  <a
                    href={`mailto:careers@futurebite.com?subject=${encodeURIComponent(
                      `Application — ${role.title}`
                    )}`}
                    className="inline-block mt-4 text-xs text-gold hover:text-ivory transition-colors tracking-[0.1em] uppercase"
                  >
                    Apply →
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-center text-ivory-dim text-sm mt-12">
              Nothing that fits? Send a speculative application to{" "}
              <a
                href="mailto:careers@futurebite.com"
                className="text-gold hover:text-ivory transition-colors"
              >
                careers@futurebite.com
              </a>
              .
            </p>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
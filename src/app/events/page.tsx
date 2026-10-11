import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Events & Private Dining",
  description: "Private rooms, chef's counter and special events at FutureBite.",
};

const offerings = [
  {
    title: "The Private Room",
    capacity: "10 — 12 guests",
    price: "From 1,200,000 K per evening",
    description:
      "A room of your own with a dedicated server and a menu written for the evening. The most requested setting for celebrations and closed-door dinners.",
  },
  {
    title: "Chef's Counter",
    capacity: "10 seats, one seating",
    price: "From 320,000 K per guest",
    description:
      "Ten seats in front of the kitchen. The full tasting menu, narrated course by course by the chefs preparing it.",
  },
  {
    title: "Long Table",
    capacity: "20 — 40 guests",
    price: "From 90,000 K per guest",
    description:
      "A single communal table down the centre of the main dining room. Ideal for weddings, launches and long-table dinners.",
  },
];

const events = [
  {
    date: "14 November 2026",
    title: "Wine Dinner: The Rhone Valley",
    detail: "Six courses, paired by our sommelier. Seats are limited to 24.",
  },
  {
    date: "5 December 2026",
    title: "Guest Chef Series: Monsoon Fishes",
    detail: "A visiting chef joins us for one night only. Pre-paid reservations open in October.",
  },
  {
    date: "31 December 2026",
    title: "New Year's Eve — Last Night of the Year",
    detail: "Ten courses, midnight toast, and the counter seating closed off to twelve guests.",
  },
];

export default function EventsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-label mb-4">Private Dining &amp; Events</p>
              <h1 className="text-display-lg text-ivory mb-6">
                Something Bespoke
              </h1>
              <p className="text-body-lg max-w-xl mx-auto">
                Rooms, counters and set-piece evenings. Tell us the occasion and
                we will write the rest.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {offerings.map((o) => (
                <div
                  key={o.title}
                  className="bg-surface border border-border/50 p-8 flex flex-col"
                >
                  <h2 className="text-display text-xl text-ivory mb-2">{o.title}</h2>
                  <p className="text-gold text-xs tracking-[0.1em] uppercase mb-4">
                    {o.capacity}
                  </p>
                  <p className="text-ivory-muted text-sm leading-relaxed flex-1 mb-4">
                    {o.description}
                  </p>
                  <p className="text-ivory-dim text-xs border-t border-border/40 pt-4">
                    {o.price}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-20">
              <h2 className="text-display-md text-ivory mb-8 text-center">
                Upcoming Evenings
              </h2>
              <ul className="space-y-4 max-w-3xl mx-auto">
                {events.map((e) => (
                  <li
                    key={e.title}
                    className="bg-surface border border-border/50 p-6 flex flex-wrap justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-gold tracking-[0.15em] uppercase mb-1">
                        {e.date}
                      </p>
                      <h3 className="text-display text-lg text-ivory mb-1">
                        {e.title}
                      </h3>
                      <p className="text-ivory-muted text-sm">{e.detail}</p>
                    </div>
                    <Link
                      href="/contact"
                      className="self-center text-xs text-gold hover:text-ivory transition-colors tracking-[0.1em] uppercase whitespace-nowrap"
                    >
                      Enquire →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center">
              <Link href="/contact" className="btn-primary text-xs py-4 px-12">
                Plan Your Evening
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
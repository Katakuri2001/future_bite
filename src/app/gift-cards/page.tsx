import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "Send a FutureBite dining experience to someone you love.",
};

const amounts = [250_000, 500_000, 1_000_000, 2_000_000];

export default function GiftCardsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-label mb-4">Gift Cards</p>
              <h1 className="text-display-lg text-ivory mb-6">
                Give An Evening
              </h1>
              <p className="text-body-lg max-w-xl mx-auto">
                A FutureBite gift card works across the menu, the counter and
                the private room. Valid for two years, redeemable in full or
                in part.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14">
              {amounts.map((amount) => (
                <div
                  key={amount}
                  className="bg-surface border border-border/50 p-8 text-center hover:border-gold/50 transition-colors"
                >
                  <p className="text-xs text-ivory-dim tracking-[0.15em] uppercase mb-3">
                    Gift card
                  </p>
                  <p className="text-2xl font-display text-gold tabular-nums">
                    {amount.toLocaleString("en-US")} K
                  </p>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto bg-surface border border-border/50 p-8">
              <h2 className="text-display text-2xl text-ivory mb-4">
                Ordering a card
              </h2>
              <p className="text-ivory-muted text-sm leading-relaxed mb-6">
                Gift cards are issued in person at the restaurant or by post.
                To arrange one, email us with the value you want and the name
                of the recipient — we will confirm within one business day and
                post the card the same week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:gifts@futurebite.com?subject=Gift%20card%20order"
                  className="btn-primary text-xs py-4 px-10"
                >
                  Email gifts@futurebite.com
                </a>
                <Link href="/contact" className="btn-outline text-xs py-4 px-10">
                  Contact us
                </Link>
              </div>
            </div>

            <p className="text-center text-ivory-dim text-xs mt-10">
              Gift cards are valid for 24 months from issue and cannot be
              exchanged for cash.
            </p>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
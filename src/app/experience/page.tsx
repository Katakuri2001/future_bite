import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OptimizedImage } from "@/components/motion/OptimizedImage";
import MotionProvider from "@/components/motion/MotionProvider";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Discover the FutureBite dining experience. Private rooms, chef's counter, and intimate table settings.",
};

export default function ExperiencePage() {
  return (
    <MotionProvider>
      <Navigation />
      <FadeIn>
        <main className="min-h-screen pt-20">
          <section className="section-padding !pt-20">
            <div className="container-narrow mx-auto text-center mb-16">
              <p className="text-label mb-4">The Experience</p>
              <h1 className="text-display-lg text-ivory mb-6">
                More Than a Meal
              </h1>
              <p className="text-body-lg max-w-2xl mx-auto">
                Every detail is designed to be remembered. From the moment you
                arrive to the final farewell, your evening is crafted around you.
              </p>
            </div>
          </section>

          <div className="container-wide mx-auto space-y-20">
            <div id="window" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="aspect-[4/3] overflow-hidden bg-surface">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                  alt="Window dining experience"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-label mb-4">Window Tables</p>
                <h2 className="text-display text-3xl text-ivory mb-4">
                  Best for Intimate Dining
                </h2>
                <p className="text-ivory-muted text-sm leading-relaxed mb-6">
                  Floor-to-ceiling windows frame the city as your backdrop.
                  Perfect for romantic evenings and special celebrations, these
                  tables offer an unparalleled view alongside an unforgettable
                  meal.
                </p>
                <p className="text-gold text-sm font-medium">Tables 1-3</p>
              </div>
            </div>

            <div id="bar" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-label mb-4">Bar / Chef&apos;s Counter</p>
                <h2 className="text-display text-3xl text-ivory mb-4">
                  Closer to the Kitchen
                </h2>
                <p className="text-ivory-muted text-sm leading-relaxed mb-6">
                  Watch our chefs transform ingredients into edible art from
                  just inches away. The bar counter offers an immersive
                  experience — part dining, part theater, entirely captivating.
                </p>
                <p className="text-gold text-sm font-medium">Tables 7-8</p>
              </div>
              <div className="aspect-[4/3] overflow-hidden bg-surface order-1 lg:order-2">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80"
                  alt="Chef's counter experience"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div id="private" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="aspect-[4/3] overflow-hidden bg-surface">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
                  alt="Private dining room"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-label mb-4">Private Room</p>
                <h2 className="text-display text-3xl text-ivory mb-4">
                  For Groups & Special Occasions
                </h2>
                <p className="text-ivory-muted text-sm leading-relaxed mb-6">
                  An exclusive space for celebrations, business dinners, and
                  gatherings. Our private room accommodates up to 12 guests
                  with a dedicated service team and customizable tasting menus.
                </p>
                <p className="text-gold text-sm font-medium">Tables 9-10 · Up to 12 guests</p>
              </div>
            </div>
          </div>

          <section className="section-padding bg-bg-elevated">
            <div className="container-narrow mx-auto text-center">
              <h2 className="text-display-md text-ivory mb-6">
                Choose Your Experience
              </h2>
              <p className="text-body-lg max-w-lg mx-auto mb-8">
                Every table tells a different story. Select yours.
              </p>
              <Link href="/reserve" className="btn-primary group">
                Reserve a Table
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </section>
        </main>
      </FadeIn>
      <Footer />
    </MotionProvider>
  );
}

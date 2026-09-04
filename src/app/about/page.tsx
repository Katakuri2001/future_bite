import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import ChefSection from "@/components/marketing/ChefSection";
import Gallery from "@/components/marketing/Gallery";
import Testimonials from "@/components/marketing/Testimonials";
import Location from "@/components/marketing/Location";
import MotionProvider from "@/components/motion/MotionProvider";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "About",
  description:
    "Discover the story behind FutureBite. An extraordinary dining experience in Yangon, Myanmar.",
};

export default function AboutPage() {
  return (
    <MotionProvider>
      <Navigation />
      <FadeIn>
        <main className="min-h-screen pt-20">
          <section className="section-padding !pt-20">
            <div className="container-narrow mx-auto text-center">
              <p className="text-label mb-4">Our Story</p>
              <h1 className="text-display-lg text-ivory mb-6">
                Where Precision Meets Passion
              </h1>
              <p className="text-body-lg max-w-2xl mx-auto">
                FutureBite was born from a simple belief: dining should be an
                experience that stays with you long after the last course. We
                combine culinary artistry with thoughtful hospitality to create
                evenings that become part of your story.
              </p>
            </div>
          </section>

          <section className="section-padding bg-bg-elevated">
            <div className="container-narrow mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div>
                  <p className="text-display text-4xl text-gold mb-3">01</p>
                  <h3 className="text-display text-lg text-ivory mb-3">
                    Precision
                  </h3>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    Every ingredient measured, every technique refined, every plate
                    composed with intention.
                  </p>
                </div>
                <div>
                  <p className="text-display text-4xl text-gold mb-3">02</p>
                  <h3 className="text-display text-lg text-ivory mb-3">
                    Atmosphere
                  </h3>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    Light, sound, space, and service converge to create a world
                    apart from the everyday.
                  </p>
                </div>
                <div>
                  <p className="text-display text-4xl text-gold mb-3">03</p>
                  <h3 className="text-display text-lg text-ivory mb-3">
                    Memory
                  </h3>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    We don&apos;t cook for the moment. We cook for the memory — the
                    reason you return.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <ChefSection />
          <Gallery />
          <Testimonials />
          <Location />
        </main>
      </FadeIn>
      <Footer />
    </MotionProvider>
  );
}

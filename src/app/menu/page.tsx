import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import MenuGrid from "@/components/menu/MenuGrid";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Explore the FutureBite menu. Premium ingredients, extraordinary flavors, unforgettable dining.",
};

export default function MenuPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-28 pb-16">
        <section className="section-padding !pt-8">
          <div className="container-wide mx-auto">
            <div className="text-center mb-16">
              <p className="text-label mb-4">The Menu</p>
              <h1 className="text-display-md text-ivory mb-6">
                Ingredients Without Compromise
              </h1>
              <p className="text-body-lg max-w-xl mx-auto">
                Each dish is a meditation on flavor, crafted from the finest
                ingredients sourced with intention.
              </p>
            </div>
            <MenuGrid />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

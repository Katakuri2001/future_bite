import Navigation from "@/components/marketing/Navigation";
import Hero from "@/components/marketing/Hero";
import ReservationFinder from "@/components/marketing/ReservationFinder";
import ExperienceSection from "@/components/marketing/ExperienceSection";
import SignatureMenu from "@/components/marketing/SignatureMenu";
import TonightSection from "@/components/marketing/TonightSection";
import ChefSection from "@/components/marketing/ChefSection";
import Gallery from "@/components/marketing/Gallery";
import Testimonials from "@/components/marketing/Testimonials";
import Location from "@/components/marketing/Location";
import FinalCTA from "@/components/marketing/FinalCTA";
import Footer from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ReservationFinder />
        <ExperienceSection />
        <SignatureMenu />
        <TonightSection />
        <ChefSection />
        <Gallery />
        <Testimonials />
        <Location />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

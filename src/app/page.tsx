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
import MotionProvider from "@/components/motion/MotionProvider";
import { MotionSection } from "@/components/motion";

export default function HomePage() {
  return (
    <MotionProvider>
      <Navigation />
      <main>
        <Hero />
        <MotionSection>
          <ReservationFinder />
        </MotionSection>
        <MotionSection>
          <ExperienceSection />
        </MotionSection>
        <MotionSection>
          <SignatureMenu />
        </MotionSection>
        <MotionSection>
          <TonightSection />
        </MotionSection>
        <MotionSection>
          <ChefSection />
        </MotionSection>
        <MotionSection>
          <Gallery />
        </MotionSection>
        <MotionSection>
          <Testimonials />
        </MotionSection>
        <MotionSection>
          <Location />
        </MotionSection>
        <MotionSection>
          <FinalCTA />
        </MotionSection>
      </main>
      <Footer />
    </MotionProvider>
  );
}

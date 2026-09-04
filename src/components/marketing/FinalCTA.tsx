import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="section-padding bg-bg-elevated relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <div className="text-[40vw] font-display text-ivory leading-none select-none pointer-events-none">
          F
        </div>
      </div>

      <div className="container-narrow mx-auto relative z-10 text-center">
        <p className="text-label mb-6">Reservations</p>
        <h2 className="text-display text-4xl md:text-5xl lg:text-6xl text-ivory mb-4 leading-tight">
          Your Table
          <br />
          Is Waiting.
        </h2>
        <p className="text-body-lg max-w-lg mx-auto mb-10">
          Secure your evening at FutureBite. An experience designed around you.
        </p>
        <Link href="/reserve" className="btn-primary group text-base px-10 py-4">
          Reserve a Table
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}

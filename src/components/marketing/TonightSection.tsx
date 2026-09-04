import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TonightSection() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateStr = now.toLocaleDateString("en-US", options);

  return (
    <section className="section-padding bg-bg relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(201,169,110,0.4) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-narrow mx-auto relative z-10">
        <div className="text-center mb-12">
          <p className="text-label mb-4">Tonight</p>
          <h2 className="text-display-md text-ivory mb-2">{dateStr}</h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center mb-12">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-ivory-dim mb-2">
                Dinner Service
              </p>
              <p className="text-display text-lg text-ivory">
                6:00 PM — 11:00 PM
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-ivory-dim mb-2">
                Live Kitchen
              </p>
              <p className="text-display text-lg text-ivory">
                Chef&apos;s Tasting · 8 Courses
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-ivory-dim mb-2">
                Last Tables
              </p>
              <p className="text-display text-lg text-ivory">
                8:30 PM · 9:00 PM
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/reserve" className="btn-primary group">
              Reserve
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

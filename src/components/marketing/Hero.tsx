"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80')",
          }}
        />
        <div className="gradient-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-bg/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-wide mx-auto px-6 lg:px-10 pb-20 md:pb-28">
        <div className="max-w-3xl">
          <p className="text-label mb-6 fade-in">
            Yangon · Myanmar
          </p>

          <h1 className="text-display-lg text-ivory mb-6 fade-in-up">
            Dining,
            <br />
            Reimagined.
          </h1>

          <p className="text-body-lg max-w-xl mb-10 fade-in-up-delay-1">
            An extraordinary dining experience where precision, atmosphere,
            and cuisine converge to create unforgettable memories.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 fade-in-up-delay-2">
            <Link href="/reserve" className="btn-primary group">
              Reserve a Table
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link href="/menu" className="btn-outline">
              Explore the Menu
            </Link>
          </div>

          <p className="text-xs tracking-[0.2em] uppercase text-ivory-dim fade-in-up-delay-3">
            Open Tonight · 6:00 PM — 11:00 PM
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 fade-in-up-delay-3">
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
      </div>
    </section>
  );
}

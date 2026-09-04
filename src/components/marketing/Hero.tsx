"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OptimizedImage } from "@/components/motion/OptimizedImage";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        "[data-hero-image]",
        { scale: 1.12 },
        { scale: 1, duration: 1.6, ease: "power2.out" }
      )
        .fromTo(
          "[data-hero-wordmark]",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=1"
        )
        .fromTo(
          "[data-hero-headline]",
          { opacity: 0, y: 120 },
          { opacity: 1, y: 0, duration: 1.4, ease: "power3.out" },
          "-=0.5"
        )
        .fromTo(
          "[data-hero-subtitle]",
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
        )
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          "[data-hero-status]",
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          "-=0.4"
        );
    }, heroRef);

    const heroContent = heroRef.current.querySelector('[data-hero-content]') as HTMLElement;
    if (heroContent) {
      ScrollTrigger.create({
        trigger: heroContent,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to("[data-hero-image]", {
            y: progress * 100,
            ease: "none",
          });
          gsap.to("[data-hero-overlay]", {
            opacity: 1 - progress * 0.5,
            ease: "none",
          });
          gsap.to("[data-hero-content]", {
            y: progress * 40,
            opacity: 1 - progress * 0.3,
            ease: "none",
          });
        },
      });
    }

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-screen min-h-[700px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80')",
          }}
          data-hero-image
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
      </div>

      <div
        className="relative z-10 container-wide mx-auto px-6 lg:px-10 pb-20 md:pb-28"
        data-hero-content
      >
        <div ref={contentRef} className="max-w-3xl">
          <p className="text-label mb-6" data-hero-status>
            Yangon · Myanmar
          </p>

          <h1 className="text-display-lg text-ivory mb-6" data-hero-headline>
            Dining,
            <br />
            Reimagined.
          </h1>

          <p
            className="text-body-lg max-w-xl mb-10"
            data-hero-subtitle
          >
            An extraordinary dining experience where precision, atmosphere,
            and cuisine converge to create unforgettable memories.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12" data-hero-cta>
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

          <p className="text-xs tracking-[0.2em] uppercase text-ivory-dim">
            Open Tonight · 6:00 PM — 11:00 PM
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent animate-pulse" />
        <p className="text-center text-ivory-dim text-[10px] tracking-[0.2em] uppercase mt-2">
          SCROLL
        </p>
      </div>
    </section>
  );
}

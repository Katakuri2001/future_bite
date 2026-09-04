"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function initGSAP(): void {
  if (typeof window === "undefined") return;
}

export function initLenis(): void {
  if (typeof window === "undefined") return;
  if (lenisInstance) {
    lenisInstance.destroy();
  }
  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    smoothWheel: true,
    syncTouch: false,
  });

  function animate(time: number) {
    if (lenisInstance) {
      lenisInstance.raf(time);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

export function destroyLenis(): void {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}

export function useLenis(enabled: boolean = true) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    if (
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/kitchen")
    ) {
      return;
    }
    initLenis();
    return () => {
      destroyLenis();
    };
  }, [enabled, pathname]);
}

export function useScrollReveal(
  selector: string,
  config?: {
    start?: string;
    end?: string;
    toggleActions?: string;
    onEnter?: () => void;
  }
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;
    const elements = ref.current.querySelectorAll(selector);
    elements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "easeOut",
          scrollTrigger: {
            trigger: el,
            start: config?.start || "top 85%",
            end: config?.end || "bottom 20%",
            toggleActions: config?.toggleActions || "play none none reverse",
            onEnter: config?.onEnter,
          },
        }
      );
    });
  }, [selector, config]);

  return ref;
}

export function useParallax(
  selector: string,
  distance: number = 30
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;
    const elements = ref.current.querySelectorAll(selector);
    elements.forEach((el) => {
      gsap.to(el, {
        y: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  }, [selector, distance]);

  return ref;
}

export function useHeroTimeline() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const $el = ref.current!;

      tl.fromTo(
        $el.querySelector("[data-hero-image]") as Element,
        { scale: 1.12 },
        { scale: 1, duration: 1.6, ease: "power2.out" }
      )
        .fromTo(
          $el.querySelector("[data-hero-wordmark]") as Element,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=1"
        )
        .fromTo(
          $el.querySelector("[data-hero-headline]") as Element,
          { opacity: 0, y: 120 },
          { opacity: 1, y: 0, duration: 1.4, ease: "power3.out" },
          "-=0.5"
        )
        .fromTo(
          $el.querySelector("[data-hero-subtitle]") as Element,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
        )
        .fromTo(
          $el.querySelector("[data-hero-cta]") as Element,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          $el.querySelector("[data-hero-status]") as Element,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          "-=0.4"
        );
    }, ref);

    const heroContent = ref.current?.querySelector('[data-hero-content]');
    if (heroContent) {
      ScrollTrigger.create({
        trigger: heroContent,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const image = ref.current?.querySelector('[data-hero-image]');
          const overlay = ref.current?.querySelector('[data-hero-overlay]');
          if (image) gsap.to(image, { y: progress * 100, ease: "none" });
          if (overlay) gsap.to(overlay, { opacity: 1 - progress * 0.5, ease: "none" });
        },
      });
    }

    return () => {
      ctx.revert();
    };
  }, []);

  return ref;
}

export function killAnimations() {
  gsap.killTweensOf("*");
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

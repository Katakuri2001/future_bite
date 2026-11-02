"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initLenis, destroyLenis, scrollToTop } from "@/lib/motion/gsap";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isMarketing =
      pathname === "/" ||
      pathname === "/about" ||
      pathname === "/experience" ||
      pathname === "/menu" ||
      pathname === "/reserve";

    if (isMarketing) {
      initLenis();
    }
    // Lenis intercepts native scrolling and does not honour Next.js's
    // automatic scroll-to-top on navigation, so a route change can leave
    // the user at the bottom of the previous (longer) page — which is why
    // the footer appeared first on /about and /reserve. Force the top for
    // every route, marketing or not.
    scrollToTop(true);
    return () => {
      destroyLenis();
    };
  }, [pathname]);

  return <>{children}</>;
}

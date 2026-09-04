"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initLenis, destroyLenis } from "@/lib/motion/gsap";

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
    return () => {
      destroyLenis();
    };
  }, [pathname]);

  return <>{children}</>;
}

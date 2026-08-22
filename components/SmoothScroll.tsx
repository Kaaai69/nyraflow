"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Inertial scrolling, the single biggest reason the reference landing feels
 * unhurried: the wheel sets a target and the page eases toward it instead of
 * jumping.
 *
 * Same library and the same lerp the reference uses. Lenis drives real
 * scrollTop, so sticky positioning, IntersectionObserver and framer-motion's
 * useScroll all keep working untouched.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Honour a reduced-motion preference: smoothing scroll is exactly the kind
    // of motion people turn this off for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Touch devices already have their own inertia; adding ours on top fights
    // the platform.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1.0,
      smoothWheel: true,
    });

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    // Anchor links have to go through Lenis, or they jump while the smooth
    // layer is still animating and the two fight each other.
    const handleAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.(
        'a[href^="#"], a[href^="/#"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute("href")?.replace(/^\//, "");
      if (!hash || hash === "#") return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { duration: 1.6 });
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
    };
  }, []);

  return null;
}

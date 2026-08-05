"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERVICES = [
  "websites",
  "automations",
  "integrations",
  "Telegram apps",
];

export default function AnimatedServicesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SERVICES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPaused(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="animated-services-section"
      className="relative flex min-h-[60vh] w-full flex-col justify-center overflow-hidden bg-[#000000] text-[#FFFFFF] select-none py-16"
    >
      <div className="mx-auto flex w-full max-w-site flex-col justify-center px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
        <div className="flex flex-col items-center justify-center gap-2 md:flex-row md:items-baseline md:gap-5 text-center md:text-left">
          {/* Static Phrase: Мы создаём */}
          <span className="text-4xl font-bold tracking-tight text-[#FFFFFF] md:text-6xl lg:text-7xl shrink-0 leading-tight">
            Мы создаём
          </span>

          {/* Vertical Reel Scroll Area */}
          <div className="relative h-[1.3em] min-w-[280px] sm:min-w-[360px] md:min-w-[460px] overflow-hidden flex items-baseline justify-center md:justify-start">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={SERVICES[currentIndex]}
                initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-4xl font-semibold tracking-tight text-[#FFFFFF] md:text-6xl lg:text-7xl whitespace-nowrap leading-tight"
              >
                {SERVICES[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

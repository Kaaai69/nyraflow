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
      { threshold: 0.15 }
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
      className="relative flex min-h-[55vh] w-full flex-col justify-center overflow-hidden bg-[#000000] text-[#FFFFFF] select-none py-20"
    >
      <div className="mx-auto flex w-full max-w-site flex-col justify-center px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:items-baseline sm:justify-center sm:gap-4 md:gap-6 text-center sm:text-left">
          {/* Static Phrase: Мы создаём */}
          <span className="text-4xl font-bold tracking-tight text-[#FFFFFF] sm:text-5xl md:text-6xl lg:text-7xl shrink-0 whitespace-nowrap leading-none">
            Мы создаём
          </span>

          {/* Vertical Sliding Reel */}
          <div className="relative h-[1.35em] overflow-hidden flex items-center justify-center sm:justify-start min-w-[240px] sm:min-w-[320px] md:min-w-[440px]">
            <AnimatePresence mode="wait">
              <motion.span
                key={SERVICES[currentIndex]}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-4xl font-bold tracking-tight text-[#FFFFFF] sm:text-5xl md:text-6xl lg:text-7xl whitespace-nowrap block leading-none"
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

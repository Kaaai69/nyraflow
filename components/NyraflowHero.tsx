"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function LetterStaggerText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.04 * i },
    }),
    exit: {
      opacity: 0,
      y: -10,
      filter: "blur(4px)",
      transition: { duration: 0.3 },
    },
  };

  const childVariants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        damping: 14,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 12,
      filter: "blur(4px)",
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {letters.map((letter, index) => (
        <motion.span variants={childVariants} key={index}>
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function NyraflowHero() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

    const sceneDurations = [
      1300, // 0: Мы —
      1600, // 1: Мы — больше, чем веб-студия
      1800, // 2: Создаём цифровые системы для бизнеса
      1500, // 3: Websites (Black background, white panel/card)
      1500, // 4: Automations (White Panel, dark text)
      1500, // 5: Integrations (Black background, white text)
      1500, // 6: Telegram Apps (White Panel, dark text)
      1800, // 7: Единая экосистема / Созданная вокруг задач вашего бизнеса
      3800, // 8: nyraflow Final Brand Scene + CTA button
      1200, // 9: Fade out reset transition
    ];

    const currentDuration = sceneDurations[sceneIndex] || 1600;

    const timer = setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % sceneDurations.length);
    }, currentDuration);

    return () => clearTimeout(timer);
  }, [sceneIndex, isPaused, prefersReducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPaused(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
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

  if (prefersReducedMotion) {
    return (
      <section
        ref={containerRef}
        className="relative flex min-h-screen min-h-[100svh] w-full flex-col justify-center bg-[#000000] text-[#FFFFFF] px-6 text-center"
      >
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl lowercase">
            nyraflow
          </h1>
          <p className="mt-4 text-xl text-white/70 md:text-2xl">
            Websites, automations, integrations и Telegram apps для вашего бизнеса
          </p>
          <div className="mt-8">
            <a
              href="#contact"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 font-semibold text-[#000000] hover:bg-white/90"
            >
              Начать проект
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-[#000000] text-[#FFFFFF] select-none"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {/* Scene 0: Мы — */}
          {sceneIndex === 0 && (
            <LetterStaggerText
              key="scene-0"
              text="Мы —"
              className="text-display font-medium tracking-tight text-white/80"
            />
          )}

          {/* Scene 1: Мы — больше, чем веб-студия */}
          {sceneIndex === 1 && (
            <LetterStaggerText
              key="scene-1"
              text="Мы — больше, чем веб-студия"
              className="text-display font-semibold tracking-tight text-white"
            />
          )}

          {/* Scene 2: Создаём цифровые системы для бизнеса */}
          {sceneIndex === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="text-2xl font-medium text-white/60 md:text-3xl lg:text-4xl">
                Мы — больше, чем веб-студия
              </div>
              <LetterStaggerText
                text="Создаём цифровые системы для бизнеса"
                className="text-3xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
              />
            </motion.div>
          )}

          {/* Scene 3: Websites (Black background, white text) */}
          {sceneIndex === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-black/80 px-12 py-16 text-white shadow-2xl md:px-20 md:py-24"
            >
              <LetterStaggerText
                text="Websites"
                className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl"
              />
            </motion.div>
          )}

          {/* Scene 4: Automations (White Vertical Panel, dark text) */}
          {sceneIndex === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl bg-[#F5F5F2] px-12 py-16 text-[#101114] shadow-2xl md:px-20 md:py-24"
            >
              <LetterStaggerText
                text="Automations"
                className="text-4xl font-bold tracking-tight text-[#101114] md:text-6xl lg:text-7xl"
              />
            </motion.div>
          )}

          {/* Scene 5: Integrations (Black background, white text) */}
          {sceneIndex === 5 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-black/80 px-12 py-16 text-white shadow-2xl md:px-20 md:py-24"
            >
              <LetterStaggerText
                text="Integrations"
                className="text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl"
              />
            </motion.div>
          )}

          {/* Scene 6: Telegram Apps (White Vertical Panel, dark text) */}
          {sceneIndex === 6 && (
            <motion.div
              key="scene-6"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl bg-[#F5F5F2] px-10 py-16 text-[#101114] shadow-2xl md:px-16 md:py-24"
            >
              <LetterStaggerText
                text="Telegram Apps"
                className="text-4xl font-bold tracking-tight text-[#101114] md:text-6xl lg:text-7xl"
              />
            </motion.div>
          )}

          {/* Scene 7: Единая экосистема / Созданная вокруг задач вашего бизнеса */}
          {sceneIndex === 7 && (
            <motion.div
              key="scene-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <LetterStaggerText
                text="Единая экосистема"
                className="text-3xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
              />
              <div className="text-xl font-normal text-white/70 md:text-3xl">
                Созданная вокруг задач вашего бизнеса
              </div>
            </motion.div>
          )}

          {/* Scene 8: Final Brand Scene (nyraflow in lowercase) */}
          {sceneIndex === 8 && (
            <motion.div
              key="scene-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="text-5xl font-bold tracking-tight text-white lowercase md:text-7xl lg:text-8xl">
                nyraflow
              </div>
              <p className="text-lg font-medium text-white/75 md:text-2xl">
                Цифровые решения и системы для роста бизнеса
              </p>
              <div className="pt-4">
                <a
                  href="#contact"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-white px-9 text-base font-semibold text-[#000000] shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
                >
                  Начать проект
                </a>
              </div>
            </motion.div>
          )}

          {/* Scene 9: Blank / Reset */}
          {sceneIndex === 9 && (
            <motion.div
              key="scene-9"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0 }}
              className="h-20 w-20"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Accessible h1 */}
      <h1 className="sr-only">
        nyraflow — Сайты, автоматизации, интеграции и Telegram приложения для бизнеса
      </h1>
    </section>
  );
}

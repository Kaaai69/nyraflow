"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      1400, // 3: Websites
      1500, // 4: Automations (White Panel)
      1400, // 5: Integrations
      1500, // 6: Telegram Apps (White Panel)
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
        className="relative flex min-h-screen min-h-[100svh] w-full flex-col justify-center bg-transparent text-white px-6 text-center"
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
      className="relative flex min-h-screen min-h-[100svh] w-full flex-col justify-center bg-transparent text-white select-none"
    >
      {/* Top Header Logo Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-start px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto w-full">
        <a href="#" className="flex items-center">
          <img
            src="/nyraflow-logo.png"
            alt="nyraflow logo"
            className="h-8 md:h-10 w-auto object-contain invert brightness-200"
          />
        </a>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {/* Scene 0: Мы — */}
          {sceneIndex === 0 && (
            <motion.div
              key="scene-0"
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Мы —
            </motion.div>
          )}

          {/* Scene 1: Мы — больше, чем веб-студия */}
          {sceneIndex === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Мы — больше, чем веб-студия
            </motion.div>
          )}

          {/* Scene 2: Разрабатываем цифровые системы для бизнеса */}
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
              <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
                Создаём цифровые системы для бизнеса
              </div>
            </motion.div>
          )}

          {/* Scene 3: Websites */}
          {sceneIndex === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl"
            >
              Websites
            </motion.div>
          )}

          {/* Scene 4: Automations (White Vertical Panel) */}
          {sceneIndex === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl bg-[#F5F5F2] px-12 py-16 text-[#101114] shadow-2xl md:px-20 md:py-24"
            >
              <span className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                Automations
              </span>
            </motion.div>
          )}

          {/* Scene 5: Integrations */}
          {sceneIndex === 5 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl"
            >
              Integrations
            </motion.div>
          )}

          {/* Scene 6: Telegram Apps (White Vertical Panel) */}
          {sceneIndex === 6 && (
            <motion.div
              key="scene-6"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col items-center justify-center rounded-2xl bg-[#F5F5F2] px-10 py-16 text-[#101114] shadow-2xl md:px-16 md:py-24"
            >
              <span className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                Telegram Apps
              </span>
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
              <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
                Единая экосистема
              </div>
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

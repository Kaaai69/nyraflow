"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionHeading, MotionGrid, MotionCard } from "../ScrollRevealSection";

/**
 * The stages of work, pinned and scrolled horizontally: the page holds still
 * while the track travels sideways, so you cannot pass the section without
 * having seen every step.
 *
 * Falls back to the plain vertical list on narrow screens and under reduced
 * motion — hijacking vertical scroll on a phone is worse than a simple list.
 */
export default function ProcessSection() {
  const content = homeContent.process;
  const prefersReducedMotion = useReducedMotion();

  const [horizontal, setHorizontal] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setHorizontal(false);
      return;
    }
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setHorizontal(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [prefersReducedMotion]);

  const header = (
    <header className="mb-12 border-b border-white/14 pb-8">
      <MotionHeading>
        <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-white/50">
          {content.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {content.title}
        </h2>
      </MotionHeading>
    </header>
  );

  if (horizontal) {
    return <HorizontalProcess header={header} items={content.items} />;
  }

  return (
    <section
      id="process"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        {header}

        <MotionGrid
          className="border-t border-white/14 divide-y divide-white/14"
          staggerDelay={0.1}
        >
          {content.items.map((item, index) => (
            <MotionCard key={item.id} tilt={false} radius="12px">
              <StepRow
                index={index}
                title={item.title}
                description={item.description}
              />
            </MotionCard>
          ))}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}

function StepRow({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <div className="py-8 md:py-10 grid gap-6 md:grid-cols-12 md:items-center group/step hover:bg-white/[0.015] px-2 md:px-4 rounded-xl transition-colors">
      <div className="md:col-span-5 flex items-center gap-6">
        <span className="text-2xl font-mono font-bold text-white/40 group-hover/step:text-white/70 transition-colors">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white transition-colors">
          {title}
        </h3>
      </div>
      <div className="md:col-span-7">
        <p className="text-base leading-relaxed text-white/75 group-hover/step:text-white/90 transition-colors">
          {description}
        </p>
      </div>
    </div>
  );
}

function HorizontalProcess({
  header,
  items,
}: {
  header: React.ReactNode;
  items: readonly { id: string; title: string; description: string }[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // How far the track has to travel: its full width minus what fits on screen.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
      setViewportHeight(window.innerHeight);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  // The section is as tall as the sideways travel plus one screen to pin
  // against, so the horizontal motion tracks the scroll one-to-one. Measured
  // after mount rather than read during render, so the server and the first
  // client pass agree.
  const measured = viewportHeight > 0;

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative bg-transparent text-white"
      style={measured ? { height: `${distance + viewportHeight}px` } : undefined}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <SectionContainer>{header}</SectionContainer>

        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max gap-6 px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop"
        >
          {items.map((item, index) => (
            <article
              key={item.id}
              className="flex w-[min(78vw,420px)] shrink-0 flex-col justify-between rounded-[22px] border border-white/14 bg-[#0E0F12]/80 p-8 backdrop-blur-md lg:p-10"
            >
              <div>
                <span className="text-5xl font-mono font-bold text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-8 text-2xl font-bold tracking-tight text-white lg:text-3xl">
                  {item.title}
                </h3>
              </div>
              <p className="mt-6 text-base leading-relaxed text-white/75">
                {item.description}
              </p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

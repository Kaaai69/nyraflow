"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

// Reveal timing ported from the reference landing (gsap power3.out, 1.1s,
// 50px of travel, triggering when the element reaches 86% of the viewport).
//
// once:false on purpose, unlike the reference: scrolling back up should reset
// the reveals so the page replays instead of going flat once seen.
const REVEAL_EASE: [number, number, number, number] = [0.165, 0.84, 0.44, 1];
const REVEAL_DURATION = 1.1;
const REVEAL_DISTANCE = 50;
const REVEAL_VIEWPORT = { once: false, margin: "0px 0px -14% 0px" } as const;

// Tilt angles from the reference: rotateX (py - 0.5) * -8, rotateY (px - 0.5) * 10.
const TILT_X = 8;
const TILT_Y = 10;

type SurfaceTone = "light" | "dark";

const GLOW_COLOR: Record<SurfaceTone, string> = {
  // White light for the dark surfaces the site is mostly built from.
  light: "rgba(255, 255, 255, 0.10)",
  // Paper-coloured cards need the inverse, or the glow is invisible on them.
  dark: "rgba(16, 17, 20, 0.10)",
};

/**
 * Cursor-following glow plus a slight 3D tilt, as on the reference cards.
 *
 * Only runs for a real mouse: coarse pointers get neither effect, and neither
 * does anyone who asked for reduced motion.
 */
function InteractiveSurface({
  children,
  tilt = true,
  tone = "light",
  radius = "22px",
}: {
  children: ReactNode;
  tilt?: boolean;
  tone?: SurfaceTone;
  radius?: string;
}) {
  const glowRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const rotateX = useSpring(0, { stiffness: 170, damping: 22, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 170, damping: 22, mass: 0.6 });

  useEffect(() => {
    // useReducedMotion resolves to null on the first pass, so re-evaluate
    // rather than leaving a stale `true` behind once it settles.
    if (prefersReducedMotion) {
      setEnabled(false);
      return;
    }
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [prefersReducedMotion]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--mx", `${px * 100}%`);
        glow.style.setProperty("--my", `${py * 100}%`);
        glow.style.opacity = "1";
      }

      if (tilt) {
        rotateX.set((py - 0.5) * -TILT_X);
        rotateY.set((px - 0.5) * TILT_Y);
      }
    },
    [enabled, tilt, rotateX, rotateY]
  );

  const handlePointerLeave = useCallback(() => {
    if (!enabled) return;
    if (glowRef.current) glowRef.current.style.opacity = "0";
    rotateX.set(0);
    rotateY.set(0);
  }, [enabled, rotateX, rotateY]);

  // The wrapper stays a motion.div in every case: swapping the element type
  // once `enabled` resolves would remount the whole card subtree.
  return (
    <motion.div
      className="relative h-full"
      style={
        enabled
          ? { rotateX, rotateY, willChange: "transform" }
          : undefined
      }
      onPointerMove={enabled ? handlePointerMove : undefined}
      onPointerLeave={enabled ? handlePointerLeave : undefined}
    >
      {children}
      {enabled && (
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
          style={{
            borderRadius: radius,
            background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${GLOW_COLOR[tone]}, transparent 65%)`,
          }}
        />
      )}
    </motion.div>
  );
}

interface ScrollRevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollRevealSection({
  children,
  className = "",
  delay = 0,
}: ScrollRevealSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: REVEAL_DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        duration: REVEAL_DURATION,
        delay,
        ease: REVEAL_EASE,
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Heading Masked Vertical Reveal Component
export function MotionHeading({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: "60%" }}
        whileInView={{ opacity: 1, y: "0%" }}
        viewport={REVEAL_VIEWPORT}
        transition={{
          duration: REVEAL_DURATION,
          delay,
          ease: REVEAL_EASE,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Staggered Container for Grids and Lists
export function MotionGrid({
  children,
  className = "",
  staggerDelay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered Card Item Reveal
export function MotionCard({
  children,
  className = "",
  tilt = true,
  tone = "light",
  radius = "22px",
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  tone?: SurfaceTone;
  radius?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: REVEAL_DISTANCE },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: REVEAL_DURATION,
            ease: REVEAL_EASE,
          },
        },
      }}
      className={className}
      style={{ perspective: 900 }}
    >
      <InteractiveSurface tilt={tilt} tone={tone} radius={radius}>
        {children}
      </InteractiveSurface>
    </motion.div>
  );
}

// Product Slab Reveal (Archetype C)
export function MotionSlab({
  children,
  className = "",
  delay = 0,
  tilt = true,
  tone = "light",
  radius = "22px",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  tilt?: boolean;
  tone?: SurfaceTone;
  radius?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: REVEAL_DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        duration: REVEAL_DURATION,
        delay,
        ease: REVEAL_EASE,
      }}
      className={className}
      style={{ perspective: 1100 }}
    >
      <InteractiveSurface tilt={tilt} tone={tone} radius={radius}>
        {children}
      </InteractiveSurface>
    </motion.div>
  );
}

// Image Reveal (Portfolio Previews & Team Portraits)
export function MotionImageReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        duration: REVEAL_DURATION,
        delay,
        ease: REVEAL_EASE,
      }}
      className={`relative overflow-hidden w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Horizontal Divider Reveal Component
export function MotionDivider({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: REVEAL_DURATION, ease: REVEAL_EASE }}
      style={{ transformOrigin: "left center" }}
      className={className}
    />
  );
}

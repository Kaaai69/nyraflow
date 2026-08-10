"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "heading" | "cards" | "stagger";
}

export default function ScrollRevealSection({
  children,
  className = "",
  delay = 0,
}: ScrollRevealSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.16, 1, 0.3, 1], // Slow, art-directed easing
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Heading Clip Reveal Component
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
    <motion.div
      initial={{ opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered Container for Grid Cards
export function MotionGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.12,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered Child Card Item
export function MotionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.75,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
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
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: "left center" }}
      className={className}
    />
  );
}

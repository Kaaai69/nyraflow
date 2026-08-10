"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

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
      initial={{ opacity: 0, y: 32, filter: "blur(3px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth, slow, controlled easing
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

"use client";

import {
  MotionValue,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

/**
 * Text that lights up word by word as it scrolls through the viewport, as on
 * the reference landing. Words sit dim until the scroll position reaches them,
 * then come up to full brightness.
 *
 * Tied to scroll position rather than played as a timed animation, so scrolling
 * back up dims the words again.
 */

const DIM = 0.16;

// Each word brightens over this share of the total progress. Overlapping the
// windows keeps it a travelling wash rather than a row of switches flipping.
const WORD_WINDOW = 0.22;

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = (index / total) * (1 - WORD_WINDOW);
  const opacity = useTransform(progress, [start, start + WORD_WINDOW], [DIM, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className="inline-block will-change-[opacity] mr-[0.28em]"
    >
      {word}
    </motion.span>
  );
}

export default function WordIlluminate({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });

  const words = text.split(/\s+/).filter(Boolean);

  if (prefersReducedMotion) {
    return (
      <p ref={ref} className={className}>
        {text}
      </p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {words.map((word, index) => (
        <Word
          key={`${word}-${index}`}
          word={word}
          index={index}
          total={words.length}
          progress={scrollYProgress}
        />
      ))}
    </p>
  );
}

"use client";

import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

/**
 * Isometric stack of words. Every row is clipped to a single line and holds
 * two words: the one the row shows now and the one that follows it in the
 * ladder. Rolling all rows up by exactly one line therefore swaps every word
 * for its successor at once, and the stack reads as one path rather than a
 * list of labels.
 *
 * The roll is driven by scroll: the cascade plays when the stack reaches the
 * middle of the viewport and rewinds when it leaves. Hover only brings it
 * forward earlier. A hover-only effect would be dead on touch, where most of
 * the page is read.
 *
 * Geometry is in pixels, not in relative units: the row height, the line
 * height inside it and the distance the rows travel must be the same number,
 * or the clipped line lands off by a fraction and the swap looks broken.
 */

const NBSP = " ";

export type Metrics = {
  fontSize: number;
  /** Row height, and the exact distance of one roll. */
  row: number;
  /** Horizontal step between neighbouring rows; builds the diagonal. */
  step: number;
};

// Font size is bound to the row height, not chosen freely: the odd rows are
// scaled up by 4/3, and a glyph taller than its row after that scaling grows
// out of a box the layout still counts as `row` tall — neighbouring words
// then collide. Cap height of the display face is ~0.72em, so the ceiling is
// row / (0.72 * 4/3) ≈ row, and we stay under it.
export const LAYERED_TEXT_METRICS = {
  desktop: { fontSize: 52, row: 60, step: 35 },
  tablet: { fontSize: 32, row: 42, step: 22 },
  mobile: { fontSize: 24, row: 33, step: 14 },
} as const satisfies Record<string, Metrics>;

const { desktop: DESKTOP, tablet: TABLET, mobile: MOBILE } = LAYERED_TEXT_METRICS;

function readMetrics(): Metrics {
  if (window.matchMedia("(min-width: 1024px)").matches) return DESKTOP;
  if (window.matchMedia("(min-width: 640px)").matches) return TABLET;
  return MOBILE;
}

/** Row i shows words[i - 1] with words[i] waiting underneath it. */
export function toRows(words: readonly string[]) {
  return Array.from({ length: words.length + 1 }, (_, index) => ({
    top: words[index - 1] ?? NBSP,
    bottom: words[index] ?? NBSP,
  }));
}

export default function LayeredText({
  words,
  align = "center",
  className = "",
}: {
  words: readonly string[];
  align?: "start" | "center";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  // Server render has no viewport to measure; desktop is the widest case and
  // the narrower ones are corrected in the effect before paint matters.
  const [metrics, setMetrics] = useState<Metrics>(DESKTOP);
  const [hovered, setHovered] = useState(false);
  const [passing, setPassing] = useState(false);

  const rows = toRows(words);

  useEffect(() => {
    const apply = () => setMetrics(readMetrics());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // True while the stack sits in the middle band of the viewport.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPassing(entry.isIntersecting),
      { rootMargin: "-42% 0px -42% 0px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // The timeline is built once per geometry and then only played or reversed.
  // Rebuilding it on every hover would reset the rows to their start position
  // first, and the stack would jump before it moved.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paragraphs = container.querySelectorAll("p");
    const timeline = gsap.timeline({ paused: true });

    timeline.to(paragraphs, {
      y: -metrics.row,
      duration: reduced ? 0 : 0.8,
      ease: "power2.out",
      stagger: reduced ? 0 : 0.08,
    });
    timelineRef.current = timeline;

    return () => {
      timeline.kill();
      timelineRef.current = null;
      gsap.set(paragraphs, { y: 0 });
    };
  }, [metrics.row, words]);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    if (hovered || passing) {
      timeline.play();
    } else {
      timeline.reverse();
    }
  }, [hovered, passing, metrics.row]);

  const centerIndex = Math.floor(rows.length / 2);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "font-black uppercase tracking-[-0.02em] antialiased select-none",
        className,
      )}
      style={{ fontSize: `${metrics.fontSize}px` }}
    >
      <ul
        className={`m-0 flex list-none flex-col p-0 ${
          align === "center" ? "items-center" : "items-start"
        }`}
        // Rows are pushed left by both their own offset and the skew; without
        // this the diagonal hangs outside the content column.
        style={align === "start" ? { marginLeft: centerIndex * metrics.step } : undefined}
      >
        {rows.map((row, index) => {
          const even = index % 2 === 0;

          return (
            <li
              key={`${row.top}-${row.bottom}-${index}`}
              className="relative overflow-hidden"
              style={{
                height: `${metrics.row}px`,
                transform: `translateX(${(index - centerIndex) * metrics.step}px) skew(${
                  even ? "60deg, -30deg" : "0deg, -30deg"
                }) scaleY(${even ? 0.66667 : 1.33333})`,
              }}
            >
              {[row.top, row.bottom].map((word, wordIndex) => (
                <p
                  key={wordIndex}
                  className="m-0 whitespace-nowrap px-[0.2em] align-top"
                  style={{
                    height: `${metrics.row}px`,
                    lineHeight: `${metrics.row - 4}px`,
                  }}
                >
                  {word}
                </p>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

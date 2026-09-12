"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

/**
 * A cloud that watches the cursor while the form next to it is being filled
 * in, blinks on its own, and squeezes its eyes shut while the visitor types
 * the task description — the one field where someone might feel watched.
 *
 * Drawn here rather than loaded as a picture: the section lies on the live
 * page background, so the mascot carries no opaque plate of its own, and the
 * eyes have to be addressable geometry, not pixels.
 */

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 132;

/** Eye centres in viewBox units. */
const EYES = [
  { x: 82, y: 76 },
  { x: 128, y: 76 },
] as const;

const EYE_RX = 13;
const EYE_RY = 15;
/** How far a pupil may leave its eye centre, in viewBox units. */
const PUPIL_REACH = 5.5;
/** Cursor distance, in px, that counts as looking all the way across. */
const GAZE_SPAN = 320;

const CLOUD_PATH =
  "M48 118 C26 118 12 104 12 86 C12 70 24 57 40 55 C44 32 64 16 88 16 " +
  "C110 16 129 30 135 50 C140 47 146 45 152 45 C172 45 188 61 188 81 " +
  "C188 84 188 87 187 90 C199 96 206 107 206 118 Z";

const IDLE_GAZE = [
  { x: -0.7, y: 0.2 },
  { x: 0.1, y: -0.5 },
  { x: 0.8, y: 0.15 },
  { x: 0, y: 0.4 },
] as const;

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export default function ContactMascot({
  eyesShut = false,
  className = "",
}: {
  /** True while the visitor types into the field the cloud politely ignores. */
  eyesShut?: boolean;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fine = window.matchMedia("(pointer: fine)").matches;

    if (!fine) {
      // No cursor to follow: the eyes wander slowly instead of sitting dead.
      let step = 0;
      const timer = window.setInterval(() => {
        step = (step + 1) % IDLE_GAZE.length;
        setGaze(IDLE_GAZE[step]);
      }, 2600);
      return () => window.clearInterval(timer);
    }

    let frame = 0;
    const handleMove = (event: MouseEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const svg = svgRef.current;
        if (!svg) return;

        const box = svg.getBoundingClientRect();
        if (!box.width) return;

        // Eyes sit side by side around the middle of the drawing; aiming both
        // at the same point from their shared centre keeps them parallel.
        const centreX = box.left + (box.width * (EYES[0].x + EYES[1].x)) / 2 / VIEW_WIDTH;
        const centreY = box.top + (box.height * EYES[0].y) / VIEW_HEIGHT;

        setGaze({
          x: clamp((event.clientX - centreX) / GAZE_SPAN),
          y: clamp((event.clientY - centreY) / GAZE_SPAN),
        });
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setBlinking(true);
      window.setTimeout(() => setBlinking(false), 160);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const lidScale = eyesShut ? 0.06 : blinking ? 0.12 : 1;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Облако, которое следит за курсором и закрывает глаза, пока вы пишете задачу"
      className={cn("mascot-cloud w-full max-w-[15rem]", className)}
    >
      <path
        d={CLOUD_PATH}
        fill="rgba(236, 238, 242, 0.1)"
        stroke="rgba(236, 238, 242, 0.32)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {EYES.map((eye) => (
        <g
          key={eye.x}
          style={{
            transform: `translate(${eye.x}px, ${eye.y}px) scaleY(${lidScale}) translate(${-eye.x}px, ${-eye.y}px)`,
            transition: "transform 150ms ease",
          }}
        >
          <ellipse
            cx={eye.x}
            cy={eye.y}
            rx={EYE_RX}
            ry={EYE_RY}
            fill="rgba(236, 238, 242, 0.92)"
          />
          <circle
            cx={eye.x}
            cy={eye.y + 2}
            r={5.5}
            fill="#101114"
            style={{
              transform: `translate(${gaze.x * PUPIL_REACH}px, ${gaze.y * PUPIL_REACH}px)`,
              transition: "transform 220ms ease-out",
            }}
          />
        </g>
      ))}

      <path
        d={eyesShut ? "M96 100 q14 4 28 0" : "M96 99 q14 10 28 0"}
        fill="none"
        stroke="rgba(236, 238, 242, 0.7)"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: "d 200ms ease" }}
      />
    </svg>
  );
}

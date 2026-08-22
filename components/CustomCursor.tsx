"use client";

import { useEffect, useRef } from "react";

/**
 * Dot-and-ring cursor, as on the reference landing.
 *
 * The dot tracks the pointer exactly; the ring eases toward it, which is what
 * gives the cursor its weight. Over anything interactive the ring swells and
 * picks up a faint fill.
 *
 * Fine pointers only — on touch there is no cursor to replace, and hiding the
 * native one there would be actively harmful.
 */

// Elements the ring should react to. Delegated rather than bound per-node, so
// it keeps working as React mounts and unmounts sections.
const HOT_SELECTOR =
  'a, button, input, textarea, select, summary, label, [role="button"], article, [data-cursor="hot"]';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-custom-cursor");

    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let frameId = 0;
    let visible = false;

    const show = () => {
      if (visible) return;
      visible = true;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      show();
    };

    const handleOver = (event: PointerEvent) => {
      const el = event.target as Element | null;
      if (el && typeof el.closest === "function" && el.closest(HOT_SELECTOR)) {
        ring.classList.add("is-hot");
      } else {
        ring.classList.remove("is-hot");
      }
    };

    // Leaving the window entirely: park the cursor rather than freezing it
    // mid-page.
    const handleLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    // Both are eased, and the gap between the two rates is deliberately small:
    // an instant dot outruns the ring far enough that they stop reading as one
    // cursor.
    const loop = () => {
      dotX += (targetX - dotX) * 0.42;
      dotY += (targetY - dotY) * 0.42;
      ringX += (targetX - ringX) * 0.24;
      ringY += (targetY - ringY) * 0.24;
      dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerover", handleOver, { passive: true });
    document.addEventListener("pointerleave", handleLeave);
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      document.removeEventListener("pointerleave", handleLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

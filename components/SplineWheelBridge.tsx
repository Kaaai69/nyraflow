"use client";

import { useEffect } from "react";

const LINE_HEIGHT_IN_PIXELS = 16;

export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
) {
  if (deltaMode === 1) return deltaY * LINE_HEIGHT_IN_PIXELS;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}

export default function SplineWheelBridge() {
  useEffect(() => {
    let animationFrame: number | null = null;
    let pendingDelta = 0;
    let scrollYBeforeWheel = 0;

    const handleWheel = (event: WheelEvent) => {
      const splineCanvas = document.querySelector("main canvas");

      if (
        !(splineCanvas instanceof HTMLCanvasElement) ||
        !event.composedPath().includes(splineCanvas)
      ) {
        return;
      }

      const canvasRect = splineCanvas.getBoundingClientRect();
      const canvasIntersectsViewport =
        canvasRect.bottom > 0 &&
        canvasRect.top < window.innerHeight &&
        canvasRect.right > 0 &&
        canvasRect.left < window.innerWidth;

      if (!canvasIntersectsViewport) return;

      if (animationFrame === null) {
        scrollYBeforeWheel = window.scrollY;
      }

      pendingDelta += normalizeWheelDelta(
        event.deltaY,
        event.deltaMode,
        window.innerHeight,
      );

      if (animationFrame !== null) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        const delta = pendingDelta;
        pendingDelta = 0;

        if (window.scrollY === scrollYBeforeWheel) {
          window.scrollBy({ top: delta, left: 0, behavior: "auto" });
        }
      });
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: true,
    };

    window.addEventListener("wheel", handleWheel, listenerOptions);

    return () => {
      window.removeEventListener("wheel", handleWheel, listenerOptions);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return null;
}

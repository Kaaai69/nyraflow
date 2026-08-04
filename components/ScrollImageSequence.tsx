"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import {
  boundedFrameOrder,
  canvasBackingSize,
  frameIndexForProgress,
  frameUrl,
  getCoverRect,
  getContainRect,
} from "../lib/image-sequence";

export interface ScrollImageSequenceProps {
  basePath: string;
  frameCount: number;
  scrollDistance?: number;
  mobileScrollDistance?: number;
  className?: string;
  ariaLabel: string;
  posterFrame?: number;
  fit?: "contain" | "cover" | "responsive";
}

type SequenceStyle = CSSProperties & {
  "--sequence-scroll-distance": string;
  "--sequence-mobile-scroll-distance": string;
};

export function ScrollImageSequence({
  basePath,
  frameCount,
  scrollDistance = 1900,
  mobileScrollDistance = 1300,
  className = "",
  ariaLabel,
  posterFrame = 0,
  fit = "contain",
}: ScrollImageSequenceProps) {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawFrameRef = useRef<(frame: number) => void>(() => undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frameCount < 1) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const frameImages = new Map<number, HTMLImageElement>();
    const loadedFrames = new Set<number>();
    const loadingFrames = new Set<number>();
    let requestedFrame = Math.min(frameCount - 1, Math.max(0, posterFrame));
    let lastRequestedFrame = requestedFrame;
    let lastDrawnFrame = -1;
    let desiredFrames = new Set<number>();
    let cancelled = false;
    let animationFrame: number | undefined;
    let pendingFrame: number | undefined;

    setIsLoading(true);

    const releaseFrame = (frame: number) => {
      const image = frameImages.get(frame);
      if (image) {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute("src");
      }
      frameImages.delete(frame);
      loadedFrames.delete(frame);
      loadingFrames.delete(frame);
    };

    const pruneFrames = () => {
      for (const frame of frameImages.keys()) {
        if (!desiredFrames.has(frame) && frame !== lastDrawnFrame) {
          releaseFrame(frame);
        }
      }
    };

    const drawLoadedFrame = (frame: number, force = false) => {
      const target = loadedFrames.has(frame)
        ? frame
        : loadedFrames.has(lastDrawnFrame)
          ? lastDrawnFrame
          : [...loadedFrames].sort(
              (left, right) =>
                Math.abs(left - frame) - Math.abs(right - frame),
            )[0];
      if (target === undefined || (!force && target === lastDrawnFrame)) return;

      const image = frameImages.get(target);
      const context = canvas.getContext("2d", { alpha: true });

      if (!image || !context || !image.naturalWidth || !image.naturalHeight) {
        return;
      }

      const resolvedFit =
        fit === "responsive"
          ? canvas.width >= canvas.height
            ? "cover"
            : "contain"
          : fit;
      const rect = (resolvedFit === "cover" ? getCoverRect : getContainRect)(
        canvas.width,
        canvas.height,
        image.naturalWidth,
        image.naturalHeight,
      );
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
      lastDrawnFrame = target;
      canvas.dataset.frame = String(target);
      pruneFrames();
    };

    const loadFrame = (frame: number) => {
      if (cancelled || loadingFrames.has(frame) || loadedFrames.has(frame)) return;

      loadingFrames.add(frame);
      const image = new Image();
      image.decoding = "async";
      if (frame === posterFrame || frame === requestedFrame) {
        image.fetchPriority = "high";
      }
      frameImages.set(frame, image);

      image.onload = () => {
        if (cancelled || frameImages.get(frame) !== image) return;
        loadingFrames.delete(frame);
        loadedFrames.add(frame);
        if (frame === posterFrame) setIsLoading(false);
        if (frame === requestedFrame || lastDrawnFrame < 0) {
          drawLoadedFrame(requestedFrame);
        }
        pruneFrames();
      };
      image.onerror = () => {
        if (frameImages.get(frame) !== image) return;
        releaseFrame(frame);
      };
      image.src = frameUrl(basePath, frame);
    };

    const refreshFrameWindow = (frame: number) => {
      const nextFrame = Math.min(frameCount - 1, Math.max(0, frame));
      const direction: -1 | 0 | 1 =
        nextFrame > lastRequestedFrame
          ? 1
          : nextFrame < lastRequestedFrame
            ? -1
            : 0;
      lastRequestedFrame = nextFrame;
      requestedFrame = nextFrame;

      const order = prefersReducedMotion
        ? [Math.min(frameCount - 1, Math.max(0, posterFrame))]
        : boundedFrameOrder(frameCount, nextFrame, 3, posterFrame, direction);
      desiredFrames = new Set(order);
      pruneFrames();
      order.forEach(loadFrame);
      drawLoadedFrame(nextFrame);
    };

    drawFrameRef.current = (frame) => {
      const nextFrame = Math.min(frameCount - 1, Math.max(0, frame));
      if (nextFrame === lastRequestedFrame && animationFrame === undefined) return;

      pendingFrame = nextFrame;
      if (animationFrame !== undefined) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = undefined;
        if (pendingFrame === undefined) return;
        const next = pendingFrame;
        pendingFrame = undefined;
        refreshFrameWindow(next);
      });
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const backing = canvasBackingSize(
        bounds.width,
        bounds.height,
        window.devicePixelRatio || 1,
      );

      if (canvas.width !== backing.width || canvas.height !== backing.height) {
        canvas.width = backing.width;
        canvas.height = backing.height;
      }

      drawLoadedFrame(requestedFrame, true);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    refreshFrameWindow(requestedFrame);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      drawFrameRef.current = () => undefined;
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
      [...frameImages.keys()].forEach(releaseFrame);
    };
  }, [basePath, fit, frameCount, posterFrame]);

  useEffect(() => {
    if (reduceMotion || !sequenceRef.current) {
      drawFrameRef.current(posterFrame);
      return;
    }

    let cancelled = false;
    let revertAnimation: () => void = () => undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        if (cancelled || !sequenceRef.current) return;

        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const progress = { value: 0 };
        const context = gsap.context(() => {
          gsap.to(progress, {
            value: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sequenceRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.15,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              drawFrameRef.current(
                frameIndexForProgress(progress.value, frameCount),
              );
            },
          });
        }, sequenceRef);

        revertAnimation = () => context.revert();
      },
    );

    return () => {
      cancelled = true;
      revertAnimation();
    };
  }, [frameCount, posterFrame, reduceMotion]);

  const style: SequenceStyle = {
    "--sequence-scroll-distance": `${scrollDistance}px`,
    "--sequence-mobile-scroll-distance": `${mobileScrollDistance}px`,
  };

  return (
    <div
      ref={sequenceRef}
      className={`scroll-sequence ${className}`.trim()}
      style={style}
      data-reduced-motion={reduceMotion ? "true" : "false"}
    >
      <div className="scroll-sequence__stage">
        {/* The poster is server-rendered so the hero is never blank before hydration. */}
        <img
          src={frameUrl(basePath, posterFrame)}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          className="scroll-sequence__poster"
          data-visible={isLoading ? "true" : "false"}
        />
        <canvas
          ref={canvasRef}
          className="scroll-sequence__canvas"
          role="img"
          aria-label={ariaLabel}
          data-frame="0"
          data-frame-count={frameCount}
          data-fit={fit}
        />
        <span
          className="scroll-sequence__loading"
          aria-live="polite"
          aria-hidden={isLoading ? undefined : true}
          data-visible={isLoading ? "true" : "false"}
        >
          Загрузка
        </span>
      </div>
    </div>
  );
}

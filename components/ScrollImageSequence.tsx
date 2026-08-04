"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  canvasBackingSize,
  frameIndexForProgress,
  frameUrl,
  getContainRect,
  priorityFrameOrder,
} from "../lib/image-sequence";

export interface ScrollImageSequenceProps {
  basePath: string;
  frameCount: number;
  scrollDistance?: number;
  mobileScrollDistance?: number;
  className?: string;
  ariaLabel: string;
  posterFrame?: number;
}

type SequenceStyle = CSSProperties & {
  "--sequence-scroll-distance": string;
  "--sequence-mobile-scroll-distance": string;
};

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export function ScrollImageSequence({
  basePath,
  frameCount,
  scrollDistance = 1900,
  mobileScrollDistance = 1300,
  className = "",
  ariaLabel,
  posterFrame = 0,
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

    const frameImages: Array<HTMLImageElement | undefined> = new Array(
      frameCount,
    );
    const loadedFrames = new Set<number>();
    const loadingFrames = new Set<number>();
    let requestedFrame = Math.min(frameCount - 1, Math.max(0, posterFrame));
    let lastDrawnFrame = requestedFrame;
    let cancelled = false;
    let idleHandle: number | undefined;
    let fallbackHandle: ReturnType<typeof setTimeout> | undefined;

    const draw = (frame: number) => {
      requestedFrame = Math.min(frameCount - 1, Math.max(0, frame));
      const target = loadedFrames.has(requestedFrame)
        ? requestedFrame
        : lastDrawnFrame;
      const image = frameImages[target];
      const context = canvas.getContext("2d", { alpha: true });

      if (!image || !context || !image.naturalWidth || !image.naturalHeight) {
        return;
      }

      const rect = getContainRect(
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
    };

    drawFrameRef.current = draw;

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

      draw(requestedFrame);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    const order = priorityFrameOrder(frameCount, posterFrame);

    const loadFrame = (frame: number) => {
      if (cancelled || loadingFrames.has(frame) || loadedFrames.has(frame)) return;

      loadingFrames.add(frame);
      const image = new Image();
      image.decoding = "async";
      if (frame === posterFrame || frame === 0) image.fetchPriority = "high";
      frameImages[frame] = image;

      image.onload = () => {
        if (cancelled) return;
        loadingFrames.delete(frame);
        loadedFrames.add(frame);
        if (frame === posterFrame || frame === 0) setIsLoading(false);
        if (frame === requestedFrame || !loadedFrames.has(lastDrawnFrame)) {
          draw(frame);
        }
      };
      image.onerror = () => loadingFrames.delete(frame);
      image.src = frameUrl(basePath, frame);
    };

    const immediateFrames = order.slice(0, Math.min(7, order.length));
    immediateFrames.forEach(loadFrame);

    let remainingIndex = immediateFrames.length;
    const loadNextFrame = () => {
      if (cancelled || remainingIndex >= order.length) return;
      loadFrame(order[remainingIndex]);
      remainingIndex += 1;

      const idleWindow = window as IdleWindow;
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(loadNextFrame);
      } else {
        fallbackHandle = setTimeout(loadNextFrame, 16);
      }
    };
    loadNextFrame();

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      drawFrameRef.current = () => undefined;
      frameImages.forEach((image) => {
        if (!image) return;
        image.onload = null;
        image.onerror = null;
      });

      const idleWindow = window as IdleWindow;
      if (idleHandle !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleHandle);
      }
      if (fallbackHandle !== undefined) clearTimeout(fallbackHandle);
    };
  }, [basePath, frameCount, posterFrame]);

  useEffect(() => {
    if (reduceMotion || !sequenceRef.current) {
      drawFrameRef.current(posterFrame);
      return;
    }

    let cancelled = false;
    let revertAnimation = () => undefined;

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
        <canvas
          ref={canvasRef}
          className="scroll-sequence__canvas"
          role="img"
          aria-label={ariaLabel}
          data-frame="0"
          data-frame-count={frameCount}
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

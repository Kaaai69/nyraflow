"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TOTAL_FRAMES = 60;
const FRAME_PATH = "/animation/video1/frame-";

export default function VideoScrollAnimation1() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const images: HTMLImageElement[] = [];
    const animationState = { currentFrame: 0 };

    const renderFrame = (index: number) => {
      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const imgAspect = img.naturalWidth / img.naturalHeight || 1;
      const canvasAspect = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasAspect > imgAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = containerRef.current?.getBoundingClientRect() || {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      renderFrame(Math.floor(animationState.currentFrame));
    };

    window.addEventListener("resize", resizeCanvas);

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      const frameNum = String(i).padStart(3, "0");

      img.onload = () => {
        if (images.length === 1) {
          resizeCanvas();
        }
      };

      img.src = `${FRAME_PATH}${frameNum}.jpg`;
      images.push(img);
    }

    resizeCanvas();

    if (prefersReducedMotion) {
      renderFrame(0);
      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }

    const ctxGsap = gsap.context(() => {
      gsap.to(animationState, {
        currentFrame: TOTAL_FRAMES - 1,
        snap: "currentFrame",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 0.6,
          start: "top top",
          end: "+=1600",
          onUpdate: (self) => {
            const frameIndex = Math.min(
              TOTAL_FRAMES - 1,
              Math.max(0, Math.floor(self.progress * (TOTAL_FRAMES - 1)))
            );
            animationState.currentFrame = frameIndex;
            renderFrame(frameIndex);
          },
        },
      });
    }, containerRef);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      ctxGsap.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="video-scroll-1"
      className="relative flex h-screen w-full flex-col justify-center overflow-hidden bg-[#0B0C0E] text-[#F1F5F9] border-y border-white/10"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-95"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-site flex-col justify-center px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#16181D]/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#38BDF8] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#38BDF8] animate-pulse" />
            Интерактивный скролл — Сцена 1
          </span>

          <h2 className="mt-6 text-display font-semibold tracking-tight text-[#F1F5F9] leading-[1.05] text-balance">
            Динамический визуальный поток вашего продукта
          </h2>

          <p className="mt-6 mx-auto max-w-2xl text-lg leading-relaxed text-[#94A3B8] md:text-xl">
            Управляемая прокруткой анимация передаёт технологичность и уровень проектирования каждого решения.
          </p>
        </div>
      </div>
    </section>
  );
}

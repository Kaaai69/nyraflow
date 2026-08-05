"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TOTAL_FRAMES = 90;
const FRAME_PATH = "/animation/tunnel/ezgif-frame-";

export default function HeroScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const images: HTMLImageElement[] = [];
    const animationState = { currentFrame: 0 };

    let loadedCount = 0;

    const renderFrame = (index: number) => {
      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Fit 1080x1080 frame centered on canvas preserving aspect ratio
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

    // Preload 90 frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      const frameNum = String(i).padStart(3, "0");
      
      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 1) {
          resizeCanvas();
        }
        if (loadedCount === TOTAL_FRAMES) {
          setImagesLoaded(true);
        }
      };

      img.onload = onImageLoad;
      img.onerror = () => {
        // Fallback to webp if jpg fails or vice versa
        if (img.src.endsWith(".jpg")) {
          img.src = `${FRAME_PATH}${frameNum}.webp`;
        } else if (img.src.endsWith(".webp")) {
          img.src = `${FRAME_PATH}${frameNum}.png`;
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

    // GSAP ScrollTrigger pinning & frame sequence scrubbing
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
          end: "+=1800",
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
      id="hero"
      className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-[#0B0C0E] text-[#F1F5F9]"
    >
      {/* 2D Canvas background */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-90"
        aria-hidden="true"
      />

      {/* Header / Brand lockup */}
      <header className="relative z-10 w-full pt-6 md:pt-8">
        <div className="mx-auto flex max-w-site items-center justify-between px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
          <a
            href="#top"
            aria-label="nyraflow — на главную"
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/images/brand/lockup-transparent.png"
              alt="nyraflow"
              width={1027}
              height={164}
              priority
              className="h-7 w-auto md:h-8"
            />
          </a>

          <a
            href="#contact"
            className="hidden items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 sm:inline-flex"
          >
            Связаться
          </a>
        </div>
      </header>

      {/* Center Typography & Hero Content */}
      <div className="relative z-10 my-auto mx-auto flex w-full max-w-site flex-col justify-center px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#16181D]/80 px-4 py-1.5 text-xs font-medium tracking-wide text-[#94A3B8] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Digital-студия & AI-автоматизация
          </span>

          <h1 className="mt-5 text-display font-semibold tracking-tight text-[#F1F5F9] leading-[1.05] text-balance">
            Создаём digital-продукты, которые двигают бизнес вперёд
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#94A3B8] md:text-lg sm:leading-normal text-balance">
            Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-white px-7 font-semibold text-[#0B0C0E] shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all hover:bg-[#E2E8F0] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
            >
              Обсудить проект
            </a>

            <a
              href="#work"
              className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-white/15 bg-[#16181D]/60 px-7 font-medium text-[#F1F5F9] backdrop-blur-md transition-all hover:border-white/30 hover:bg-[#16181D]/90 active:scale-95"
            >
              Смотреть работы
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator footer element */}
      <div className="relative z-10 pb-8 text-center text-xs text-[#94A3B8] tracking-widest uppercase opacity-70">
        <div className="inline-flex items-center gap-2">
          <span>Скролльте вниз</span>
          <span className="inline-block animate-bounce">↓</span>
        </div>
      </div>
    </section>
  );
}

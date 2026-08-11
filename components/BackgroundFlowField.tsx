"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  colorRgb: string;     // rgb string e.g. "255, 255, 255"
  glowSpeed: number;
  glowPhase: number;
  depth: number;        // 0 (far) to 1 (near)
}

export default function BackgroundFlowField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    // Scroll speed multiplier (subtle boost during scroll, decaying back when idle)
    let scrollSpeedMultiplier = 1.0;
    let targetScrollMultiplier = 1.0;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let scrollDecayTimeout: NodeJS.Timeout | null = null;

    // Global Intensity: 0.30 (Hero top / Existing Anim) to 1.0 (Standard) — NEVER ZERO!
    let currentIntensity = 0.35;
    let targetIntensity = 0.35;

    // Desktop particle count: 750 (mobile ~320)
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 320 : 750;
    const particles: Particle[] = [];

    // Dark NYRAFLOW Mode particle colors (white, soft silvers, slate grays)
    const particleColors = [
      "255, 255, 255", // Crisp White
      "241, 245, 249", // Soft White (slate-50)
      "203, 213, 225", // Slate-300
      "148, 163, 184", // Slate-400
      "100, 116, 139", // Slate-500
    ];

    const createParticle = (randomizePosition = true): Particle => {
      const depth = Math.pow(Math.random(), 1.4);
      const isHighlight = Math.random() < 0.08;

      const size = isHighlight ? 1.6 + Math.random() * 0.3 : 0.8 + depth * 0.6;
      const baseAlpha = isHighlight ? 0.85 : 0.28 + depth * 0.52;
      const colorIdx = Math.floor(Math.random() * particleColors.length);

      return {
        x: randomizePosition ? Math.random() * (width || 1920) : (Math.random() < 0.5 ? -10 : (width || 1920) + 10),
        y: randomizePosition ? Math.random() * (height || 1080) : Math.random() * (height || 1080),
        vx: 0,
        vy: 0,
        size,
        baseAlpha,
        alpha: baseAlpha,
        colorRgb: particleColors[colorIdx],
        glowSpeed: 0.008 + Math.random() * 0.015,
        glowPhase: Math.random() * Math.PI * 2,
        depth,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      // Capped DPR High-Resolution Backing Store
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Pre-seed particles across the ENTIRE viewport immediately on page load
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(true));
        }
      }

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
    };

    window.addEventListener("resize", resize);
    resize();

    // Scroll listener for dynamic speed multiplier
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      lastScrollY = currentScrollY;

      targetScrollMultiplier = Math.min(1.15, 1.0 + delta * 0.002);

      if (scrollDecayTimeout) clearTimeout(scrollDecayTimeout);
      scrollDecayTimeout = setTimeout(() => {
        targetScrollMultiplier = 1.0;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Dynamic Intensity Calculation (Hero & Existing Animation Integration)
    const evaluateIntensity = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const viewportCenterY = scrollY + vh * 0.5;

      // 1. HERO INTEGRATION: Smooth intensity from 0.30 at top of Hero to 1.0 at bottom of Hero
      const heroEl = document.querySelector("#hero");
      const heroHeight = heroEl ? heroEl.getBoundingClientRect().height : vh;

      if (scrollY < heroHeight) {
        const heroProgress = Math.min(1, Math.max(0, scrollY / heroHeight));
        targetIntensity = 0.30 + heroProgress * 0.70; // 0.30 -> 1.0
      } else {
        targetIntensity = 1.0;
      }

      // 2. EXISTING ANIMATION #2 EXCLUSION: Keep particles visible at ~0.35 (NEVER ZERO!) around #animated-services-section
      const animServicesEl = document.querySelector("#animated-services-section");
      if (animServicesEl) {
        const rect = animServicesEl.getBoundingClientRect();
        const topAbs = rect.top + scrollY;
        const bottomAbs = rect.bottom + scrollY;

        if (viewportCenterY >= topAbs - vh * 0.3 && viewportCenterY <= bottomAbs + vh * 0.3) {
          targetIntensity = 0.35; // Fades to 35% intensity, never 0
        }
      }
    };

    if (prefersReducedMotion) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", handleScroll);
      };
    }

    // Procedural Flow Field Vector Field
    const getFlowVector = (x: number, y: number, t: number) => {
      const scaleX = 0.0010;
      const scaleY = 0.0008;
      const timeScale = t * 0.00035;

      const angle =
        Math.sin(x * scaleX + timeScale) * Math.cos(y * scaleY - timeScale * 0.7) * Math.PI * 2 +
        Math.sin((x * 0.6 + y * 0.8) * 0.0005 + timeScale * 1.1) * Math.PI * 0.6;

      const baseSpeed = 0.30 * scrollSpeedMultiplier;
      return {
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
      };
    };

    // Main Autonomous Render Loop — CONTINUOUS 60FPS AT ALL TIMES
    const render = () => {
      time += 1;

      evaluateIntensity();

      // Smooth lerp intensity
      currentIntensity += (targetIntensity - currentIntensity) * 0.05;

      // Smooth lerp scroll speed multiplier back to 1.0 when idle
      scrollSpeedMultiplier += (targetScrollMultiplier - scrollSpeedMultiplier) * 0.05;

      // Deep Black Canvas Background (#000000) with fading trail overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, width, height);

      // Continuous Particle Simulation
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const flow = getFlowVector(p.x, p.y, time);

        const depthSpeed = 0.45 + p.depth * 0.55;
        p.vx += (flow.vx * depthSpeed - p.vx) * 0.05;
        p.vy += (flow.vy * depthSpeed - p.vy) * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        // Rare subtle glow phase modulation
        p.glowPhase += p.glowSpeed;
        const glowFactor = 1 + Math.sin(p.glowPhase) * 0.22;
        p.alpha = Math.min(1, Math.max(0.06, p.baseAlpha * glowFactor * currentIntensity));

        // Wrap / respawn particle if out of screen bounds
        if (p.x < -15 || p.x > width + 15 || p.y < -15 || p.y > height + 15) {
          particles[i] = createParticle(false);
          continue;
        }

        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ width: "100vw", height: "100dvh" }}
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

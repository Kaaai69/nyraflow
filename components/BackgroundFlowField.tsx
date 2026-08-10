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
  colorDark: string;    // rgb e.g. "255, 255, 255"
  colorLight: string;   // rgb e.g. "20, 22, 26"
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

    // Theme Interpolation: 0.0 = Dark (#000000), 1.0 = Light Warm Off-White (#F0EFEA)
    let currentThemeProgress = 0.0;
    let targetThemeProgress = 0.0;

    // Global Intensity: 0.22 (Hero top / Existing Anim) to 1.0 (Standard) — NEVER ZERO!
    let currentIntensity = 0.25;
    let targetIntensity = 0.25;

    // Desktop particle count: 750 (mobile ~320)
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 320 : 750;
    const particles: Particle[] = [];

    // Dark Mode particle colors (white, soft silvers, slate grays)
    const darkColors = [
      "255, 255, 255", // Crisp White
      "241, 245, 249", // Soft White (slate-50)
      "203, 213, 225", // Slate-300
      "148, 163, 184", // Slate-400
      "100, 116, 139", // Slate-500
    ];

    // Light Mode particle colors (charcoals, dark slate grays)
    const lightColors = [
      "20, 22, 26",    // Deep Charcoal / Near Black
      "30, 41, 59",    // Slate-800
      "51, 65, 85",    // Slate-700
      "71, 85, 105",   // Slate-600
      "100, 116, 139", // Slate-500
    ];

    const createParticle = (randomizePosition = true): Particle => {
      const depth = Math.pow(Math.random(), 1.4);
      const isHighlight = Math.random() < 0.08;

      const size = isHighlight ? 1.6 + Math.random() * 0.3 : 0.8 + depth * 0.6;
      const baseAlpha = isHighlight ? 0.85 : 0.28 + depth * 0.52;
      const colorIdx = Math.floor(Math.random() * darkColors.length);

      return {
        x: randomizePosition ? Math.random() * (width || 1920) : (Math.random() < 0.5 ? -10 : (width || 1920) + 10),
        y: randomizePosition ? Math.random() * (height || 1080) : Math.random() * (height || 1080),
        vx: 0,
        vy: 0,
        size,
        baseAlpha,
        alpha: baseAlpha,
        colorDark: darkColors[colorIdx],
        colorLight: lightColors[colorIdx],
        glowSpeed: 0.008 + Math.random() * 0.015,
        glowPhase: Math.random() * Math.PI * 2,
        depth,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Pre-seed particles across the entire viewport on load
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(true));
        }
      }

      ctx.fillStyle = currentThemeProgress > 0.5 ? "#F0EFEA" : "#000000";
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

    // Dynamic Chapter Theme & Intensity Calculation
    const evaluateChapterAndIntensity = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const viewportCenterY = scrollY + vh * 0.5;

      // 1. HERO INTEGRATION: Smooth intensity transition from 0.22 at top of Hero to 1.0 at bottom of Hero
      const heroEl = document.querySelector("#hero");
      const heroHeight = heroEl ? heroEl.getBoundingClientRect().height : vh;

      if (scrollY < heroHeight) {
        const heroProgress = Math.min(1, Math.max(0, scrollY / heroHeight));
        targetIntensity = 0.22 + heroProgress * 0.78; // 0.22 -> 1.0
      } else {
        targetIntensity = 1.0;
      }

      // 2. EXISTING ANIMATION #2 EXCLUSION: Keep particles visible at ~0.25 (NEVER ZERO!) around #animated-services-section
      const animServicesEl = document.querySelector("#animated-services-section");
      if (animServicesEl) {
        const rect = animServicesEl.getBoundingClientRect();
        const topAbs = rect.top + scrollY;
        const bottomAbs = rect.bottom + scrollY;

        if (viewportCenterY >= topAbs - vh * 0.25 && viewportCenterY <= bottomAbs + vh * 0.25) {
          targetIntensity = 0.25; // Fades to 25% intensity, never 0
        }
      }

      // 3. CHAPTER THEME EVALUATION:
      // CHAPTER 01 — DARK: Hero, Credibility, Problem, Metrics
      // CHAPTER 02 — LIGHT (#F0EFEA): WorkSection, ServicesSection (Portfolio / Concepts ONLY)
      // CHAPTER 03 — DARK: Everything else (AnimatedServices, Starter, Pricing, Team, Process, FAQ, Benefits, Contact, Footer)

      const workEl = document.querySelector("#work");
      const animServicesSectionEl = document.querySelector("#animated-services-section") || document.querySelector("#starter");

      const ch2Top = workEl ? workEl.getBoundingClientRect().top + scrollY : vh * 3;
      const ch3Top = animServicesSectionEl ? animServicesSectionEl.getBoundingClientRect().top + scrollY : vh * 5;

      const transitionZone = vh * 0.3; // 30vh smooth interpolation zone

      if (viewportCenterY < ch2Top - transitionZone) {
        // Chapter 01 - DARK
        targetThemeProgress = 0.0;
      } else if (viewportCenterY >= ch2Top - transitionZone && viewportCenterY < ch2Top) {
        // Transition into Chapter 02 LIGHT
        const p = (viewportCenterY - (ch2Top - transitionZone)) / transitionZone;
        targetThemeProgress = Math.min(1, Math.max(0, p));
      } else if (viewportCenterY >= ch2Top && viewportCenterY < ch3Top - transitionZone) {
        // Chapter 02 - LIGHT (#F0EFEA)
        targetThemeProgress = 1.0;
      } else if (viewportCenterY >= ch3Top - transitionZone && viewportCenterY < ch3Top) {
        // Transition back into Chapter 03 DARK
        const p = 1 - (viewportCenterY - (ch3Top - transitionZone)) / transitionZone;
        targetThemeProgress = Math.min(1, Math.max(0, p));
      } else {
        // Chapter 03 - DARK
        targetThemeProgress = 0.0;
      }
    };

    if (prefersReducedMotion) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(${p.colorDark}, ${p.baseAlpha})`;
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

    const interpolateRgb = (rgb1: string, rgb2: string, factor: number) => {
      const [r1, g1, b1] = rgb1.split(",").map(Number);
      const [r2, g2, b2] = rgb2.split(",").map(Number);
      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);
      return `${r}, ${g}, ${b}`;
    };

    // Main Autonomous Render Loop — CONTINUOUS 60FPS AT ALL TIMES
    const render = () => {
      time += 1;

      evaluateChapterAndIntensity();

      // Smooth lerp theme progress (Dark <-> Light Warm Off-White)
      currentThemeProgress += (targetThemeProgress - currentThemeProgress) * 0.04;

      // Smooth lerp intensity
      currentIntensity += (targetIntensity - currentIntensity) * 0.05;

      // Smooth lerp scroll speed multiplier back to 1.0 when idle
      scrollSpeedMultiplier += (targetScrollMultiplier - scrollSpeedMultiplier) * 0.05;

      // Background color: #000000 (Dark) to #F0EFEA (Light: rgb 240, 239, 234)
      const bgR = Math.round(0 + (240 - 0) * currentThemeProgress);
      const bgG = Math.round(0 + (239 - 0) * currentThemeProgress);
      const bgB = Math.round(0 + (234 - 0) * currentThemeProgress);

      // Fading trail overlay fill
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.16)`;
      ctx.fillRect(0, 0, width, height);

      // Continuous Particle Simulation (Runs non-stop even when stationary!)
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

        // Interpolate particle color based on current theme progress
        const activeRgb = interpolateRgb(p.colorDark, p.colorLight, currentThemeProgress);

        ctx.fillStyle = `rgba(${activeRgb}, ${p.alpha})`;
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

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

    // Scroll speed multiplier: 1.0 when idle, up to 1.15 when active
    let scrollSpeedMultiplier = 1.0;
    let targetScrollMultiplier = 1.0;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let scrollDecayTimeout: NodeJS.Timeout | null = null;

    // Continuous Theme & Intensity State
    // Theme: 0.0 = Dark (#000000), 1.0 = Light (#EDECE7)
    let currentThemeProgress = 0.0;
    let targetThemeProgress = 0.0;

    // Intensity: 0.3 (Hero top) to 1.0 (Standard) to 0.1 (Animated Services exclusion)
    let currentIntensity = 0.3;
    let targetIntensity = 0.3;

    // Particle pool setup: 750 desktop, 320 mobile
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

      // Pre-seed particles if empty across the entire initial viewport
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(true));
        }
      }

      // Initial fill
      ctx.fillStyle = currentThemeProgress > 0.5 ? "#EDECE7" : "#000000";
      ctx.fillRect(0, 0, width, height);
    };

    window.addEventListener("resize", resize);
    resize();

    // Scroll listener: subtle speed boost on active scroll, decaying smoothly to 1.0 when idle
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

    // Chapter Theme & Exclusion State Evaluation based on scroll position
    const evaluateChapterAndExclusion = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const viewportCenterY = scrollY + vh * 0.5;

      // Hero integration: Top of page intensity starts at 0.3, increases to 1.0 at bottom of Hero
      const heroEl = document.querySelector("#hero");
      const heroHeight = heroEl ? heroEl.getBoundingClientRect().height : vh;

      if (scrollY < heroHeight) {
        const heroProgress = scrollY / heroHeight;
        targetIntensity = 0.3 + heroProgress * 0.7; // Smoothly increases 0.3 -> 1.0
      } else {
        targetIntensity = 1.0;
      }

      // Animated Services Section exclusion: smooth fade out around #animated-services-section
      const animServicesEl = document.querySelector("#animated-services-section");
      if (animServicesEl) {
        const rect = animServicesEl.getBoundingClientRect();
        const topAbs = rect.top + scrollY;
        const bottomAbs = rect.bottom + scrollY;

        // Transition zone around animated services section
        if (viewportCenterY >= topAbs - vh * 0.3 && viewportCenterY <= bottomAbs + vh * 0.3) {
          targetIntensity = 0.1; // Smoothly dim to 10%
        }
      }

      // 5 Large Visual Chapters Evaluation:
      // Chapter 01 (Dark): Hero, Credibility, Problem
      // Chapter 02 (Light): Metrics, Work, Services
      // Chapter 03 (Dark): AnimatedServices, Starter, Pricing
      // Chapter 04 (Light): Team, Process
      // Chapter 05 (Dark): FAQ, Benefits, Contact, Footer

      const metricsEl = document.querySelector("#metrics");
      const starterEl = document.querySelector("#starter");
      const teamEl = document.querySelector("#team");
      const faqEl = document.querySelector("#faq");

      const ch2Top = metricsEl ? metricsEl.getBoundingClientRect().top + scrollY : vh * 2;
      const ch3Top = starterEl ? starterEl.getBoundingClientRect().top + scrollY : vh * 5;
      const ch4Top = teamEl ? teamEl.getBoundingClientRect().top + scrollY : vh * 8;
      const ch5Top = faqEl ? faqEl.getBoundingClientRect().top + scrollY : vh * 11;

      // Determine active chapter theme target with smooth blending zones
      if (viewportCenterY < ch2Top - vh * 0.2) {
        // Chapter 01 - DARK
        targetThemeProgress = 0.0;
      } else if (viewportCenterY >= ch2Top - vh * 0.2 && viewportCenterY < ch3Top - vh * 0.2) {
        // Chapter 02 - LIGHT (#EDECE7)
        targetThemeProgress = 1.0;
      } else if (viewportCenterY >= ch3Top - vh * 0.2 && viewportCenterY < ch4Top - vh * 0.2) {
        // Chapter 03 - DARK (#000000)
        targetThemeProgress = 0.0;
      } else if (viewportCenterY >= ch4Top - vh * 0.2 && viewportCenterY < ch5Top - vh * 0.2) {
        // Chapter 04 - LIGHT (#EDECE7)
        targetThemeProgress = 1.0;
      } else {
        // Chapter 05 - DARK (#000000)
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

    // Procedural Noise Vector Generator (multi-frequency computational fluid field)
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

    // Color RGB helper interpolation
    const interpolateRgb = (rgb1: string, rgb2: string, factor: number) => {
      const [r1, g1, b1] = rgb1.split(",").map(Number);
      const [r2, g2, b2] = rgb2.split(",").map(Number);
      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);
      return `${r}, ${g}, ${b}`;
    };

    // Main Autonomous Render Loop — CONTINUOUS 60FPS REGARDLESS OF SCROLL
    const render = () => {
      time += 1;

      // Evaluate chapter themes & exclusion targets based on Y position
      evaluateChapterAndExclusion();

      // Smoothly lerp theme progress (Dark <-> Light over ~350ms)
      currentThemeProgress += (targetThemeProgress - currentThemeProgress) * 0.045;

      // Smoothly lerp intensity (Hero transition & Exclusion fade)
      currentIntensity += (targetIntensity - currentIntensity) * 0.06;

      // Smoothly lerp scroll speed multiplier back to 1.0 when stationary
      scrollSpeedMultiplier += (targetScrollMultiplier - scrollSpeedMultiplier) * 0.05;

      // Background color: #000000 (Dark) to #EDECE7 (Light: rgb 237, 236, 231)
      const bgR = Math.round(0 + (237 - 0) * currentThemeProgress);
      const bgG = Math.round(0 + (236 - 0) * currentThemeProgress);
      const bgB = Math.round(0 + (231 - 0) * currentThemeProgress);

      // Fading trail effect: semi-transparent background overlay on each frame
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.16)`;
      ctx.fillRect(0, 0, width, height);

      // Continuous Particle Simulation & Rendering
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const flow = getFlowVector(p.x, p.y, time);

        // Fluid inertia speed calculation
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

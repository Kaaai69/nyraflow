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
  colorDark: string;    // rgb string e.g. "255, 255, 255"
  colorLight: string;   // rgb string e.g. "16, 17, 20"
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

    // Scroll speed multiplier interaction
    let scrollSpeedMultiplier = 1.0;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let scrollTimeout: NodeJS.Timeout | null = null;

    // Theme interpolation state (0 = Dark Theme #000000, 1 = Light Theme #F3F3EF)
    let currentThemeProgress = 0; // Current rendered theme value
    let targetThemeProgress = 0;  // Target theme value based on visible section

    // Exclusion fade state (1 = fully visible particles, 0 = faded out for 2 existing animations)
    let currentExclusionOpacity = 1;
    let targetExclusionOpacity = 1;

    // Desktop particle count: 750 (mobile ~350)
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 320 : 750;
    const particles: Particle[] = [];

    // Dark Mode particle colors (whites, soft silvers, slate grays)
    const darkColors = [
      "255, 255, 255", // Crisp White
      "241, 245, 249", // Soft White (slate-50)
      "203, 213, 225", // Slate-300
      "148, 163, 184", // Slate-400
      "100, 116, 139", // Slate-500
    ];

    // Light Mode particle colors (charcoals, dark grays, slate-800)
    const lightColors = [
      "16, 17, 20",    // Near Black
      "30, 41, 59",    // Slate-800
      "51, 65, 85",    // Slate-700
      "71, 85, 105",   // Slate-600
      "100, 116, 139", // Slate-500
    ];

    const createParticle = (randomizePosition = true): Particle => {
      const depth = Math.pow(Math.random(), 1.5);
      const isHighlight = Math.random() < 0.08;

      // Particle sizes: 0.8px to 1.4px, rare highlights up to 1.8px
      const size = isHighlight ? 1.6 + Math.random() * 0.3 : 0.8 + depth * 0.6;
      const baseAlpha = isHighlight ? 0.85 : 0.25 + depth * 0.55; // High contrast
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

      // Fill initial canvas state
      ctx.fillStyle = currentThemeProgress > 0.5 ? "#F3F3EF" : "#000000";
      ctx.fillRect(0, 0, width, height);

      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(true));
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();

    // Scroll listener: temporarily boosts particle speed multiplier during active scrolling
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      lastScrollY = currentScrollY;

      // Increase multiplier slightly (up to 1.22)
      scrollSpeedMultiplier = Math.min(1.22, 1.0 + delta * 0.003);

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Smoothly settles back to 1.0 when scroll stops
        scrollSpeedMultiplier = 1.0;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // IntersectionObserver to handle:
    // 1. Smooth Fade-Out Exclusion for the 2 Existing Animations (Hero & Animated Services)
    // 2. Light vs Dark section theme detection
    const setupObservers = () => {
      // 1. Existing Animations Observers
      const excludedElements = [
        document.querySelector("#hero"),
        document.querySelector("section:has(#nyraflow-logo)"),
        document.querySelector("#animated-services-section"),
      ].filter(Boolean);

      const animationObserver = new IntersectionObserver(
        (entries) => {
          const isAnyAnimationVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05);
          targetExclusionOpacity = isAnyAnimationVisible ? 0 : 1;
        },
        { threshold: [0, 0.05, 0.2] }
      );

      excludedElements.forEach((el) => el && animationObserver.observe(el));

      // 2. Light Theme Section Observers
      const lightSections = document.querySelectorAll("[data-theme='light'], #problem, #services, #starter, #pricing, #process");

      const themeObserver = new IntersectionObserver(
        (entries) => {
          const isLightVisible = Array.from(lightSections).some((el) => {
            const rect = el.getBoundingClientRect();
            return rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4;
          });

          targetThemeProgress = isLightVisible ? 1 : 0;
        },
        { threshold: [0.1, 0.3, 0.5] }
      );

      lightSections.forEach((el) => themeObserver.observe(el));

      return () => {
        animationObserver.disconnect();
        themeObserver.disconnect();
      };
    };

    const cleanupObservers = setupObservers();

    if (prefersReducedMotion) {
      // Static reduced motion rendering
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
        cleanupObservers();
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

      const baseSpeed = 0.28 * scrollSpeedMultiplier;
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

    // Animation Loop
    const render = () => {
      time += 1;

      // Smoothly interpolate theme progress (Dark <-> Light transition over ~500ms)
      currentThemeProgress += (targetThemeProgress - currentThemeProgress) * 0.06;

      // Smoothly interpolate exclusion opacity (Fade out for 2 existing animations)
      currentExclusionOpacity += (targetExclusionOpacity - currentExclusionOpacity) * 0.08;

      // Background color: #000000 (Dark) to #F3F3EF (Light: rgb 243, 243, 239)
      const bgR = Math.round(0 + (243 - 0) * currentThemeProgress);
      const bgG = Math.round(0 + (243 - 0) * currentThemeProgress);
      const bgB = Math.round(0 + (239 - 0) * currentThemeProgress);

      // Fading trail effect: semi-transparent background fill on each frame
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.15)`;
      ctx.fillRect(0, 0, width, height);

      // Only render particle points if global exclusion opacity > 0.01
      if (currentExclusionOpacity > 0.01) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const flow = getFlowVector(p.x, p.y, time);

          // Smooth inertia speed calculation
          const depthSpeed = 0.4 + p.depth * 0.6;
          p.vx += (flow.vx * depthSpeed - p.vx) * 0.045;
          p.vy += (flow.vy * depthSpeed - p.vy) * 0.045;

          p.x += p.vx;
          p.y += p.vy;

          // Rare subtle glow phase modulation
          p.glowPhase += p.glowSpeed;
          const glowFactor = 1 + Math.sin(p.glowPhase) * 0.2;
          p.alpha = Math.min(1, Math.max(0.05, p.baseAlpha * glowFactor * currentExclusionOpacity));

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
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      cleanupObservers();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

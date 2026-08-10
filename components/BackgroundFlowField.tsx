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
  color: string;
  glowSpeed: number;
  glowPhase: number;
  depth: number; // 0 (far) to 1 (near)
}

export default function BackgroundFlowField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    const PARTICLE_COUNT = 450;
    const particles: Particle[] = [];

    const colors = [
      "255, 255, 255",   // Bright white
      "226, 232, 240",   // Soft white / slate-100
      "148, 163, 184",   // Slate-400
      "71, 85, 105",     // Slate-600
      "30, 41, 59",      // Deep charcoal / slate-800
    ];

    const createParticle = (randomizePosition = true): Particle => {
      const depth = Math.pow(Math.random(), 1.8); // Bias slightly towards deeper particles
      const isClose = depth > 0.85;
      
      // Depth governs size, opacity, and speed
      const size = 0.5 + depth * 0.7; // ~0.5px to 1.2px
      const baseAlpha = 0.08 + depth * 0.55; // 0.08 (far) to 0.63 (near)
      const colorIndex = Math.floor(Math.random() * (isClose ? 3 : colors.length));
      
      return {
        x: randomizePosition ? Math.random() * (width || 1920) : (Math.random() < 0.5 ? 0 : width),
        y: randomizePosition ? Math.random() * (height || 1080) : Math.random() * height,
        vx: 0,
        vy: 0,
        size,
        baseAlpha,
        alpha: baseAlpha,
        color: colors[colorIndex],
        glowSpeed: 0.005 + Math.random() * 0.012,
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

      // Fill solid black on resize
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Re-populate particles if empty
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(true));
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();

    if (prefersReducedMotion) {
      // Draw static starfield for reduced motion preference
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(${p.color}, ${p.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    // Procedural Flow Field Vector Generator (trigonometric multi-frequency noise field)
    const getFlowVector = (x: number, y: number, t: number) => {
      const scaleX = 0.0012;
      const scaleY = 0.0010;
      const timeScale = t * 0.0003;

      // Multi-layer sine/cosine vector math producing calm, fluid curves
      const angle =
        Math.sin(x * scaleX + timeScale) * Math.cos(y * scaleY - timeScale * 0.8) * Math.PI * 2 +
        Math.sin((x + y) * 0.0006 + timeScale * 1.2) * Math.PI * 0.5;

      // Gentle repulsive pressure away from center-top text focus area
      const centerX = width * 0.5;
      const centerY = height * 0.4;
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;
      const calmRadiusSq = Math.pow(Math.min(width, height) * 0.35, 2);

      let repX = 0;
      let repY = 0;
      if (distSq < calmRadiusSq && distSq > 0) {
        const factor = (1 - distSq / calmRadiusSq) * 0.12;
        const len = Math.sqrt(distSq);
        repX = (dx / len) * factor;
        repY = (dy / len) * factor;
      }

      const speed = 0.22;
      return {
        vx: Math.cos(angle) * speed + repX,
        vy: Math.sin(angle) * speed + repY,
      };
    };

    // Main animation loop
    const render = () => {
      time += 1;

      // Extremely subtle fading trail: clear canvas with semi-transparent black overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Get fluid movement vector at particle location
        const flow = getFlowVector(p.x, p.y, time);

        // Smooth velocity interpolation (inertia prevents sudden movement spikes)
        const speedMult = 0.3 + p.depth * 0.7; // Near particles move faster
        p.vx += (flow.vx * speedMult - p.vx) * 0.04;
        p.vy += (flow.vy * speedMult - p.vy) * 0.04;

        p.x += p.vx;
        p.y += p.vy;

        // Rare subtle glow phase modulation
        p.glowPhase += p.glowSpeed;
        const glowFactor = 1 + Math.sin(p.glowPhase) * 0.25; // Subtle ±25% glow
        p.alpha = Math.min(1, Math.max(0.02, p.baseAlpha * glowFactor));

        // Respawn if particle wanders outside screen bounds
        if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
          particles[i] = createParticle(false);
          continue;
        }

        // Draw particle point
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.beginPath();

        // Apply slight depth of field blur for very close particles
        if (p.depth > 0.92) {
          ctx.shadowColor = `rgba(${p.color}, ${p.alpha * 0.5})`;
          ctx.shadowBlur = 1.5;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#000000]"
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

/**
 * Monochrome flowing-wave background.
 *
 * fbm noise with domain warping — one noise field distorting the coordinates of
 * another — which is what produces the continuously drifting wave bands.
 * Strictly black / white / grey: base is pure black, crests peak around
 * rgba(255,255,255,.10).
 *
 * Replaces the canvas-2D particle field: one fullscreen triangle on the GPU
 * instead of 750 particles integrated on the CPU each frame.
 */

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.03;
    a *= 0.55;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float t = uTime * 0.05;

  // Mouse parallax and scroll drift ride on top of the base coordinates.
  vec2 muv = uv + uMouse * 0.05;
  muv.y += uScroll * 0.55;

  // Squashed vertically so the noise stretches into horizontal bands: this is
  // what separates a wave field from isotropic smoke.
  vec2 wuv = muv * vec2(0.85, 2.1);

  // Domain warping: q distorts rr, rr distorts the final field.
  vec2 q = vec2(
    fbm(wuv * 1.5 + vec2(0.0, t)),
    fbm(wuv * 1.5 + vec2(5.2, 1.3) - t * 0.6)
  );
  vec2 rr = vec2(
    fbm(wuv * 1.5 + q * 1.6 + vec2(1.7, 9.2) + t * 0.3),
    fbm(wuv * 1.5 + q * 1.6 + vec2(8.3, 2.8) - t * 0.2)
  );
  float f = fbm(wuv * 1.5 + rr * 1.8);

  // Broad haze, then a second brighter pass on the crests only.
  float haze = smoothstep(0.28, 0.90, f) * 0.075;
  float crest = smoothstep(0.55, 1.00, f) * 0.075;

  // Crests of travelling waves. The warped field bends the phase, so the
  // bands undulate instead of reading as straight stripes.
  float phase = muv.y * 5.2 + f * 5.5 + rr.x * 2.6 - uTime * 0.28;
  float wave = 1.0 - abs(sin(phase));
  wave = pow(max(wave, 0.0), 2.6) * smoothstep(0.20, 0.75, f) * 0.070;

  float lum = haze + crest + wave;

  // Soft pool of light trailing the cursor.
  vec2 mp = uMouse * vec2(uRes.x, uRes.y) / min(uRes.x, uRes.y);
  lum += exp(-2.6 * length(uv - mp)) * 0.022;

  // Vignette keeps the edges of the page black.
  float vig = smoothstep(2.05, 0.30, length(uv));
  lum *= 0.30 + 0.70 * vig;

  // Fine grain, otherwise these low-luminance gradients band on dark panels.
  float grain = (hash21(gl_FragCoord.xy + fract(uTime) * 137.0) - 0.5) * 0.010;

  vec3 col = vec3(max(lum + grain, 0.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const FALLBACK_BACKGROUND =
  "radial-gradient(1200px 800px at 55% 35%, #121212, #000000 72%)";

export default function BackgroundWaves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      canvas.style.background = FALLBACK_BACKGROUND;
      return;
    }

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      canvas.style.background = FALLBACK_BACKGROUND;
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      canvas.style.background = FALLBACK_BACKGROUND;
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      canvas.style.background = FALLBACK_BACKGROUND;
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uScroll = gl.getUniformLocation(program, "uScroll");

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouse = { x: 0, y: 0 };
    const mouseTarget = { x: 0, y: 0 };
    let scroll = 0;
    let frameId = 0;
    const start = performance.now();

    const resize = () => {
      // Render below native resolution: the field is all low-frequency detail,
      // so full DPR buys nothing visible and costs fill rate.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;
      const w = Math.max(2, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (elapsed: number) => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const handlePointerMove = (event: PointerEvent) => {
      mouseTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const handleScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scroll = Math.min(1, Math.max(0, window.scrollY / max));
    };

    if (prefersReducedMotion) {
      // One static frame, no animation loop at all.
      handleScroll();
      draw(0);
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buffer);
      };
    }

    const render = () => {
      mouse.x += (mouseTarget.x - mouse.x) * 0.06;
      mouse.y += (mouseTarget.y - mouse.y) * 0.06;
      draw((performance.now() - start) / 1000);
      frameId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) {
        frameId = requestAnimationFrame(render);
      }
    };

    handleScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
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

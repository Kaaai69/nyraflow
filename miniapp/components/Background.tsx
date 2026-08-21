"use client";

import { useEffect, useRef } from "react";

/**
 * Фон мини-аппа — перенос BackgroundWaves с лендинга.
 *
 * Шейдер скопирован дословно, чтобы картинка в приложении и на сайте была
 * одной и той же: fbm-шум с искажением области даёт дрейфующие волновые
 * полосы, поверх идут два слоя звёзд, метеор раз в цикл, виньетка и зерно.
 *
 * Отличия от версии сайта — только про телефон:
 *  - разрешение рендера ниже (заполнение пикселей дороже всего на мобильных GPU);
 *  - нет слежения за курсором: на тач-экране его не существует, а световое
 *    пятно под ним осталось бы приклеенным к центру;
 *  - анимация останавливается, когда мини-апп уходит в фон.
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

// Sparse twinkling points. Only the top decile of cells gets one, so they read
// as scattered dust rather than a grid.
float starLayer(vec2 uv, float scale, float t) {
  vec2 p = uv * scale;
  vec2 i = floor(p);
  vec2 f = fract(p);
  float h = hash21(i);
  if (h < 0.90) return 0.0;
  vec2 sp = vec2(hash21(i + 7.13), hash21(i + 13.71));
  float d = length(f - sp);
  float tw = 0.55 + 0.45 * sin(t * (0.6 + h * 2.4) + h * 43.7);
  return smoothstep(0.10, 0.0, d) * tw;
}

// Distance from p to the segment ab — draws the meteor as a short streak
// rather than a dot.
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
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

  // Two star layers at different densities, drifting at different rates so the
  // field has depth. They sit slightly against the mouse for parallax.
  vec2 suv = uv - uMouse * 0.03;
  float stars = starLayer(suv + vec2(t * 0.01, 0.0), 14.0, uTime);
  stars += starLayer(suv * 1.7 + vec2(0.0, t * 0.015), 22.0, uTime * 1.3) * 0.7;
  lum += stars * 0.34;

  // A meteor crosses every CYCLE seconds, lit only over the first 7% of it.
  // floor(uTime / CYCLE) seeds the hashes, so each pass takes a new path.
  float cycle = 9.0;
  float ft = fract(uTime / cycle);
  float id = floor(uTime / cycle);
  if (ft < 0.10) {
    float pr = ft / 0.10;
    vec2 dir = normalize(vec2(0.8 + 0.3 * hash21(vec2(id, 3.0)), -0.5));
    vec2 start = vec2(-1.2 + 2.4 * hash21(vec2(id, 1.0)), 0.9);
    vec2 pos = start + dir * pr * 1.9;
    float dd = segDist(uv, pos - dir * 0.40, pos);
    // A tight core inside a wider halo, so the streak reads at a glance
    // without turning into a hard white line.
    float core = smoothstep(0.006, 0.0, dd);
    float halo = smoothstep(0.030, 0.0, dd);
    lum += (core * 0.85 + halo * 0.30) * (1.0 - pr);
  }

  // Pool of light trailing the cursor. It has to sit in the same range as the
  // wave crests (~0.15) to register at all — an order of magnitude below that
  // and moving the mouse changes nothing you can see.
  vec2 mp = uMouse * vec2(uRes.x, uRes.y) / min(uRes.x, uRes.y);
  float pool = exp(-2.1 * length(uv - mp));
  lum += pool * 0.10;

  // The same pool also lifts whatever is already there, so the field brightens
  // under the cursor instead of just having a disc laid over it.
  lum *= 1.0 + pool * 0.9;

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

export function Background() {
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

    let scroll = 0;
    let frameId = 0;
    const start = performance.now();

    const resize = () => {
      // Поле состоит из низкочастотных деталей, поэтому полное разрешение
      // ничего не добавляет глазу, но стоит заполнения. На телефоне режем
      // сильнее, чем на сайте: 0.55 против 0.7.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.55;
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
      gl.uniform2f(uMouse, 0, 0);
      gl.uniform1f(uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      // uMouse остаётся в нуле: световое пятно под курсором на тач-экране
      // выродилось бы в неподвижное светлое место посреди экрана.
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
    document.addEventListener("visibilitychange", handleVisibility);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
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

"use client";

import { useSyncExternalStore } from "react";

// Высота видимой области и состояние клавиатуры.
//
// Единицы dvh в мобильном вебвью пересчитываются рывком: клавиатура выезжает,
// высота меняется скачком, и всё, что прижато к низу, дёргается. visualViewport
// сообщает реальную высоту, но и он на iOS присылает всего пару событий за всё
// движение клавиатуры — поэтому значение не пишется напрямую, а догоняется по
// кадрам: раскладка едет вслед за клавиатурой, а не телепортируется.
//
// Высота живёт в CSS-переменной --app-vh, а не в React-состоянии: перерисовывать
// дерево на каждый кадр движения клавиатуры незачем. Наружу отдаётся только факт
// «клавиатура открыта» — он меняется дважды за сеанс ввода, и на него уже можно
// подписываться компонентом.

/** Ниже этого прироста — не клавиатура, а панель подсказок или адресная строка. */
const KEYBOARD_THRESHOLD = 120;

/** Доля оставшегося пути за кадр: ~200 мс до цели при 60 fps. */
const FOLLOW = 0.24;

let watchers = 0;
let detach: (() => void) | null = null;
let keyboardOpen = false;
const listeners = new Set<() => void>();

function isEditing(): boolean {
  const element = document.activeElement;
  if (!element) return false;
  const tag = element.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || (element as HTMLElement).isContentEditable;
}

function attach(): () => void {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const read = () => Math.round(viewport?.height ?? window.innerHeight);

  // Высота без клавиатуры. Меряется всякий раз, когда фокуса в поле нет:
  // сравнивать с window.innerHeight нельзя — на Android вебвью ужимает и его.
  let stable = read();
  let current = stable;
  let target = stable;
  let frame = 0;
  let primed = false;

  const write = (value: number) => root.style.setProperty("--app-vh", `${Math.round(value)}px`);

  const tick = () => {
    const delta = target - current;
    if (Math.abs(delta) < 0.5) {
      current = target;
      write(current);
      frame = 0;
      return;
    }
    current += delta * FOLLOW;
    write(current);
    frame = requestAnimationFrame(tick);
  };

  const apply = () => {
    const height = read();
    const editing = isEditing();

    if (!editing) stable = height;
    const inset = Math.max(0, stable - height);

    target = height;
    if (!primed || reduced) {
      // Первый замер и режим без анимаций — сразу в точку.
      primed = true;
      current = height;
      write(current);
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }

    const open = editing && inset > KEYBOARD_THRESHOLD;
    if (open !== keyboardOpen) {
      keyboardOpen = open;
      for (const listener of listeners) listener();
    }

    // iOS прокручивает саму страницу, чтобы показать поле под клавиатурой, и
    // шапка уезжает за верхний край. Возвращаем её на место.
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  };

  apply();

  if (viewport) {
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
  }
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    if (viewport) {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
    }
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
  };
}

/**
 * Включает слежение за высотой. Слушатели общие на всё приложение: экраны
 * вызывают эту функцию каждый сам за себя, а подписка заводится одна.
 */
export function watchViewportHeight(): () => void {
  if (typeof window === "undefined") return () => {};

  watchers += 1;
  if (watchers === 1) detach = attach();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    watchers -= 1;
    if (watchers === 0 && detach) {
      detach();
      detach = null;
    }
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const stop = watchViewportHeight();
  return () => {
    listeners.delete(listener);
    stop();
  };
}

/** Открыта ли клавиатура. Экран с полем ввода ужимается по этому признаку. */
export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => keyboardOpen,
    () => false,
  );
}

"use client";

// Высота видимой области.
//
// Единицы dvh в мобильном вебвью пересчитываются рывком: клавиатура
// выезжает, высота меняется скачком, и всё, что прижато к низу, дёргается.
// visualViewport сообщает реальную высоту непрерывно, пока клавиатура едет,
// поэтому раскладка успевает за ней плавно.
//
// Значение кладём в CSS-переменную --app-vh, чтобы им пользовались обычные
// классы, а не React-состояние: перерисовывать дерево на каждый кадр
// движения клавиатуры незачем.

export function watchViewportHeight(): () => void {
  if (typeof window === "undefined") return () => {};

  const root = document.documentElement;

  const apply = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty("--app-vh", `${Math.round(height)}px`);
  };

  apply();

  const viewport = window.visualViewport;
  if (viewport) {
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
  }
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);

  return () => {
    if (viewport) {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
    }
    window.removeEventListener("resize", apply);
    window.removeEventListener("orientationchange", apply);
  };
}

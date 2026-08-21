"use client";

// Клиентские хелперы поверх Telegram WebApp.
//
// Все обращения защищены проверкой на наличие объекта: в обычном браузере
// (а мы там же и отлаживаем) window.Telegram отсутствует, и приложение
// обязано работать без него, просто без нативных возможностей.

export function getWebApp() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function isInsideTelegram(): boolean {
  return Boolean(getWebApp()?.initData);
}

/** initData для заголовка авторизации. Пустая строка вне Telegram. */
export function getInitData(): string {
  return getWebApp()?.initData ?? "";
}

/** Сообщает Telegram, что интерфейс готов, и разворачивает окно на весь экран. */
export function initTelegram(): void {
  const app = getWebApp();
  if (!app) return;
  app.ready();
  if (!app.isExpanded) app.expand();
}

export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  getWebApp()?.HapticFeedback?.impactOccurred(style);
}

export function hapticSuccess(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred("success");
}

/**
 * Нативная кнопка «назад» в шапке Telegram. Возвращает функцию отписки —
 * без неё обработчики копятся при каждом переходе между шагами.
 */
export function bindBackButton(visible: boolean, onBack: () => void): () => void {
  const app = getWebApp();
  if (!app) return () => {};

  const { BackButton } = app;
  if (visible) {
    BackButton.onClick(onBack);
    BackButton.show();
  } else {
    BackButton.hide();
  }

  return () => {
    BackButton.offClick(onBack);
  };
}

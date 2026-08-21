"use client";

import { useEffect, useState, type ReactNode } from "react";

import { BriefFlow } from "@/components/brief/BriefFlow";
import { LeadFeed } from "@/components/admin/LeadFeed";
import { ProjectView } from "@/components/client/ProjectView";
import { Splash } from "@/components/Splash";
import { api } from "@/lib/api-client";
import { initTelegram, isInsideTelegram } from "@/lib/telegram/webapp";
import { watchViewportHeight } from "@/lib/telegram/viewport";

// Что показать при входе.
//
// Роль знает только сервер, поэтому спрашиваем её у /api/me. Команда попадает
// в ленту заявок, все остальные — в бриф. Админ может переключиться на бриф
// вручную: иначе он не сможет проверить то, что видит клиент.

type MeResponse = { user: { role: "guest" | "client" | "admin"; firstName: string | null } };

type State =
  | { name: "loading" }
  | { name: "admin" }
  | { name: "project" }
  | { name: "brief" };

// Сколько заставка держится минимум. Ответ сервера приходит за десятки
// миллисекунд, и без этой паузы название успевало бы только моргнуть.
const SPLASH_MIN_MS = 1600;
const SPLASH_FADE_MS = 800;

export function AppRoot() {
  const [state, setState] = useState<State>({ name: "loading" });
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    initTelegram();
    const stopViewport = watchViewportHeight();

    const startedAt = Date.now();
    let cancelled = false;

    /** Показываем экран не раньше, чем заставка отработает своё. */
    const reveal = (next: State) => {
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        if (cancelled) return;
        setState(next);
        setSplashLeaving(true);
        window.setTimeout(() => {
          if (!cancelled) setSplashGone(true);
        }, SPLASH_FADE_MS);
      }, wait);
    };

    // Вне Telegram подписи нет и роль не установить — показываем бриф,
    // чтобы приложение оставалось отлаживаемым в обычном браузере.
    if (!isInsideTelegram()) {
      reveal({ name: "brief" });
      return () => {
        cancelled = true;
        stopViewport();
      };
    }

    api
      .get<MeResponse>("/api/me")
      .then((result) => {
        if (cancelled) return;
        // Ветвим объект целиком: тернарный оператор внутри поля даёт тип
        // { name: "brief" | "admin" }, который не подходит размеченному объединению.
        if (result.user.role === "admin") {
          reveal({ name: "admin" });
        } else if (result.user.role === "client") {
          reveal({ name: "project" });
        } else {
          reveal({ name: "brief" });
        }
      })
      .catch(() => {
        if (!cancelled) reveal({ name: "brief" });
      });

    return () => {
      cancelled = true;
      stopViewport();
    };
  }, []);

  // Заставка лежит поверх приложения и растворяется, а не сменяется кадром:
  // содержимое к этому моменту уже отрисовано под ней.
  const splash = splashGone ? null : <Splash leaving={splashLeaving} />;

  /**
   * Содержимое проступает навстречу уходящей заставке.
   *
   * Без этого получался не переход, а исчезновение надписи: заставка
   * прозрачная, и приложение под ней всё это время видно на полную яркость.
   */
  const reveal = (screen: ReactNode) => (
    <>
      <div className="animate-[surface_900ms_cubic-bezier(0.22,1,0.36,1)_both]">{screen}</div>
      {splash}
    </>
  );

  if (state.name === "loading") {
    return splash;
  }

  if (state.name === "admin") {
    // Команде нужны оба клиентских экрана: проверять продукт глазами клиента
    // приходится регулярно, а роль админа их обычным путём не показывает.
    return reveal(
      <LeadFeed
        switcher={
          <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
            <button
              type="button"
              onClick={() => setState({ name: "project" })}
              className="rounded-full border border-white/15 bg-black/90 px-4 py-2.5 text-sm text-white/70 backdrop-blur"
            >
              Кабинет
            </button>
            <button
              type="button"
              onClick={() => setState({ name: "brief" })}
              className="rounded-full border border-white/15 bg-black/90 px-4 py-2.5 text-sm text-white/70 backdrop-blur"
            >
              Бриф
            </button>
          </div>
        }
      />,
    );
  }

  if (state.name === "project") {
    return reveal(<ProjectView onOpenBrief={() => setState({ name: "brief" })} />);
  }

  return reveal(<BriefFlow />);
}

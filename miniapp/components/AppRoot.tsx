"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { BriefFlow } from "@/components/brief/BriefFlow";
import { BriefStatusView, isLeadPending, type LeadState } from "@/components/brief/BriefStatusView";
import { LeadFeed } from "@/components/admin/LeadFeed";
import { ProjectView } from "@/components/client/ProjectView";
import { Splash } from "@/components/Splash";
import { ModeSwitcher, type AppMode } from "@/components/admin/ModeSwitcher";
import { api } from "@/lib/api-client";
import { initTelegram, isInsideTelegram } from "@/lib/telegram/webapp";
import { watchViewportHeight } from "@/lib/telegram/viewport";

// Что показать при входе.
//
// Роль знает только сервер, поэтому спрашиваем её у /api/me. Команда попадает
// в ленту заявок, клиент — в кабинет проекта, отправивший бриф — на экран
// ожидания, остальные — в бриф. Админ может переключиться вручную: иначе он не
// сможет проверить то, что видит клиент.

type MeResponse = {
  user: { role: "guest" | "client" | "admin"; firstName: string | null };
  lead: LeadState | null;
};

type State =
  | { name: "loading" }
  | { name: "admin" }
  | { name: "project" }
  | { name: "status" }
  | { name: "brief" };

// Сколько заставка держится минимум. Ответ сервера приходит за десятки
// миллисекунд, и без этой паузы название успевало бы только моргнуть.
const SPLASH_MIN_MS = 1600;
const SPLASH_FADE_MS = 800;

/** Экран по ответу сервера. Заявка важнее пустого брифа, роль важнее заявки. */
function screenFor(result: MeResponse): State {
  if (result.user.role === "admin") return { name: "admin" };
  if (result.user.role === "client") return { name: "project" };
  if (isLeadPending(result.lead)) return { name: "status" };
  return { name: "brief" };
}

export function AppRoot() {
  const [state, setState] = useState<State>({ name: "loading" });
  const [lead, setLead] = useState<LeadState | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    initTelegram();
    const stopViewport = watchViewportHeight();

    const startedAt = Date.now();
    cancelled.current = false;

    /** Показываем экран не раньше, чем заставка отработает своё. */
    const reveal = (next: State) => {
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        if (cancelled.current) return;
        setState(next);
        setSplashLeaving(true);
        window.setTimeout(() => {
          if (!cancelled.current) setSplashGone(true);
        }, SPLASH_FADE_MS);
      }, wait);
    };

    // Вне Telegram подписи нет и роль не установить — показываем бриф,
    // чтобы приложение оставалось отлаживаемым в обычном браузере.
    if (!isInsideTelegram()) {
      reveal({ name: "brief" });
      return () => {
        cancelled.current = true;
        stopViewport();
      };
    }

    api
      .get<MeResponse>("/api/me")
      .then((result) => {
        if (cancelled.current) return;
        setLead(result.lead);
        setIsAdmin(result.user.role === "admin");
        reveal(screenFor(result));
      })
      .catch(() => {
        if (!cancelled.current) reveal({ name: "brief" });
      });

    return () => {
      cancelled.current = true;
      stopViewport();
    };
  }, []);

  /**
   * Перечитать состояние заявки.
   *
   * Статус двигает команда, а не приложение, поэтому экран ожидания сам просит
   * свежие данные. Ручной выбор режима у админа при этом не сбрасывается:
   * подменяем экран, только пока человек стоит на ожидании.
   */
  const refresh = useCallback(async () => {
    try {
      const result = await api.get<MeResponse>("/api/me");
      if (cancelled.current) return;
      setLead(result.lead);
      setState((current) => (current.name === "status" ? screenFor(result) : current));
    } catch {
      // Не страшно: экран остаётся на прежних данных до следующей попытки.
    }
  }, []);

  // Ссылка на обновление обязана быть постоянной: экран ожидания вешает на неё
  // таймер, и новая функция на каждый рендер сбрасывала бы его.
  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

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

  const screen =
    state.name === "admin" ? (
      <LeadFeed />
    ) : state.name === "project" ? (
      <ProjectView onOpenBrief={() => setState({ name: "brief" })} />
    ) : state.name === "status" && lead ? (
      <BriefStatusView
        lead={lead}
        onNewBrief={() => setState({ name: "brief" })}
        onRefresh={handleRefresh}
      />
    ) : (
      <BriefFlow />
    );

  return reveal(
    // Высота фиксирована по видимой области, прокручивается только содержимое:
    // полоса переключения остаётся на месте и ни на что не наезжает.
    <div className="flex h-[var(--app-vh,100dvh)] flex-col">
      {isAdmin ? (
        <ModeSwitcher
          // Ожидание — это тот же режим брифа, только заявка уже отправлена.
          current={state.name === "status" ? "brief" : (state.name as AppMode)}
          // «Бриф» открывает то же, что увидел бы клиент: с открытой заявкой —
          // экран ожидания, оттуда одна кнопка ведёт к самой анкете.
          onChange={(mode) =>
            setState(
              mode === "brief" && isLeadPending(lead)
                ? { name: "status" }
                : ({ name: mode } as State),
            )
          }
        />
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">{screen}</div>
    </div>,
  );
}

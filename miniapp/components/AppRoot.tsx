"use client";

import { useEffect, useState } from "react";

import { BriefFlow } from "@/components/brief/BriefFlow";
import { LeadFeed } from "@/components/admin/LeadFeed";
import { ProjectView } from "@/components/client/ProjectView";
import { api } from "@/lib/api-client";
import { initTelegram, isInsideTelegram } from "@/lib/telegram/webapp";

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

export function AppRoot() {
  const [state, setState] = useState<State>({ name: "loading" });

  useEffect(() => {
    initTelegram();

    // Вне Telegram подписи нет и роль не установить — показываем бриф,
    // чтобы приложение оставалось отлаживаемым в обычном браузере.
    if (!isInsideTelegram()) {
      setState({ name: "brief" });
      return;
    }

    let cancelled = false;
    api
      .get<MeResponse>("/api/me")
      .then((result) => {
        if (cancelled) return;
        // Ветвим объект целиком: тернарный оператор внутри поля даёт тип
        // { name: "brief" | "admin" }, который не подходит размеченному объединению.
        if (result.user.role === "admin") {
          setState({ name: "admin" });
        } else if (result.user.role === "client") {
          setState({ name: "project" });
        } else {
          setState({ name: "brief" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ name: "brief" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.name === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </main>
    );
  }

  if (state.name === "admin") {
    // Команде нужны оба клиентских экрана: проверять продукт глазами клиента
    // приходится регулярно, а роль админа их обычным путём не показывает.
    return (
      <>
        <LeadFeed />
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
      </>
    );
  }

  if (state.name === "project") {
    return <ProjectView onOpenBrief={() => setState({ name: "brief" })} />;
  }

  return <BriefFlow />;
}

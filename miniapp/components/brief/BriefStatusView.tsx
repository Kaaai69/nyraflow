"use client";

import { useCallback, useEffect, useState } from "react";

import { AnalysisView } from "@/components/brief/AnalysisView";
import { WaitingMark } from "@/components/brief/WaitingMark";
import type { BriefAnalysis } from "@/lib/ai/schema";
import { api } from "@/lib/api-client";
import { bindBackButton, haptic, hapticSuccess } from "@/lib/telegram/webapp";

// Экран между отправкой брифа и ответом команды.
//
// Мини-апп открывается с нуля при каждом входе, и раньше человек, уже
// отправивший бриф, видел пустую анкету: заявка как будто не дошла. Здесь он
// видит, что она на месте, на каком она шаге и когда ждать ответа. Разбор
// перечитывается отсюда же — он уже посчитан и лежит в базе.

export type LeadState = {
  id: string;
  status: "new" | "qualified" | "in_work" | "won" | "lost";
  createdAt: string;
  briefId: string | null;
  briefStatus: "draft" | "submitted" | "analyzed" | "failed" | null;
  hasAnalysis: boolean;
};

/** Заявка ещё живёт: показываем ожидание, а не чистый бриф. */
export function isLeadPending(lead: LeadState | null): lead is LeadState {
  return Boolean(lead && lead.status !== "lost");
}

type StepState = "done" | "active" | "idle";
type Step = { title: string; note?: string; state: StepState };

type AnalysisResponse = {
  briefId: string;
  analysis: BriefAnalysis;
  meta: { isFallback: boolean };
};

const HEADLINES: Record<LeadState["status"], { title: string; text: string }> = {
  new: {
    title: "Бриф на рассмотрении",
    text: "Заявка у нас. Смотрим задачу и вернёмся с ответом в этот чат.",
  },
  qualified: {
    title: "Заявка у команды",
    text: "Мы разобрали ответы и готовим предложение. Напишем в этом чате.",
  },
  in_work: {
    title: "Взяли задачу в работу",
    text: "Дальше всё по проекту будет здесь же — этапы, задачи и согласования.",
  },
  won: {
    title: "Работаем над задачей",
    text: "Проект открыт. Этапы и согласования появятся в кабинете.",
  },
  lost: {
    title: "Заявка закрыта",
    text: "По этой задаче мы уже ответили. Если появилась новая — расскажите о ней.",
  },
};

/** Когда отправлено: сегодня и вчера человек помнит по времени, дальше — по дате. */
function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return `сегодня в ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `вчера в ${time}`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function buildSteps(lead: LeadState): Step[] {
  const analysisReady = lead.hasAnalysis || lead.briefStatus === "failed";
  const atTeam = lead.status === "in_work" || lead.status === "won";

  return [
    { title: "Бриф получен", note: formatWhen(lead.createdAt), state: "done" },
    {
      title: lead.hasAnalysis
        ? "Разбор собран"
        : lead.briefStatus === "failed"
          ? "Разбор соберём руками"
          : "Собираем разбор",
      state: analysisReady ? "done" : "active",
    },
    {
      title: "Смотрим задачу командой",
      state: atTeam ? "done" : analysisReady ? "active" : "idle",
    },
    {
      title: "Отвечаем в этом чате",
      note: atTeam ? undefined : "обычно в течение рабочего дня",
      state: atTeam ? "active" : "idle",
    },
  ];
}

type Props = {
  lead: LeadState;
  /** Перепройти бриф с новой задачей. */
  onNewBrief: () => void;
  /** Перечитать состояние заявки: статус меняет команда, а не приложение. */
  onRefresh: () => void;
};

export function BriefStatusView({ lead, onNewBrief, onRefresh }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [discussState, setDiscussState] = useState<"idle" | "sending" | "sent">("idle");

  // Статус двигает команда из своей ленты — приложение узнаёт об этом, только
  // если спросит. Спрашиваем редко и лишь когда экран действительно видно.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") onRefresh();
    }, 45_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") onRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onRefresh]);

  const closeAnalysis = useCallback(() => setReading(false), []);

  useEffect(() => bindBackButton(reading, closeAnalysis), [reading, closeAnalysis]);

  const openAnalysis = useCallback(async () => {
    if (!lead.briefId) return;
    haptic("light");

    if (analysis) {
      setReading(true);
      return;
    }

    setLoading(true);
    try {
      setAnalysis(await api.get<AnalysisResponse>(`/api/brief/${lead.briefId}`));
      setReading(true);
    } catch {
      // Разбора может не быть, если он не сохранился: экран ожидания при этом
      // остаётся верным, поэтому просто прячем кнопку до следующего входа.
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [analysis, lead.briefId]);

  const discuss = useCallback(async () => {
    if (!lead.briefId || discussState !== "idle") return;
    setDiscussState("sending");
    try {
      await api.post(`/api/brief/${lead.briefId}/discuss`, {});
      hapticSuccess();
      setDiscussState("sent");
      onRefresh();
    } catch {
      setDiscussState("idle");
    }
  }, [discussState, lead.briefId, onRefresh]);

  if (reading && analysis) {
    return (
      <main className="min-h-full animate-[surface_600ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <AnalysisView
          analysis={analysis.analysis}
          isFallback={analysis.meta.isFallback}
          onDiscuss={() => void discuss()}
          discussState={discussState}
        />
      </main>
    );
  }

  const headline = HEADLINES[lead.status];
  const steps = buildSteps(lead);
  const waiting = lead.status === "new" || lead.status === "qualified";
  // Пока заявка не разобрана командой, человеку доступно единственное действие —
  // попросить ответить быстрее. Оно же переводит заявку в «на разборе».
  const canDiscuss = lead.status === "new" && Boolean(lead.briefId);

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <WaitingMark />

      <header className="flex flex-col gap-3">
        <h1
          className={`text-2xl leading-snug font-medium ${waiting ? "text-waiting" : ""}`}
        >
          {headline.title}
        </h1>
        <p className="max-w-xs text-[15px] leading-relaxed text-white/55">{headline.text}</p>
      </header>

      <ol className="flex w-full max-w-xs flex-col text-left">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex animate-[fade-up_700ms_cubic-bezier(0.22,1,0.36,1)_both] gap-4"
            style={{ animationDelay: `${200 + index * 110}ms` }}
          >
            <div className="flex flex-col items-center">
              <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                {step.state === "active" ? (
                  <span className="absolute -inset-1.5 animate-[breathe_2400ms_ease-in-out_infinite] rounded-full bg-white/20" />
                ) : null}
                <span
                  className={`relative h-2.5 w-2.5 rounded-full ${
                    step.state === "done"
                      ? "bg-white/45"
                      : step.state === "active"
                        ? "bg-white"
                        : "bg-white/15"
                  }`}
                />
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={`w-px flex-1 ${step.state === "done" ? "bg-white/25" : "bg-white/10"}`}
                />
              ) : null}
            </div>

            <span
              className={`pb-5 text-[15px] leading-snug ${
                step.state === "active"
                  ? "text-white"
                  : step.state === "done"
                    ? "text-white/55"
                    : "text-white/30"
              }`}
            >
              {step.title}
              {step.note ? (
                <span className="mt-0.5 block text-sm text-white/35">{step.note}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {lead.hasAnalysis && lead.briefId ? (
          <button
            type="button"
            onClick={() => void openAnalysis()}
            disabled={loading}
            className="w-full rounded-xl bg-white py-4 text-[15px] font-medium text-black transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Открываем…" : "Перечитать разбор"}
          </button>
        ) : null}

        {canDiscuss ? (
          discussState === "sent" ? (
            <p className="text-sm text-white/50">Передали команде — напишем в этом чате.</p>
          ) : (
            <button
              type="button"
              onClick={() => void discuss()}
              disabled={discussState === "sending"}
              className="w-full rounded-xl border border-white/15 py-4 text-[15px] text-white/75 disabled:opacity-50"
            >
              {discussState === "sending" ? "Отправляем…" : "Попросить связаться"}
            </button>
          )
        ) : null}

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onNewBrief();
          }}
          className="self-center text-sm text-white/35 underline underline-offset-4"
        >
          Рассказать о другой задаче
        </button>
      </div>
    </main>
  );
}

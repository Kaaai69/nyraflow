"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { briefQuestions, MAX_ANSWER_LENGTH, type BriefAnswers } from "@/content/brief";
import { api, ApiRequestError } from "@/lib/api-client";
import type { BriefAnalysis } from "@/lib/ai/schema";
import { bindBackButton, haptic, hapticSuccess, initTelegram, isInsideTelegram } from "@/lib/telegram/webapp";
import { AnalysisView } from "@/components/brief/AnalysisView";

// Бриф по одному вопросу на экран.
//
// Восемь полей одним списком читаются как анкета в налоговой; по одному —
// как разговор. Ответы держим в localStorage: человек закрывает мини-апп на
// полпути чаще, чем хотелось бы, и терять его текст нельзя.

const STORAGE_KEY = "nyraflow-desk-brief-v1";

type SubmitResponse = {
  briefId: string;
  analysis: BriefAnalysis;
  meta: { isFallback: boolean; latencyMs: number };
};

type Stage =
  | { name: "filling" }
  | { name: "submitting" }
  | { name: "done"; briefId: string; analysis: BriefAnalysis; isFallback: boolean }
  | { name: "error"; message: string };

function loadSaved(): BriefAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BriefAnswers) : {};
  } catch {
    return {};
  }
}

/**
 * Сообщение об ошибке обязано говорить, что случилось и что делать. Одна
 * отписка «проверьте связь» на все случаи не помогает ни клиенту, ни нам:
 * на боевом телефоне она скрыла настоящую причину отказа.
 */
function describeError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return "Связь с сервером прервалась. Ответы сохранены — попробуйте отправить ещё раз.";
  }

  const question = (id?: string) => briefQuestions.find((q) => q.id === id)?.title;

  switch (error.info.error) {
    case "rate_limited":
      return "Сегодня уже отправлено пять брифов с этого аккаунта. Попробуйте завтра или напишите нам в чат.";
    case "no_init_data":
      return "Откройте приложение через меню бота в Telegram — иначе мы не поймём, кто вы.";
    case "expired":
      return "Приложение было открыто слишком давно. Закройте его и откройте заново через меню бота.";
    case "bad_hash":
      return "Не удалось подтвердить вход. Закройте приложение и откройте его через меню бота заново.";
    case "blocked":
      return "Доступ к приложению закрыт. Напишите нам в чат, разберёмся.";
    case "too_short": {
      const title = question(error.info.field);
      return title
        ? `Ответ на вопрос «${title}» слишком короткий — допишите пару предложений.`
        : "Один из ответов слишком короткий — вернитесь и допишите его.";
    }
    case "required": {
      const title = question(error.info.field);
      return title ? `Не заполнен вопрос «${title}».` : "Один из обязательных вопросов не заполнен.";
    }
    case "too_long":
      return "Один из ответов слишком длинный — сократите его.";
    case "analysis_failed":
      return "Бриф сохранён, но разбор собрать не удалось. Мы уже видим вашу заявку и свяжемся сами.";
    default:
      return "Не получилось отправить бриф. Ответы сохранены — попробуйте ещё раз через минуту.";
  }
}

export function BriefFlow() {
  const [answers, setAnswers] = useState<BriefAnswers>({});
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<Stage>({ name: "filling" });
  const [touched, setTouched] = useState(false);
  const [discussState, setDiscussState] = useState<"idle" | "sending" | "sent">("idle");
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const question = briefQuestions[step]!;
  const value = answers[question.id] ?? "";
  const tooShort = question.required && value.trim().length < question.minLength;
  const isLast = step === briefQuestions.length - 1;

  // Восстановление черновика — только на клиенте, чтобы не разошлась гидрация.
  useEffect(() => {
    initTelegram();
    setAnswers(loadSaved());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // приватный режим или переполненное хранилище — черновик не критичен
    }
  }, [answers]);

  const goBack = useCallback(() => {
    setTouched(false);
    setStep((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    const unbind = bindBackButton(step > 0 && stage.name === "filling", goBack);
    return unbind;
  }, [step, stage.name, goBack]);

  const submit = useCallback(async (finalAnswers: BriefAnswers) => {
    setStage({ name: "submitting" });
    try {
      const result = await api.post<SubmitResponse>("/api/brief", { answers: finalAnswers });
      hapticSuccess();
      setStage({
        name: "done",
        briefId: result.briefId,
        analysis: result.analysis,
        isFallback: result.meta.isFallback,
      });
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // не страшно
      }
    } catch (error) {
      setStage({ name: "error", message: describeError(error) });
    }
  }, []);

  const next = useCallback(() => {
    if (tooShort) {
      setTouched(true);
      haptic("light");
      return;
    }
    haptic("light");
    setTouched(false);

    if (isLast) {
      void submit(answers);
      return;
    }

    setStep((current) => current + 1);
    fieldRef.current?.blur();
  }, [answers, isLast, submit, tooShort]);

  const discuss = useCallback(async () => {
    if (stage.name !== "done") return;
    setDiscussState("sending");
    try {
      await api.post(`/api/brief/${stage.briefId}/discuss`, {});
      hapticSuccess();
      setDiscussState("sent");
    } catch {
      setDiscussState("idle");
    }
  }, [stage]);

  if (stage.name === "submitting") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-[15px] text-white/70">Разбираем задачу</p>
        <p className="text-sm text-white/40">Это занимает пару секунд</p>
      </main>
    );
  }

  if (stage.name === "done") {
    return (
      <main className="min-h-dvh">
        <AnalysisView
          analysis={stage.analysis}
          isFallback={stage.isFallback}
          onDiscuss={discuss}
          discussState={discussState}
        />
      </main>
    );
  }

  if (stage.name === "error") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-[15px] leading-relaxed text-white/80">{stage.message}</p>
        <button
          type="button"
          onClick={() => setStage({ name: "filling" })}
          className="rounded-xl border border-white/20 px-6 py-3 text-sm"
        >
          Вернуться к брифу
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="h-px flex-1 bg-white/10">
          <div
            className="h-px bg-white transition-all duration-300"
            style={{ width: `${((step + 1) / briefQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {step + 1} / {briefQuestions.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-10">
        <h1 className="text-2xl leading-snug font-medium">{question.title}</h1>
        <p className="text-sm leading-relaxed text-white/50">{question.hint}</p>

        <textarea
          ref={fieldRef}
          value={value}
          onChange={(event) =>
            setAnswers((current) => ({
              ...current,
              [question.id]: event.target.value.slice(0, MAX_ANSWER_LENGTH),
            }))
          }
          placeholder={question.placeholder}
          rows={5}
          className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[15px] leading-relaxed outline-none placeholder:text-white/25 focus:border-white/30"
        />

        {touched && tooShort ? (
          <p className="text-sm text-white/50">
            Пары слов не хватит — чем конкретнее ответ, тем точнее разбор.
          </p>
        ) : null}

        {!question.required ? (
          <button
            type="button"
            onClick={next}
            className="self-start text-sm text-white/40 underline underline-offset-4"
          >
            Пропустить
          </button>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-white/10 bg-black/95 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        {step > 0 && !isInsideTelegram() ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border border-white/15 px-5 py-4 text-[15px] text-white/70"
          >
            Назад
          </button>
        ) : null}
        <button
          type="button"
          onClick={next}
          className="flex-1 rounded-xl bg-white py-4 text-[15px] font-medium text-black transition active:scale-[0.99] disabled:opacity-40"
          disabled={tooShort && touched}
        >
          {isLast ? "Получить разбор" : "Дальше"}
        </button>
      </div>
    </main>
  );
}

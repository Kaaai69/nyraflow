"use client";

import type { ReactNode } from "react";

import { studioProducts } from "@/content/studio";
import type { BriefAnalysis } from "@/lib/ai/schema";

// Экран разбора.
//
// Подача намеренно осторожная: это гипотеза к обсуждению, а не ТЗ. Отсюда
// «предварительный разбор» в заголовке и финальный блок с приглашением
// обсудить — разговор продаёт лучше, чем самый подробный список секций.

type Props = {
  analysis: BriefAnalysis;
  isFallback: boolean;
  onDiscuss: () => void;
  discussState: "idle" | "sending" | "sent";
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-[0.18em] text-white/40 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function AnalysisView({ analysis, isFallback, onDiscuss, discussState }: Props) {
  const product = studioProducts.find((p) => p.id === analysis.recommendedProduct);

  return (
    <div className="flex flex-col gap-9 px-5 pt-6 pb-28">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Предварительный разбор</p>
        <h1 className="text-2xl leading-snug font-medium">Что мы поняли о задаче</h1>
      </header>

      <p className="text-[15px] leading-relaxed text-white/80">{analysis.summary}</p>

      {product ? (
        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.03] p-5">
          <p className="text-xs tracking-[0.18em] text-white/40 uppercase">Подходящий формат</p>
          <p className="mt-2 text-lg font-medium">{product.title}</p>
          <p className="mt-1 text-sm text-white/50">
            от {product.priceFrom.toLocaleString("ru-RU")} ₽ · точный состав работ фиксируем после разбора
          </p>
        </div>
      ) : null}

      <Section title="Гипотеза оффера">
        <p className="border-l border-white/20 pl-4 text-[15px] leading-relaxed text-white/80 italic">
          {analysis.offerHypothesis}
        </p>
      </Section>

      <Section title="Как может выглядеть структура">
        <ol className="flex flex-col gap-4">
          {analysis.structure.map((item, index) => (
            <li key={`${item.section}-${index}`} className="flex gap-4">
              <span className="w-5 shrink-0 pt-0.5 text-sm text-white/30 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[15px]">{item.section}</span>
                <span className="text-sm leading-relaxed text-white/50">{item.purpose}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="На что смотреть внимательно">
        <ul className="flex flex-col gap-4">
          {analysis.risks.map((item, index) => (
            <li key={`${item.risk}-${index}`} className="flex flex-col gap-1">
              <span className="text-[15px]">{item.risk}</span>
              <span className="text-sm leading-relaxed text-white/50">{item.mitigation}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Вопросы, которые стоит обсудить">
        <ul className="flex flex-col gap-3">
          {analysis.questions.map((question, index) => (
            <li key={`${question}-${index}`} className="text-[15px] leading-relaxed text-white/80">
              — {question}
            </li>
          ))}
        </ul>
      </Section>

      {isFallback ? (
        <p className="text-xs leading-relaxed text-white/30">
          Разбор собран по вашим ответам без AI-анализа — сервис был временно недоступен.
          На созвоне разберём задачу подробнее.
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/95 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        {discussState === "sent" ? (
          <p className="py-3 text-center text-sm text-white/60">
            Заявка у нас. Напишем в этом чате в ближайшее время.
          </p>
        ) : (
          <button
            type="button"
            onClick={onDiscuss}
            disabled={discussState === "sending"}
            className="w-full rounded-xl bg-white py-4 text-[15px] font-medium text-black transition active:scale-[0.99] disabled:opacity-50"
          >
            {discussState === "sending" ? "Отправляем…" : "Обсудить разбор с командой"}
          </button>
        )}
      </div>
    </div>
  );
}

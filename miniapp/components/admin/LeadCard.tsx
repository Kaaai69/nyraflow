"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { briefQuestions } from "@/content/brief";
import { studioProducts } from "@/content/studio";
import { api } from "@/lib/api-client";
import type { BriefAnalysis } from "@/lib/ai/schema";
import type { BriefAnswers } from "@/content/brief";
import { bindBackButton, haptic, hapticSuccess } from "@/lib/telegram/webapp";

// Карточка заявки.
//
// Здесь команда решает, что делать дальше, поэтому на экране всё, что нужно
// для решения: ответы клиента своими словами, разбор от модели и статус.
// Ответы клиента идут первыми — они первоисточник, разбор лишь их трактовка.

type LeadStatus = "new" | "qualified" | "in_work" | "won" | "lost";

type LeadResponse = {
  lead: {
    id: string;
    status: LeadStatus;
    createdAt: string;
    contact: string | null;
    name: string;
    username: string | null;
    telegramId: string;
    briefId: string | null;
  };
  answers: BriefAnswers | null;
  analysis: BriefAnalysis | null;
  meta: {
    analyzedAt: string;
    provider: string;
    model: string;
    isFallback: boolean;
  } | null;
};

const STATUS_FLOW: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "Новая" },
  { id: "qualified", label: "В диалоге" },
  { id: "in_work", label: "В работе" },
  { id: "won", label: "Выиграна" },
  { id: "lost", label: "Отказ" },
];

type Props = {
  leadId: string;
  onBack: () => void;
  onStatusChanged: () => void;
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-[0.18em] text-white/40 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function LeadCard({ leadId, onBack, onStatusChanged }: Props) {
  const [data, setData] = useState<LeadResponse | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"brief" | "analysis">("brief");
  const [projectState, setProjectState] = useState<"idle" | "creating" | "created">("idle");

  useEffect(() => {
    const unbind = bindBackButton(true, onBack);
    return () => {
      unbind();
      bindBackButton(false, onBack);
    };
  }, [onBack]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LeadResponse>(`/api/leads/${leadId}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const changeStatus = useCallback(
    async (status: LeadStatus) => {
      if (!data || saving || data.lead.status === status) return;
      setSaving(true);
      haptic("light");
      try {
        await api.patch(`/api/leads/${leadId}`, { status });
        setData({ ...data, lead: { ...data.lead, status } });
        hapticSuccess();
        onStatusChanged();
      } catch {
        // Статус не сохранился — оставляем прежний, чтобы экран не врал.
      } finally {
        setSaving(false);
      }
    },
    [data, leadId, onStatusChanged, saving],
  );

  const createProject = useCallback(async () => {
    if (!data || projectState !== "idle") return;
    setProjectState("creating");
    haptic("light");
    try {
      await api.post(`/api/leads/${leadId}/project`, {});
      hapticSuccess();
      setProjectState("created");
      onStatusChanged();
    } catch {
      setProjectState("idle");
    }
  }, [data, leadId, onStatusChanged, projectState]);

  if (error) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-[15px] text-white/70">Не удалось открыть заявку.</p>
        <button type="button" onClick={onBack} className="rounded-xl border border-white/20 px-5 py-3 text-sm">
          К списку
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </main>
    );
  }

  const { lead, answers, analysis, meta } = data;
  const product = analysis
    ? studioProducts.find((p) => p.id === analysis.recommendedProduct)
    : undefined;

  return (
    <main className="flex min-h-full flex-col pb-28">
      <header className="flex flex-col gap-2 px-5 pt-6">
        <button type="button" onClick={onBack} className="self-start text-sm text-white/40">
          ← К списку
        </button>
        <h1 className="text-2xl font-medium">{lead.name}</h1>
        <p className="text-sm text-white/45">
          Заявка №{lead.id} ·{" "}
          {new Date(lead.createdAt).toLocaleString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {lead.username ? (
          <a
            href={`https://t.me/${lead.username}`}
            className="self-start text-sm text-white/70 underline underline-offset-4"
          >
            Написать @{lead.username}
          </a>
        ) : null}
      </header>

      {product ? (
        <div className="mx-5 mt-5 rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4">
          <p className="text-xs tracking-[0.18em] text-white/40 uppercase">Предложенный формат</p>
          <p className="mt-2 text-[15px]">{product.title}</p>
          <p className="mt-0.5 text-sm text-white/45">
            от {product.priceFrom.toLocaleString("ru-RU")} ₽ · срок {product.typicalTerm}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex gap-2 px-5">
        {(
          [
            ["brief", "Ответы клиента"],
            ["analysis", "Разбор"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              haptic("light");
              setTab(id);
            }}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              tab === id ? "border-white bg-white text-black" : "border-white/15 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-8 px-5">
        {tab === "brief" ? (
          answers ? (
            briefQuestions
              .filter((question) => answers[question.id]?.trim())
              .map((question) => (
                <Block key={question.id} title={question.title}>
                  <p className="text-[15px] leading-relaxed text-white/80">
                    {answers[question.id]}
                  </p>
                </Block>
              ))
          ) : (
            <p className="text-sm text-white/40">Бриф не заполнен.</p>
          )
        ) : analysis ? (
          <>
            <Block title="Что за задача">
              <p className="text-[15px] leading-relaxed text-white/80">{analysis.summary}</p>
            </Block>

            <Block title="Гипотеза оффера">
              <p className="border-l border-white/20 pl-4 text-[15px] leading-relaxed text-white/80 italic">
                {analysis.offerHypothesis}
              </p>
            </Block>

            <Block title="Структура">
              <ol className="flex flex-col gap-3">
                {analysis.structure.map((item, index) => (
                  <li key={`${item.section}-${index}`} className="flex gap-3">
                    <span className="w-5 shrink-0 text-sm text-white/30 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[15px]">{item.section}</span>
                      <span className="text-sm leading-relaxed text-white/50">{item.purpose}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Block>

            <Block title="Риски">
              <ul className="flex flex-col gap-3">
                {analysis.risks.map((item, index) => (
                  <li key={`${item.risk}-${index}`} className="flex flex-col gap-0.5">
                    <span className="text-[15px]">{item.risk}</span>
                    <span className="text-sm leading-relaxed text-white/50">{item.mitigation}</span>
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Вопросы к клиенту">
              <ul className="flex flex-col gap-2">
                {analysis.questions.map((question, index) => (
                  <li key={index} className="text-[15px] leading-relaxed text-white/80">
                    — {question}
                  </li>
                ))}
              </ul>
            </Block>

            {meta ? (
              <p className="text-xs text-white/30">
                {meta.isFallback
                  ? "Собрано шаблоном — модель была недоступна"
                  : `${meta.provider} · ${meta.model}`}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-white/40">Разбор ещё не готов.</p>
        )}
      </div>

      <div className="mt-8 px-5">
        {projectState === "created" ? (
          <p className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-sm text-white/70">
            Проект заведён. Клиент увидит его в приложении, статус заявки — «в работе».
          </p>
        ) : (
          <button
            type="button"
            disabled={projectState === "creating"}
            onClick={() => void createProject()}
            className="w-full rounded-xl bg-white py-4 text-[15px] font-medium text-black disabled:opacity-50"
          >
            {projectState === "creating" ? "Заводим…" : "Завести проект"}
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <p className="mb-2 text-xs tracking-[0.18em] text-white/35 uppercase">Статус</p>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {STATUS_FLOW.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={saving}
              onClick={() => void changeStatus(item.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                lead.status === item.id
                  ? "border-white bg-white text-black"
                  : "border-white/15 text-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

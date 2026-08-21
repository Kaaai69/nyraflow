"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { api, ApiRequestError } from "@/lib/api-client";
import { haptic, initTelegram } from "@/lib/telegram/webapp";
import { LeadCard } from "@/components/admin/LeadCard";

// Лента заявок для команды.
//
// Смысл экрана — за один взгляд понять, чем заняться. Поэтому в строке видно
// не только имя и дату, но и суть задачи с предложенным форматом: решение
// «открывать или нет» принимается без открытия.

type LeadStatus = "new" | "qualified" | "in_work" | "won" | "lost";

type Priority = {
  level: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  budget: number | null;
  termDays: number | null;
};

type LeadItem = {
  id: string;
  status: LeadStatus;
  priority: Priority;
  createdAt: string;
  contact: string | null;
  name: string;
  username: string | null;
  briefId: string | null;
  summary: string | null;
  recommendedProduct: string | null;
  isFallback: boolean | null;
};

type FeedResponse = {
  items: LeadItem[];
  counts: Record<string, number>;
};

const FILTERS: { id: LeadStatus | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "qualified", label: "В диалоге" },
  { id: "in_work", label: "В работе" },
  { id: "won", label: "Выиграны" },
  { id: "lost", label: "Отказ" },
];

const PRODUCT_LABELS: Record<string, string> = {
  landing: "Лендинг",
  web_service: "Веб-сервис",
  ai_automation: "AI-автоматизация",
};

// Приоритет показывается формой, а не только словом: три уровня различаются
// заливкой, поэтому лента читается взглядом, без вчитывания.
const PRIORITY_STYLE: Record<Priority["level"], { label: string; className: string }> = {
  high: { label: "Высокий приоритет", className: "bg-white text-black" },
  medium: { label: "Средний приоритет", className: "bg-white/15 text-white" },
  low: { label: "Низкий приоритет", className: "bg-white/[0.06] text-white/45" },
};

function formatMoney(value: number): string {
  return value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} млн ₽`
    : `${Math.round(value / 1000)} тыс ₽`;
}

function formatTerm(days: number): string {
  if (days <= 10) return `${days} дн`;
  if (days < 30) return `${Math.round(days / 7)} нед`;
  const months = days / 30;
  return months % 1 === 0 ? `${months} мес` : `${months.toFixed(1).replace(".", ",")} мес`;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  qualified: "В диалоге",
  in_work: "В работе",
  won: "Выиграна",
  lost: "Отказ",
};

/** «3 часа назад» читается быстрее, чем дата со временем. */
function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;

  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function LeadFeed({ switcher }: { switcher?: ReactNode }) {
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [data, setData] = useState<FeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async (status: LeadStatus | "all") => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<FeedResponse>(`/api/leads?status=${status}`);
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiRequestError && err.info.error === "not_admin"
          ? "Этот раздел доступен только команде."
          : "Не удалось загрузить заявки. Попробуйте обновить.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initTelegram();
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const onStatusChanged = useCallback(() => {
    void load(filter);
  }, [filter, load]);

  // Карточка занимает экран целиком вместе с нижней панелью статусов,
  // поэтому переключатели режимов на ней не показываются.
  if (openId) {
    return (
      <LeadCard
        leadId={openId}
        onBack={() => setOpenId(null)}
        onStatusChanged={onStatusChanged}
      />
    );
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="px-5 pt-6 pb-4">
        {/* Без uppercase: бренд пишется строчными, а CSS-трансформация
            превращала его в NYRAFLOW DESK. */}
        <p className="text-xs tracking-[0.2em] text-white/40">nyraflow desk</p>
        <h1 className="mt-1 text-2xl font-medium">Заявки</h1>
      </header>

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-5 pb-4">
        {FILTERS.map((item) => {
          const count = data?.counts[item.id] ?? 0;
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic("light");
                setFilter(item.id);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-white bg-white text-black"
                  : "border-white/15 text-white/70"
              }`}
            >
              {item.label}
              {count > 0 ? (
                <span className={active ? "ml-1.5 text-black/50" : "ml-1.5 text-white/35"}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex-1 px-5 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : error ? (
          <p className="pt-10 text-center text-[15px] text-white/60">{error}</p>
        ) : data && data.items.length === 0 ? (
          <p className="pt-10 text-center text-[15px] text-white/40">
            {filter === "all" ? "Заявок пока нет." : "В этом статусе пусто."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data?.items.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => {
                    haptic("light");
                    setOpenId(lead.id);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition active:scale-[0.995]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-medium">{lead.name}</span>
                    <span className="shrink-0 text-xs text-white/35">
                      {timeAgo(lead.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        PRIORITY_STYLE[lead.priority.level].className
                      }`}
                    >
                      {PRIORITY_STYLE[lead.priority.level].label}
                    </span>
                    {lead.priority.budget ? (
                      <span className="text-xs text-white/50 tabular-nums">
                        {formatMoney(lead.priority.budget)}
                      </span>
                    ) : null}
                    {lead.priority.termDays ? (
                      <span className="text-xs text-white/50 tabular-nums">
                        · {formatTerm(lead.priority.termDays)}
                      </span>
                    ) : null}
                  </div>

                  {lead.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
                      {lead.summary}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-white/30">Разбор ещё не готов</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        lead.status === "new"
                          ? "bg-white/15 text-white"
                          : "bg-white/[0.06] text-white/50"
                      }`}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                    {lead.recommendedProduct ? (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/50">
                        {PRODUCT_LABELS[lead.recommendedProduct] ?? lead.recommendedProduct}
                      </span>
                    ) : null}
                    {lead.isFallback ? (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/40">
                        без AI
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {switcher}
    </main>
  );
}

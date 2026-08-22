"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { api } from "@/lib/api-client";
import { haptic, hapticSuccess, initTelegram } from "@/lib/telegram/webapp";

// Кабинет клиента.
//
// Экран отвечает на три вопроса, которые клиент иначе задаёт в переписке:
// на каком мы этапе, что нужно от меня и что нужно посмотреть.
// Поэтому задачи и согласования стоят выше истории и счетов.

const STAGES = [
  { id: "diagnostics", title: "Диагностика задачи" },
  { id: "structure", title: "Структура и смыслы" },
  { id: "design_concept", title: "Дизайн-концепт" },
  { id: "development", title: "Разработка и интеграции" },
  { id: "launch_growth", title: "Запуск и рост" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "done" | "cancelled";
  dueAt: string | null;
};

type Approval = {
  id: string;
  title: string;
  previewUrl: string | null;
  status: "pending" | "approved" | "changes_requested";
  comment: string | null;
};

type Invoice = {
  id: string;
  title: string;
  amount: number;
  status: "sent" | "paid" | "cancelled";
  payUrl: string | null;
  dueAt: string | null;
};

type Update = { id: string; text: string; stage: string | null; createdAt: string };

type ProjectResponse = {
  project: {
    id: string;
    title: string;
    stage: StageId;
    status: string;
    stagingUrl: string | null;
    deadlineAt: string | null;
  } | null;
  tasks: Task[];
  approvals: Approval[];
  invoices: Invoice[];
  updates: Update[];
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-[0.18em] text-white/40 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function isOverdue(iso: string | null): boolean {
  return Boolean(iso && new Date(iso).getTime() < Date.now());
}

type Props = { onOpenBrief: () => void };

export function ProjectView({ onOpenBrief }: Props) {
  const [data, setData] = useState<ProjectResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.get<ProjectResponse>("/api/projects"));
    } catch {
      setData({ project: null, tasks: [], approvals: [], invoices: [], updates: [] });
    }
  }, []);

  useEffect(() => {
    initTelegram();
    void load();
  }, [load]);

  const completeTask = useCallback(
    async (projectId: string, taskId: string) => {
      setBusyId(taskId);
      haptic("light");
      try {
        await api.patch(`/api/projects/${projectId}/tasks/${taskId}`, {});
        hapticSuccess();
        await load();
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const decide = useCallback(
    async (projectId: string, approvalId: string, decision: "approved" | "changes_requested") => {
      if (decision === "changes_requested" && !comment.trim()) {
        setCommentFor(approvalId);
        return;
      }
      setBusyId(approvalId);
      haptic("light");
      try {
        await api.patch(`/api/projects/${projectId}/approvals/${approvalId}`, {
          decision,
          comment: decision === "changes_requested" ? comment.trim() : null,
        });
        hapticSuccess();
        setComment("");
        setCommentFor(null);
        await load();
      } finally {
        setBusyId(null);
      }
    },
    [comment, load],
  );

  if (!data) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </main>
    );
  }

  if (!data.project) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-[15px] leading-relaxed text-white/70">
          Активных проектов пока нет.
        </p>
        <button
          type="button"
          onClick={onOpenBrief}
          className="rounded-xl bg-white px-6 py-3.5 text-[15px] font-medium text-black"
        >
          Рассказать о задаче
        </button>
      </main>
    );
  }

  const { project, tasks, approvals, invoices, updates } = data;
  const currentIndex = STAGES.findIndex((stage) => stage.id === project.stage);
  const openTasks = tasks.filter((task) => task.status === "open");
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  return (
    <main className="flex min-h-full flex-col gap-9 px-5 pt-6 pb-12">
      <header className="flex flex-col gap-2">
        <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Ваш проект</p>
        <h1 className="text-2xl leading-snug font-medium">{project.title}</h1>
        {project.deadlineAt ? (
          <p className="text-sm text-white/45">Ориентир по срокам — {formatDate(project.deadlineAt)}</p>
        ) : null}
      </header>

      <Block title="Этап работы">
        <ol className="flex flex-col">
          {STAGES.map((stage, index) => {
            const passed = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li key={stage.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      current ? "bg-white" : passed ? "bg-white/40" : "bg-white/15"
                    }`}
                  />
                  {index < STAGES.length - 1 ? (
                    <span className={`w-px flex-1 ${passed ? "bg-white/30" : "bg-white/10"}`} />
                  ) : null}
                </div>
                <span
                  className={`pb-6 text-[15px] ${
                    current ? "text-white" : passed ? "text-white/50" : "text-white/30"
                  }`}
                >
                  {stage.title}
                  {current ? (
                    <span className="mt-0.5 block text-sm text-white/45">сейчас здесь</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </Block>

      {openTasks.length > 0 ? (
        <Block title="Нужно от вас">
          <ul className="flex flex-col gap-3">
            {openTasks.map((task) => (
              <li
                key={task.id}
                className={`rounded-2xl border p-4 ${
                  isOverdue(task.dueAt) ? "border-white/30 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="text-[15px]">{task.title}</p>
                {task.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{task.description}</p>
                ) : null}
                {task.dueAt ? (
                  <p className="mt-2 text-sm text-white/40">
                    {isOverdue(task.dueAt) ? "Ждём с " : "До "}
                    {formatDate(task.dueAt)}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === task.id}
                  onClick={() => void completeTask(project.id, task.id)}
                  className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm disabled:opacity-50"
                >
                  {busyId === task.id ? "Отмечаем…" : "Готово, передал"}
                </button>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {pendingApprovals.length > 0 ? (
        <Block title="На согласование">
          <ul className="flex flex-col gap-3">
            {pendingApprovals.map((approval) => (
              <li key={approval.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[15px]">{approval.title}</p>
                {approval.previewUrl ? (
                  <a
                    href={approval.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-white/70 underline underline-offset-4"
                  >
                    Посмотреть
                  </a>
                ) : null}

                {commentFor === approval.id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={3}
                      placeholder="Что поправить?"
                      className="w-full resize-none rounded-xl border border-white/15 bg-white/[0.03] p-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                    />
                    <button
                      type="button"
                      disabled={busyId === approval.id || !comment.trim()}
                      onClick={() => void decide(project.id, approval.id, "changes_requested")}
                      className="w-full rounded-xl border border-white/20 py-3 text-sm disabled:opacity-40"
                    >
                      Отправить комментарий
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === approval.id}
                      onClick={() => void decide(project.id, approval.id, "approved")}
                      className="flex-1 rounded-xl bg-white py-3 text-sm font-medium text-black disabled:opacity-50"
                    >
                      Принять
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        setCommentFor(approval.id);
                      }}
                      className="flex-1 rounded-xl border border-white/20 py-3 text-sm"
                    >
                      Есть правки
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {project.stagingUrl ? (
        <Block title="Превью">
          <a
            href={project.stagingUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[15px] text-white/80 underline underline-offset-4"
          >
            Открыть текущую версию
          </a>
        </Block>
      ) : null}

      {invoices.length > 0 ? (
        <Block title="Счета">
          <ul className="flex flex-col gap-3">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px]">{invoice.title}</span>
                  <span className="text-sm text-white/45">
                    {invoice.amount.toLocaleString("ru-RU")} ₽
                    {invoice.status === "paid" ? " · оплачен" : ""}
                  </span>
                </span>
                {invoice.status !== "paid" && invoice.payUrl ? (
                  <a
                    href={invoice.payUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
                  >
                    Оплатить
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {updates.length > 0 ? (
        <Block title="Что происходило">
          <ul className="flex flex-col gap-4">
            {updates.map((update) => (
              <li key={update.id} className="flex flex-col gap-1">
                <span className="text-xs text-white/35">{formatDate(update.createdAt)}</span>
                <span className="text-[15px] leading-relaxed text-white/75">{update.text}</span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </main>
  );
}

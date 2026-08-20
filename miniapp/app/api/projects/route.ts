import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { getProjectContents, getProjectForClient } from "@/lib/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Проект текущего клиента со всем содержимым: этап, задачи, согласования, счета.
// Отдельного идентификатора в запросе нет намеренно — клиент видит только свой.
export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const project = await getProjectForClient(auth.user.id);
  if (!project) {
    return NextResponse.json({ ok: true, project: null });
  }

  const { tasks, approvals, invoices, updates } = await getProjectContents(project.id);

  return NextResponse.json({
    ok: true,
    project: {
      id: project.id,
      title: project.title,
      stage: project.stage,
      status: project.status,
      amount: project.amount,
      stagingUrl: project.staging_url,
      startedAt: project.started_at,
      deadlineAt: project.deadline_at,
    },
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueAt: task.due_at,
    })),
    approvals: approvals.map((approval) => ({
      id: approval.id,
      title: approval.title,
      previewUrl: approval.preview_url,
      status: approval.status,
      comment: approval.comment,
      decidedAt: approval.decided_at,
    })),
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      title: invoice.title,
      amount: invoice.amount,
      status: invoice.status,
      payUrl: invoice.pay_url,
      dueAt: invoice.due_at,
    })),
    updates: updates.map((update) => ({
      id: update.id,
      text: update.text,
      stage: update.stage,
      createdAt: update.created_at,
    })),
  });
}

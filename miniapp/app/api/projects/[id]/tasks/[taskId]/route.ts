import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { completeTask, getProjectById } from "@/lib/db/projects";
import { enqueueEventStandalone } from "@/lib/db/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Клиент отмечает, что материалы переданы.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> },
) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id, taskId } = await context.params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(taskId)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  // Проверяем владение проектом: без этого чужую задачу можно закрыть по id.
  const project = await getProjectById(id);
  if (!project || (project.client_id !== auth.user.id && auth.user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const task = await completeTask(taskId, id);
  if (!task) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await enqueueEventStandalone("task.overdue", {
    projectId: id,
    taskId: task.id,
    title: task.title,
    completed: true,
  });

  return NextResponse.json({ ok: true, task: { id: task.id, status: task.status } });
}

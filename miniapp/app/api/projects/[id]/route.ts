import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { PROJECT_STAGES, setProjectStage, type ProjectStage } from "@/lib/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NOTE = 1000;

// Перевод проекта на следующий этап. Клиент узнаёт об этом из события —
// уведомление отправит n8n, приложение здесь только фиксирует факт.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const stage = (body as { stage?: unknown })?.stage;
  const rawNote = (body as { note?: unknown })?.note;

  if (typeof stage !== "string" || !PROJECT_STAGES.includes(stage as ProjectStage)) {
    return NextResponse.json(
      { ok: false, error: "bad_stage", allowed: PROJECT_STAGES },
      { status: 422 },
    );
  }

  const note = typeof rawNote === "string" && rawNote.trim()
    ? rawNote.trim().slice(0, MAX_NOTE)
    : null;

  const updated = await setProjectStage(id, stage as ProjectStage, note);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    project: { id: updated.id, stage: updated.stage, title: updated.title },
  });
}

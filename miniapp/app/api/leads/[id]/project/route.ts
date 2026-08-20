import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { getLead } from "@/lib/db/leads";
import { createProjectFromLead } from "@/lib/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE = 200;

// Заявка превращается в проект в один запрос: клиент, контекст и бриф уже есть.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Тело необязательно: название и сумму можно не передавать.
  }

  const rawTitle = (body as { title?: unknown })?.title;
  const rawAmount = (body as { amount?: unknown })?.amount;

  // Без явного названия берём имя клиента — переименовать можно позже.
  const title =
    typeof rawTitle === "string" && rawTitle.trim()
      ? rawTitle.trim().slice(0, MAX_TITLE)
      : `Проект — ${lead.first_name ?? lead.username ?? `заявка №${id}`}`;

  const amount =
    typeof rawAmount === "number" && Number.isFinite(rawAmount) && rawAmount > 0
      ? Math.round(rawAmount)
      : null;

  try {
    const project = await createProjectFromLead(id, title, amount);
    return NextResponse.json({
      ok: true,
      project: { id: project.id, title: project.title, stage: project.stage },
    });
  } catch (error) {
    console.error("[project] не удалось создать проект", error);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }
}

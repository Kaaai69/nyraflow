import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { getLead, LEAD_STATUSES, updateLeadStatus, type LeadStatus } from "@/lib/db/leads";
import { enqueueEventStandalone } from "@/lib/db/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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

  return NextResponse.json({
    ok: true,
    lead: {
      id: lead.id,
      status: lead.status,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      contact: lead.contact,
      note: lead.note,
      name: lead.first_name ?? lead.username ?? `id ${lead.telegram_id}`,
      username: lead.username,
      telegramId: lead.telegram_id,
      briefId: lead.brief_id,
    },
    answers: lead.answers,
    analysis: lead.analysis,
    meta: lead.analysis
      ? {
          analyzedAt: lead.analyzed_at,
          provider: lead.provider,
          model: lead.model,
          isFallback: lead.is_fallback,
        }
      : null,
  });
}

// Смена статуса из ленты. Событие в outbox уходит той же транзакцией смысла:
// автоматизация должна знать о движении заявки, кто бы его ни сделал.
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

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== "string" || !LEAD_STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json(
      { ok: false, error: "bad_status", allowed: LEAD_STATUSES },
      { status: 422 },
    );
  }

  const updated = await updateLeadStatus(id, status as LeadStatus);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await enqueueEventStandalone("lead.created", {
    leadId: updated.id,
    status: updated.status,
    changedBy: `admin:${auth.user.telegram_id}`,
  });

  return NextResponse.json({ ok: true, lead: updated });
}

import { NextResponse } from "next/server";

import { isValidAdminToken } from "@/lib/auth/admin-api";
import { queryOne } from "@/lib/db/client";
import { enqueueEventStandalone } from "@/lib/db/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["new", "qualified", "in_work", "won", "lost"] as const;
type LeadStatus = (typeof ALLOWED_STATUSES)[number];

type LeadRow = {
  id: string;
  status: LeadStatus;
  contact: string | null;
  telegram_id: string;
  first_name: string | null;
  username: string | null;
  created_at: Date;
  updated_at: Date;
  brief_id: string | null;
  analysis: Record<string, unknown> | null;
};

async function loadLead(id: string): Promise<LeadRow | null> {
  return queryOne<LeadRow>(
    `select l.id,
            l.status,
            l.contact,
            u.telegram_id,
            u.first_name,
            u.username,
            l.created_at,
            l.updated_at,
            b.id as brief_id,
            a.payload as analysis
       from leads l
       join users u on u.id = l.user_id
       left join lateral (
         select id from briefs where lead_id = l.id order by id desc limit 1
       ) b on true
       left join lateral (
         select payload from brief_analyses
          where brief_id = b.id order by created_at desc limit 1
       ) a on true
      where l.id = $1`,
    [id],
  );
}

// Состояние заявки. Сценарий напоминания спрашивает им, откликнулся ли клиент.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isValidAdminToken(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const lead = await loadLead(id);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    lead: {
      id: lead.id,
      status: lead.status,
      contact: lead.contact,
      telegramId: lead.telegram_id,
      firstName: lead.first_name,
      username: lead.username,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      briefId: lead.brief_id,
      // Откликнулся ли клиент: сценарию удобнее готовый флаг, чем сравнение строк.
      isResponded: lead.status !== "new",
    },
    analysis: lead.analysis,
  });
}

// Смена статуса заявки. Так n8n двигает её по воронке.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isValidAdminToken(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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
  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json(
      { ok: false, error: "bad_status", allowed: ALLOWED_STATUSES },
      { status: 422 },
    );
  }

  const updated = await queryOne<{ id: string; status: LeadStatus }>(
    "update leads set status = $2 where id = $1 returning id, status",
    [id, status],
  );

  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await enqueueEventStandalone("lead.created", {
    leadId: updated.id,
    status: updated.status,
    changedBy: "n8n",
  });

  return NextResponse.json({ ok: true, lead: updated });
}

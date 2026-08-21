import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { queryOne } from "@/lib/db/client";
import { enqueueEventStandalone } from "@/lib/db/outbox";
import { env } from "@/lib/env";
import { escapeHtml, sendMessage } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  lead_id: string;
  status: string;
  recommended_product: string | null;
  summary: string | null;
};

// Клиент нажал «обсудить»: заявка переходит в работу, команда получает
// уведомление в Telegram, событие уходит в outbox для n8n.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  // Заодно проверяем, что бриф принадлежит этому пользователю.
  const row = await queryOne<LeadRow>(
    `select l.id as lead_id,
            l.status,
            a.payload ->> 'recommendedProduct' as recommended_product,
            a.payload ->> 'summary' as summary
       from briefs b
       join leads l on l.id = b.lead_id
       left join lateral (
         select payload from brief_analyses
          where brief_id = b.id order by created_at desc limit 1
       ) a on true
      where b.id = $1 and l.user_id = $2`,
    [id, auth.user.id],
  );

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (row.status === "new") {
    await queryOne("update leads set status = 'qualified' where id = $1", [row.lead_id]);
  }

  await enqueueEventStandalone("lead.created", {
    leadId: row.lead_id,
    briefId: id,
    intent: "discuss",
    userId: auth.user.id,
  });

  const who = auth.user.username
    ? `@${auth.user.username}`
    : `${auth.user.first_name ?? "Без имени"} (id ${auth.user.telegram_id})`;

  const text =
    "🟢 Разбор брифа: клиент хочет обсудить\n\n" +
    `👤 ${escapeHtml(who)}\n` +
    `📦 Формат: ${escapeHtml(row.recommended_product ?? "не определён")}\n\n` +
    `📝 ${escapeHtml((row.summary ?? "").slice(0, 500))}`;

  // Уведомление не критично для клиента: заявка уже сохранена и уйдёт в n8n,
  // поэтому ошибку отправки только логируем.
  await Promise.all(
    env.adminTelegramIds.map((chatId) => sendMessage({ chatId, text })),
  );

  return NextResponse.json({ ok: true });
}

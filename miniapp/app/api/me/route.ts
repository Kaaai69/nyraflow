import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { getLatestLeadForUser } from "@/lib/db/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Первый сквозной маршрут: проверяет подпись initData, заводит пользователя
// и возвращает его профиль. На нём же проверяется вся базовая обвязка.
//
// Вместе с профилем отдаётся последняя заявка: по ней приложение решает, что
// показать на входе. Без неё человек, уже отправивший бриф, получал пустую
// анкету и думал, что заявка не дошла.
export async function GET(request: Request) {
  const auth = await authenticate(request);

  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { user } = auth;
  const lead = await getLatestLeadForUser(user.id);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      role: user.role,
      createdAt: user.created_at,
    },
    lead: lead
      ? {
          id: lead.leadId,
          status: lead.status,
          createdAt: lead.createdAt,
          briefId: lead.briefId,
          briefStatus: lead.briefStatus,
          hasAnalysis: lead.hasAnalysis,
        }
      : null,
  });
}

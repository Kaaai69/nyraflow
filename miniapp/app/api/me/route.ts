import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Первый сквозной маршрут: проверяет подпись initData, заводит пользователя
// и возвращает его профиль. На нём же проверяется вся базовая обвязка.
export async function GET(request: Request) {
  const auth = await authenticate(request);

  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

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
  });
}

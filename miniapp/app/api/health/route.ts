import { NextResponse } from "next/server";

import { queryOne } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Проверка живости для деплоя и мониторинга: приложение отвечает и видит базу.
export async function GET() {
  const startedAt = Date.now();

  try {
    await queryOne<{ ok: number }>("select 1 as ok");
  } catch (error) {
    console.error("[health] база недоступна", error);
    return NextResponse.json(
      { ok: false, db: "down", latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    db: "up",
    latencyMs: Date.now() - startedAt,
    time: new Date().toISOString(),
  });
}

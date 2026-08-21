import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { getAnalysisForUser } from "@/lib/db/briefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Готовый разбор отдаётся из базы: повторный просмотр не стоит ни лимитов, ни
// ожидания. Чужой бриф по прямой ссылке не открыть — проверка идёт по user_id.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const found = await getAnalysisForUser(id, auth.user.id);
  if (!found) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    briefId: id,
    analysis: found.analysis,
    meta: { isFallback: found.isFallback, createdAt: found.createdAt },
  });
}

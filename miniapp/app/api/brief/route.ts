import { NextResponse } from "next/server";

import { briefQuestions, MAX_ANSWER_LENGTH, type BriefAnswers, type BriefQuestionId } from "@/content/brief";
import { analyzeBrief } from "@/lib/ai/analyze";
import { authenticate } from "@/lib/auth/session";
import { countRecentBriefs, createBriefWithLead, markBriefFailed, saveAnalysis } from "@/lib/db/briefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_BRIEF_LIMIT = 5;

type ValidationResult =
  | { ok: true; answers: BriefAnswers }
  | { ok: false; field: BriefQuestionId | null; error: string };

function validate(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, field: null, error: "answers_missing" };
  }

  const raw = input as Record<string, unknown>;
  const answers: BriefAnswers = {};

  for (const question of briefQuestions) {
    const value = raw[question.id];

    if (value === undefined || value === null || value === "") {
      if (question.required) {
        return { ok: false, field: question.id, error: "required" };
      }
      continue;
    }

    if (typeof value !== "string") {
      return { ok: false, field: question.id, error: "not_a_string" };
    }

    const trimmed = value.trim();
    if (question.required && trimmed.length < question.minLength) {
      return { ok: false, field: question.id, error: "too_short" };
    }
    if (trimmed.length > MAX_ANSWER_LENGTH) {
      return { ok: false, field: question.id, error: "too_long" };
    }

    answers[question.id] = trimmed;
  }

  return { ok: true, answers };
}

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const validation = validate((payload as { answers?: unknown } | null)?.answers);
  if (!validation.ok) {
    console.warn(`[brief] бриф отклонён: ${validation.error}, поле ${validation.field ?? "—"}`);
    return NextResponse.json(
      { ok: false, error: validation.error, field: validation.field },
      { status: 422 },
    );
  }

  const { user } = auth;

  // Лимит защищает от спама чужими руками, а не от собственной команды:
  // админы упирались в него на тестах и не могли проверить свой же продукт.
  if (user.role !== "admin" && (await countRecentBriefs(user.id)) >= DAILY_BRIEF_LIMIT) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const contact = user.username ? `@${user.username}` : `tg:${user.telegram_id}`;
  const { leadId, briefId } = await createBriefWithLead(user.id, contact, validation.answers);

  // Разбор идёт вне транзакции: держать соединение с базой открытым на время
  // сетевого запроса к модели незачем.
  try {
    const outcome = await analyzeBrief(validation.answers);
    await saveAnalysis(briefId, leadId, outcome);

    if (outcome.attempts.length > 0) {
      console.warn("[brief] провайдеры с ошибками:", outcome.attempts.join(" | "));
    }

    return NextResponse.json({
      ok: true,
      briefId,
      analysis: outcome.analysis,
      meta: {
        provider: outcome.provider,
        model: outcome.model,
        isFallback: outcome.isFallback,
        latencyMs: outcome.latencyMs,
      },
    });
  } catch (error) {
    // Сюда попадаем только при сбое БД: сам разбор фолбэком не бросает.
    console.error("[brief] не удалось сохранить разбор", error);
    await markBriefFailed(briefId).catch(() => {});
    return NextResponse.json({ ok: false, error: "analysis_failed", briefId }, { status: 500 });
  }
}

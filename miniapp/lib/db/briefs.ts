import type { BriefAnswers } from "@/content/brief";
import type { AnalysisOutcome } from "@/lib/ai/analyze";
import { query, queryOne, transaction } from "@/lib/db/client";
import { enqueueEvent } from "@/lib/db/outbox";
import type { BriefAnalysis } from "@/lib/ai/schema";

export type BriefRow = {
  id: string;
  lead_id: string;
  answers: BriefAnswers;
  status: "draft" | "submitted" | "analyzed" | "failed";
  created_at: Date;
};

/** Заявка и бриф создаются одной транзакцией вместе с событием для n8n. */
export async function createBriefWithLead(
  userId: string,
  contact: string | null,
  answers: BriefAnswers,
): Promise<{ leadId: string; briefId: string }> {
  return transaction(async (client) => {
    const lead = await client.query<{ id: string }>(
      `insert into leads (user_id, source, contact) values ($1, 'miniapp', $2) returning id`,
      [userId, contact],
    );
    const leadId = lead.rows[0]!.id;

    const brief = await client.query<{ id: string }>(
      `insert into briefs (lead_id, answers, status, submitted_at)
       values ($1, $2::jsonb, 'submitted', now()) returning id`,
      [leadId, JSON.stringify(answers)],
    );
    const briefId = brief.rows[0]!.id;

    await enqueueEvent(client, "lead.created", { leadId, userId, source: "miniapp" });
    await enqueueEvent(client, "brief.submitted", { leadId, briefId, userId });

    return { leadId, briefId };
  });
}

/** Сохраняет разбор и переводит бриф в финальный статус. */
export async function saveAnalysis(
  briefId: string,
  leadId: string,
  outcome: AnalysisOutcome,
): Promise<string> {
  return transaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into brief_analyses
         (brief_id, provider, model, is_fallback, payload, tokens_in, tokens_out, latency_ms)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       returning id`,
      [
        briefId,
        outcome.provider,
        outcome.model,
        outcome.isFallback,
        JSON.stringify(outcome.analysis),
        outcome.tokensIn,
        outcome.tokensOut,
        outcome.latencyMs,
      ],
    );

    await client.query("update briefs set status = 'analyzed' where id = $1", [briefId]);

    await enqueueEvent(client, "brief.analyzed", {
      leadId,
      briefId,
      provider: outcome.provider,
      model: outcome.model,
      isFallback: outcome.isFallback,
      recommendedProduct: outcome.analysis.recommendedProduct,
    });

    return inserted.rows[0]!.id;
  });
}

export async function markBriefFailed(briefId: string): Promise<void> {
  await query("update briefs set status = 'failed' where id = $1", [briefId]);
}

/** Разбор берётся из БД: повторный показ ничего не стоит и не тратит лимиты. */
export async function getAnalysisForUser(
  briefId: string,
  userId: string,
): Promise<{ analysis: BriefAnalysis; isFallback: boolean; createdAt: Date } | null> {
  const row = await queryOne<{ payload: BriefAnalysis; is_fallback: boolean; created_at: Date }>(
    `select a.payload, a.is_fallback, a.created_at
       from brief_analyses a
       join briefs b on b.id = a.brief_id
       join leads l on l.id = b.lead_id
      where a.brief_id = $1 and l.user_id = $2
      order by a.created_at desc
      limit 1`,
    [briefId, userId],
  );

  if (!row) return null;
  return { analysis: row.payload, isFallback: row.is_fallback, createdAt: row.created_at };
}

/** Простой лимит: защита от спама брифами с одного аккаунта. */
export async function countRecentBriefs(userId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `select count(*)::text as count
       from briefs b join leads l on l.id = b.lead_id
      where l.user_id = $1 and b.created_at > now() - interval '24 hours'`,
    [userId],
  );
  return Number.parseInt(row?.count ?? "0", 10);
}

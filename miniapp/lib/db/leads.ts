import { query, queryOne } from "@/lib/db/client";
import type { BriefAnalysis } from "@/lib/ai/schema";
import type { BriefAnswers } from "@/content/brief";

// Выборки для админ-ленты.
//
// Лента — это первое, что видит команда, поэтому запрос один и сразу с тем,
// что нужно для решения: кто пришёл, что за задача, какой формат предложен и
// сколько заявка ждёт ответа.

export type LeadStatus = "new" | "qualified" | "in_work" | "won" | "lost";

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "qualified",
  "in_work",
  "won",
  "lost",
];

export type LeadListItem = {
  id: string;
  status: LeadStatus;
  answers: BriefAnswers | null;
  contact: string | null;
  created_at: Date;
  telegram_id: string;
  first_name: string | null;
  username: string | null;
  brief_id: string | null;
  /** Короткое описание задачи из разбора — чтобы понять заявку без открытия. */
  summary: string | null;
  recommended_product: string | null;
  is_fallback: boolean | null;
};

export type LeadDetails = LeadListItem & {
  updated_at: Date;
  note: string | null;
  answers: BriefAnswers | null;
  analysis: BriefAnalysis | null;
  analyzed_at: Date | null;
  provider: string | null;
  model: string | null;
};

const LIST_SELECT = `
  select l.id,
         l.status,
         l.contact,
         l.created_at,
         u.telegram_id,
         u.first_name,
         u.username,
         b.id as brief_id,
         b.answers,
         a.payload ->> 'summary' as summary,
         a.payload ->> 'recommendedProduct' as recommended_product,
         a.is_fallback
    from leads l
    join users u on u.id = l.user_id
    left join lateral (
      select id, answers from briefs where lead_id = l.id order by id desc limit 1
    ) b on true
    left join lateral (
      select payload, is_fallback from brief_analyses
       where brief_id = b.id order by created_at desc limit 1
    ) a on true
`;

export async function listLeads(options: {
  status?: LeadStatus | "all";
  limit?: number;
  offset?: number;
}): Promise<LeadListItem[]> {
  const { status = "all", limit = 30, offset = 0 } = options;
  const filtered = status !== "all";

  return query<LeadListItem>(
    `${LIST_SELECT}
      ${filtered ? "where l.status = $3" : ""}
     order by l.created_at desc
     limit $1 offset $2`,
    filtered ? [limit, offset, status] : [limit, offset],
  );
}

export async function countLeadsByStatus(): Promise<Record<string, number>> {
  const rows = await query<{ status: LeadStatus; count: string }>(
    "select status, count(*)::text as count from leads group by status",
  );

  const result: Record<string, number> = { all: 0 };
  for (const row of rows) {
    const value = Number.parseInt(row.count, 10);
    result[row.status] = value;
    result.all += value;
  }
  return result;
}

export async function getLead(id: string): Promise<LeadDetails | null> {
  return queryOne<LeadDetails>(
    `select l.id,
            l.status,
            l.contact,
            l.note,
            l.created_at,
            l.updated_at,
            u.telegram_id,
            u.first_name,
            u.username,
            b.id as brief_id,
            b.answers,
            a.payload as analysis,
            a.created_at as analyzed_at,
            a.provider,
            a.model,
            a.is_fallback,
            a.payload ->> 'summary' as summary,
            a.payload ->> 'recommendedProduct' as recommended_product
       from leads l
       join users u on u.id = l.user_id
       left join lateral (
         select id, answers from briefs where lead_id = l.id order by id desc limit 1
       ) b on true
       left join lateral (
         select payload, created_at, provider, model, is_fallback
           from brief_analyses where brief_id = b.id order by created_at desc limit 1
       ) a on true
      where l.id = $1`,
    [id],
  );
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ id: string; status: LeadStatus } | null> {
  return queryOne<{ id: string; status: LeadStatus }>(
    "update leads set status = $2 where id = $1 returning id, status",
    [id, status],
  );
}

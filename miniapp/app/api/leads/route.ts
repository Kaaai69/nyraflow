import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { countLeadsByStatus, listLeads, LEAD_STATUSES, type LeadStatus } from "@/lib/db/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Лента заявок. Доступна только команде: обычный клиент получит 403.
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "all";
  const status =
    statusParam === "all" || LEAD_STATUSES.includes(statusParam as LeadStatus)
      ? (statusParam as LeadStatus | "all")
      : "all";

  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") ?? "30", 10) || 30, 100);
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const [items, counts] = await Promise.all([
    listLeads({ status, limit, offset }),
    countLeadsByStatus(),
  ]);

  return NextResponse.json({
    ok: true,
    counts,
    items: items.map((lead) => ({
      id: lead.id,
      status: lead.status,
      createdAt: lead.created_at,
      contact: lead.contact,
      name: lead.first_name ?? lead.username ?? `id ${lead.telegram_id}`,
      username: lead.username,
      briefId: lead.brief_id,
      summary: lead.summary,
      recommendedProduct: lead.recommended_product,
      isFallback: lead.is_fallback,
    })),
  });
}

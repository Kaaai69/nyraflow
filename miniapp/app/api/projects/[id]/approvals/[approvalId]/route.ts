import { NextResponse } from "next/server";

import { authenticate } from "@/lib/auth/session";
import { decideApproval, getProjectById } from "@/lib/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMENT = 2000;

// Решение клиента по согласованию. Фиксируется с автором и временем —
// это то, на что потом ссылаются в спорах о том, что было одобрено.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; approvalId: string }> },
) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id, approvalId } = await context.params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(approvalId)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const project = await getProjectById(id);
  if (!project || (project.client_id !== auth.user.id && auth.user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const decision = (body as { decision?: unknown })?.decision;
  const rawComment = (body as { comment?: unknown })?.comment;

  if (decision !== "approved" && decision !== "changes_requested") {
    return NextResponse.json({ ok: false, error: "bad_decision" }, { status: 422 });
  }

  const comment = typeof rawComment === "string" ? rawComment.trim().slice(0, MAX_COMMENT) : null;

  // Просьба о правках без пояснения бесполезна обеим сторонам.
  if (decision === "changes_requested" && !comment) {
    return NextResponse.json({ ok: false, error: "comment_required" }, { status: 422 });
  }

  const updated = await decideApproval(approvalId, id, decision, comment, auth.user.id);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    approval: { id: updated.id, status: updated.status, decidedAt: updated.decided_at },
  });
}

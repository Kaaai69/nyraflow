import type { PoolClient } from "pg";

import { query } from "@/lib/db/client";

// Транзакционный outbox.
//
// Событие пишется в той же транзакции, что и данные: либо есть и заявка, и
// событие о ней, либо ничего. Доставкой в n8n занимается отдельный воркер с
// ретраями, поэтому лежащий n8n не роняет заявку и не теряет её.

export type OutboxEventType =
  | "lead.created"
  | "brief.submitted"
  | "brief.analyzed"
  | "stage.changed"
  | "approval.requested"
  | "approval.granted"
  | "task.overdue"
  | "invoice.paid";

export async function enqueueEvent(
  client: PoolClient,
  type: OutboxEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  await client.query(
    "insert into outbox_events (type, payload) values ($1, $2::jsonb)",
    [type, JSON.stringify(payload)],
  );
}

/** Постановка события вне транзакции — когда данные уже зафиксированы. */
export async function enqueueEventStandalone(
  type: OutboxEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  await query("insert into outbox_events (type, payload) values ($1, $2::jsonb)", [
    type,
    JSON.stringify(payload),
  ]);
}

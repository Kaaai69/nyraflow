#!/usr/bin/env node
// Воркер доставки событий из outbox в n8n.
//
// Отдельный процесс, а не задача внутри приложения: доставка не должна
// конкурировать с обработкой запросов пользователей, а перезапуск воркера не
// должен ронять мини-апп. Обычный .mjs по тем же причинам, что и миграции —
// standalone-сборка Next не компилирует ничего вне приложения.
//
// Гарантии:
//  - событие не теряется: пока n8n не подтвердил приём, статус остаётся pending;
//  - событие не задваивается на ровном месте: строка берётся под FOR UPDATE
//    SKIP LOCKED, поэтому два воркера не возьмут одну и ту же;
//  - n8n может отличить наши запросы от чужих по HMAC-подписи тела.

import { createHmac } from "node:crypto";

import pg from "pg";

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 8;
const REQUEST_TIMEOUT_MS = 15_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(message, extra) {
  console.log(`[outbox] ${message}`, extra === undefined ? "" : extra);
}

/** Экспоненциальная задержка с потолком: 10с, 20с, 40с… до часа. */
function backoffSeconds(attempts) {
  return Math.min(10 * 2 ** (attempts - 1), 3600);
}

async function connect(connectionString) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const pool = new pg.Pool({ connectionString, max: 4 });
    try {
      await pool.query("select 1");
      pool.on("error", (error) => log("ошибка idle-соединения", error.message));
      return pool;
    } catch (error) {
      await pool.end().catch(() => {});
      if (attempt === 30) throw error;
      log(`база недоступна (${attempt}/30): ${error.message}`);
      await sleep(2000);
    }
  }
  throw new Error("unreachable");
}

async function deliver(webhookUrl, secret, event) {
  const body = JSON.stringify({
    id: String(event.id),
    type: event.type,
    payload: event.payload,
    createdAt: event.created_at,
  });

  const headers = {
    "content-type": "application/json",
    "user-agent": "nyraflow-desk-outbox/0.1",
    "x-nyraflow-event": event.type,
    "x-nyraflow-event-id": String(event.id),
  };

  // Подпись тела: n8n проверяет её и отбрасывает всё, что пришло не от нас.
  if (secret) {
    headers["x-nyraflow-signature"] = createHmac("sha256", secret).update(body).digest("hex");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    throw new Error(`HTTP ${response.status} ${detail}`);
  }
}

/**
 * Один цикл: забирает пачку готовых к отправке событий и пытается доставить.
 * Возвращает количество обработанных — ноль означает, что можно поспать.
 */
async function tick(pool, webhookUrl, secret) {
  const client = await pool.connect();
  let handled = 0;

  try {
    await client.query("begin");

    const { rows } = await client.query(
      `select id, type, payload, attempts, created_at
         from outbox_events
        where status = 'pending' and next_retry_at <= now()
        order by id
        limit $1
        for update skip locked`,
      [BATCH_SIZE],
    );

    for (const event of rows) {
      handled += 1;
      try {
        await deliver(webhookUrl, secret, event);
        await client.query(
          `update outbox_events
              set status = 'sent', sent_at = now(), attempts = attempts + 1, last_error = null
            where id = $1`,
          [event.id],
        );
        log(`доставлено ${event.type} #${event.id}`);
      } catch (error) {
        const attempts = event.attempts + 1;
        const dead = attempts >= MAX_ATTEMPTS;
        await client.query(
          `update outbox_events
              set status = $2,
                  attempts = $3,
                  last_error = $4,
                  next_retry_at = now() + ($5 || ' seconds')::interval
            where id = $1`,
          [
            event.id,
            dead ? "dead" : "pending",
            attempts,
            String(error.message).slice(0, 500),
            String(backoffSeconds(attempts)),
          ],
        );
        log(
          dead
            ? `событие ${event.type} #${event.id} признано мёртвым после ${attempts} попыток: ${error.message}`
            : `не доставлено ${event.type} #${event.id} (попытка ${attempts}), повтор через ${backoffSeconds(attempts)}с: ${error.message}`,
        );
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    log("цикл упал", error.message);
  } finally {
    client.release();
  }

  return handled;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL не задан");

  const webhookUrl = process.env.N8N_WEBHOOK_URL ?? "";
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";

  const pool = await connect(connectionString);

  if (!webhookUrl) {
    // Это нормальное состояние до подъёма n8n: события копятся в базе и
    // уедут все разом, как только появится адрес. Ничего не теряется.
    log("N8N_WEBHOOK_URL не задан — события копятся, доставка выключена");
  } else {
    log(`доставка включена: ${webhookUrl}`);
    if (!secret) log("ВНИМАНИЕ: N8N_WEBHOOK_SECRET пуст, запросы уйдут без подписи");
  }

  let running = true;
  const stop = (signal) => {
    log(`получен ${signal}, останавливаюсь`);
    running = false;
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));

  while (running) {
    if (webhookUrl) {
      const handled = await tick(pool, webhookUrl, secret);
      // Разгребаем очередь без пауз, пока в ней что-то есть.
      if (handled === BATCH_SIZE) continue;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  await pool.end().catch(() => {});
  log("остановлен");
}

main().catch((error) => {
  console.error("[outbox] фатальная ошибка:", error);
  process.exit(1);
});

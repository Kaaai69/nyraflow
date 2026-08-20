import { Pool, type QueryResultRow } from "pg";

import { env } from "@/lib/env";

// В dev Next перезагружает модули на каждом изменении — без глобального кеша
// пулы копились бы до исчерпания коннектов Postgres.
const globalForDb = globalThis as unknown as { nyraflowPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.nyraflowPool) {
    const pool = new Pool({
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    // Без обработчика упавший idle-коннект роняет весь процесс Node.
    pool.on("error", (error) => {
      console.error("[db] ошибка в idle-соединении", error);
    });

    globalForDb.nyraflowPool = pool;
  }

  return globalForDb.nyraflowPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as unknown[]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Транзакция: колбэк получает клиента, коммит/роллбек — автоматически. */
export async function transaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

#!/usr/bin/env node
// Раннер миграций. Запускается в entrypoint контейнера до старта Next.
//
// Обычный .mjs, а не TypeScript: standalone-сборка Next не компилирует ничего
// вне приложения, а тащить отдельный тулчейн ради миграций — лишнее. Файлы
// применяются по возрастанию имени, каждый в своей транзакции, под advisory
// lock — параллельный запуск двух контейнеров не применит миграцию дважды.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);
const LOCK_KEY = 4_173_920_155; // произвольная константа, одна на это приложение
const CONNECT_RETRIES = 30;
const CONNECT_DELAY_MS = 2000;

function log(message) {
  console.log(`[migrate] ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Postgres может ещё подниматься даже при healthy-депенденси — не сдаёмся сразу.
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt += 1) {
    const client = new pg.Client({ connectionString });
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt === CONNECT_RETRIES) throw error;
      log(`postgres недоступен (попытка ${attempt}/${CONNECT_RETRIES}): ${error.message}`);
      await sleep(CONNECT_DELAY_MS);
    }
  }

  throw new Error("unreachable");
}

async function main() {
  const client = await connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);

    const applied = new Set(
      (await client.query("select name from schema_migrations")).rows.map((row) => row.name),
    );

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      log(`применяю ${file}`);

      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => {});
        throw new Error(`миграция ${file} упала: ${error.message}`, { cause: error });
      }

      count += 1;
    }

    log(count === 0 ? "всё актуально, применять нечего" : `применено миграций: ${count}`);
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("[migrate] ошибка:", error);
  process.exit(1);
});

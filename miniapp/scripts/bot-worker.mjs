#!/usr/bin/env node
// Воркер входящих апдейтов бота: long polling вместо вебхука.
//
// Вебхук на этом сервере не работает и работать не будет: Telegram не доходит
// до российского IP — проверено, `Connection timed out` на каждой попытке, до
// Caddy не долетает ни одного запроса. Ровно поэтому серверу нужен VPN, чтобы
// самому писать в api.telegram.org. Исходящий канал через VPN живой, значит
// апдейты надо забирать самим.
//
// Логика ответов не дублируется: воркер — тупой транспорт. Он забирает апдейт
// у Telegram и приносит его в тот же `/api/telegram/webhook`, что принимал бы
// вебхук, с тем же секретом в заголовке. Появится однажды точка входа за
// границей — воркер выключается, эндпоинт остаётся как есть.

const POLL_TIMEOUT_S = 25;
const FETCH_TIMEOUT_MS = (POLL_TIMEOUT_S + 10) * 1000;
const DELIVER_TIMEOUT_MS = 20_000;
const DELIVER_ATTEMPTS = 3;
const ERROR_PAUSE_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(message, extra) {
  console.log(`[bot] ${message}`, extra === undefined ? "" : extra);
}

async function callTelegram(token, method, payload, timeoutMs = 15_000) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    const error = new Error(`${method}: HTTP ${response.status} ${body.description ?? ""}`);
    error.status = response.status;
    throw error;
  }
  return body.result;
}

/**
 * Настройка бота при старте. Идемпотентна, поэтому делается на каждом запуске:
 * отдельный скрипт, который надо не забыть выполнить руками, — лишняя причина
 * для расхождения между кодом и тем, что видит клиент.
 */
async function setup(token, publicUrl) {
  // getUpdates и вебхук взаимоисключающи: пока вебхук стоит, Telegram отвечает
  // 409. Апдейты не выбрасываем — они сейчас же приедут поллингом.
  await callTelegram(token, "deleteWebhook", { drop_pending_updates: false });
  log("вебхук снят, работаем поллингом");

  await callTelegram(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Начать и открыть приложение" },
      { command: "help", description: "Как это работает" },
    ],
  });

  await callTelegram(token, "setChatMenuButton", {
    menu_button: { type: "web_app", text: "nyraflow desk", web_app: { url: publicUrl } },
  });
  log(`команды и кнопка меню обновлены, приложение: ${publicUrl}`);
}

/**
 * Доставка апдейта в приложение. Несколько попыток: мини-апп могут в этот
 * момент перезапускать, а потерянный `/start` — это молчание в ответ на первое
 * действие человека.
 */
async function deliver(appUrl, secret, update) {
  const headers = { "content-type": "application/json" };
  if (secret) headers["x-telegram-bot-api-secret-token"] = secret;

  for (let attempt = 1; attempt <= DELIVER_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${appUrl}/api/telegram/webhook`, {
        method: "POST",
        headers,
        body: JSON.stringify(update),
        signal: AbortSignal.timeout(DELIVER_TIMEOUT_MS),
      });

      if (response.ok) return true;

      // 403 — разошёлся секрет: повторять бессмысленно, чинится только .env.
      if (response.status === 403) {
        log(`приложение отвергло апдейт #${update.update_id}: неверный секрет`);
        return false;
      }
      log(`приложение ответило ${response.status} на апдейт #${update.update_id} (попытка ${attempt})`);
    } catch (error) {
      log(`апдейт #${update.update_id} не доставлен (попытка ${attempt}): ${error.message}`);
    }

    if (attempt < DELIVER_ATTEMPTS) await sleep(1000 * attempt);
  }

  return false;
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const publicUrl = (process.env.MINIAPP_PUBLIC_URL ?? "https://app.nyraflow.ru").replace(/\/$/, "");
  // Внутренний адрес: апдейт идёт по докер-сети, наружу и обратно ему незачем.
  const appUrl = (process.env.MINIAPP_INTERNAL_URL ?? "http://miniapp:3000").replace(/\/$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

  if (!secret) log("ВНИМАНИЕ: TELEGRAM_WEBHOOK_SECRET пуст — эндпоинт принимает кого угодно");

  let running = true;
  const stop = (signal) => {
    log(`получен ${signal}, останавливаюсь`);
    running = false;
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));

  // Настройка обязана пройти до первого опроса, иначе Telegram ответит 409.
  for (let attempt = 1; running; attempt += 1) {
    try {
      await setup(token, publicUrl);
      break;
    } catch (error) {
      log(`настройка не удалась (попытка ${attempt}): ${error.message}`);
      await sleep(ERROR_PAUSE_MS);
    }
  }

  let offset = 0;
  log(`опрашиваю Telegram, доставка в ${appUrl}`);

  while (running) {
    try {
      const updates = await callTelegram(
        token,
        "getUpdates",
        {
          ...(offset ? { offset } : {}),
          timeout: POLL_TIMEOUT_S,
          allowed_updates: ["message"],
        },
        FETCH_TIMEOUT_MS,
      );

      for (const update of updates) {
        // Смещение двигается независимо от исхода доставки: апдейт, который
        // приложение отвергло трижды, не должен возвращаться вечно и заслонять
        // собой всё, что пришло после него.
        offset = update.update_id + 1;
        const delivered = await deliver(appUrl, secret, update);
        log(`апдейт #${update.update_id}: ${delivered ? "доставлен" : "потерян"}`);
      }
    } catch (error) {
      // 409 — кто-то снова поставил вебхук (например, старым скриптом).
      if (error.status === 409) {
        log("конфликт с вебхуком, снимаю его заново");
        await callTelegram(token, "deleteWebhook", { drop_pending_updates: false }).catch(() => {});
        continue;
      }
      log(`опрос сорвался: ${error.message}`);
      await sleep(ERROR_PAUSE_MS);
    }
  }

  log("остановлен");
}

main().catch((error) => {
  console.error("[bot] фатальная ошибка:", error);
  process.exit(1);
});

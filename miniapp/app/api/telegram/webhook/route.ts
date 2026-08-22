import { NextResponse } from "next/server";

import { getLatestLeadForUser } from "@/lib/db/leads";
import { findUserByTelegramId } from "@/lib/db/users";
import { env } from "@/lib/env";
import { openAppKeyboard, sendMessage } from "@/lib/telegram/bot";
import {
  fallbackMessage,
  greetingMessage,
  helpMessage,
  parseCommand,
  type ChatLeadState,
} from "@/lib/telegram/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Вебхук бота.
//
// До него бот молчал на всё: человек жал «Старт», не получал ни слова и не
// понимал, что делать дальше. Теперь на /start приходит приглашение с кнопкой,
// открывающей мини-апп, а на любой другой текст — короткий ответ, что
// сообщение дошло.
//
// Обработчик намеренно узкий: переписку ведёт команда, а не бот. Здесь только
// первое касание и маршрут внутрь приложения.

type TelegramMessage = {
  chat?: { id?: number; type?: string };
  from?: { id?: number; first_name?: string; is_bot?: boolean };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

/**
 * Ответ Telegram всегда 200, даже когда внутри что-то не сложилось: на любой
 * другой код апдейт возвращается снова и снова, и очередь вебхука встаёт.
 */
const ok = () => NextResponse.json({ ok: true });

/**
 * Секрет из BotFather-независимого заголовка — единственное, что отличает
 * настоящий апдейт от чужого POST на публичный адрес. Пока секрет не задан,
 * проверка выключена: иначе вебхук нельзя поднять до правки .env.
 */
function isFromTelegram(request: Request): boolean {
  const expected = env.botWebhookSecret;
  if (!expected) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === expected;
}

/** Состояние заявки для приветствия. Ошибка базы не должна лишать ответа. */
async function readLeadState(telegramId: number): Promise<ChatLeadState | null> {
  try {
    const user = await findUserByTelegramId(telegramId);
    if (!user) return null;
    const lead = await getLatestLeadForUser(user.id);
    return lead ? { status: lead.status, hasAnalysis: lead.hasAnalysis } : null;
  } catch (error) {
    console.error("[telegram] не удалось прочитать заявку для приветствия", error);
    return null;
  }
}

export async function POST(request: Request) {
  if (!isFromTelegram(request)) {
    console.warn("[telegram] апдейт с неверным секретом отброшен");
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return ok();
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text;

  // Группы и каналы нас не касаются: приложение открывается только из личной
  // переписки, и звать туда из общего чата бессмысленно.
  if (!chatId || message?.chat?.type !== "private" || message.from?.is_bot) return ok();
  if (typeof text !== "string" || !text.trim()) return ok();

  const command = parseCommand(text);

  let reply: string;
  // Подпись кнопки — про следующий шаг этого человека: новичка зовём к брифу,
  // того, чья заявка уже у нас, — просто внутрь.
  let button = "Рассказать о задаче";

  if (command === "start") {
    const lead = message.from?.id ? await readLeadState(message.from.id) : null;
    reply = greetingMessage(message.from?.first_name ?? null, lead);
    if (lead) button = "Открыть приложение";
  } else if (command) {
    // Неизвестная команда — чаще всего опечатка, и подсказка тут уместнее
    // молчания.
    reply = helpMessage();
  } else {
    reply = fallbackMessage();
  }

  const delivered = await sendMessage({
    chatId,
    text: reply,
    replyMarkup: openAppKeyboard(button),
  });

  if (!delivered) {
    console.error(`[telegram] ответ на «${text.slice(0, 40)}» не доставлен в чат ${chatId}`);
  }

  return ok();
}

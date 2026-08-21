import { env } from "@/lib/env";

// Отправка сообщений тем же ботом, что принимает заявки с лендинга.
// Исходящий трафик сервера идёт через VPN — этим api.telegram.org и достижим.

const TIMEOUT_MS = 15_000;

type SendMessageOptions = {
  chatId: number | string;
  text: string;
  replyMarkup?: unknown;
  disablePreview?: boolean;
};

export async function sendMessage({
  chatId,
  text,
  replyMarkup,
  disablePreview = true,
}: SendMessageOptions): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: disablePreview,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[telegram] sendMessage failed", response.status, detail);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[telegram] sendMessage error", error);
    return false;
  }
}

/** Экранирование пользовательского текста для parse_mode: HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

import { NextResponse } from "next/server";

// Runs on the Node.js runtime so it can reach the Telegram API through the
// server's outbound network (which is tunnelled through the VPN).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const MAX = { name: 200, contact: 200, message: 4000 } as const;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const name = str(body.name);
  const contact = str(body.contact);
  const message = str(body.message);
  const honeypot = str(body.company); // hidden field — real users leave it empty

  // Silently accept and drop obvious bots.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !contact || !message) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 422 });
  }
  if (name.length > MAX.name || contact.length > MAX.contact || message.length > MAX.message) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 422 });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[contact] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not configured");
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  const text =
    "🟢 Новая заявка с nyraflow.ru\n\n" +
    `👤 Имя: ${name}\n` +
    `📞 Контакт: ${contact}\n\n` +
    `📝 Задача:\n${message}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[contact] Telegram delivery failed", response.status, detail);
      return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
    }
  } catch (error) {
    console.error("[contact] Telegram request error", error);
    return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

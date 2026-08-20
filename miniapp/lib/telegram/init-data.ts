import { createHmac, timingSafeEqual } from "node:crypto";

// Проверка initData из Telegram Mini App.
//
// Схема Telegram: секрет = HMAC-SHA256("WebAppData" как ключ, bot_token),
// затем этим секретом подписывается data-check-string — пары `key=value`,
// отсортированные по ключу и склеенные через \n. Поля `hash` и `signature`
// в строку не входят (второе — часть Ed25519-схемы для third-party валидации).

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type InitData = {
  user: TelegramUser;
  authDate: Date;
  queryId?: string;
  startParam?: string;
};

export type InitDataResult =
  | { ok: true; data: InitData }
  | { ok: false; reason: "malformed" | "bad_hash" | "expired" | "no_user" };

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function validateInitData(
  raw: string,
  botToken: string,
  maxAgeSeconds: number,
): InitDataResult {
  if (!raw) return { ok: false, reason: "malformed" };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "malformed" };

  // Строка для проверки: пары key=value, отсортированные по ключу.
  //
  // Тонкость, на которой мы обожглись на боевом телефоне: в initData от
  // современных клиентов приходит поле `signature` (это часть Ed25519-схемы
  // для сторонней валидации). Документация нового формата предлагает его
  // исключать, но Telegram считает HMAC вместе с ним. Проверяем оба варианта:
  // оба подписаны Telegram, а формат со временем может смениться ещё раз.
  const buildCheckString = (excludeSignature: boolean) =>
    [...params.entries()]
      .filter(([key]) => key !== "hash" && !(excludeSignature && key === "signature"))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const matches = (checkString: string) =>
    safeEqualHex(createHmac("sha256", secretKey).update(checkString).digest("hex"), hash);

  if (!matches(buildCheckString(false)) && !matches(buildCheckString(true))) {
    return { ok: false, reason: "bad_hash" };
  }

  const authDateRaw = Number.parseInt(params.get("auth_date") ?? "", 10);
  if (!Number.isFinite(authDateRaw)) {
    return { ok: false, reason: "malformed" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDateRaw;
  if (ageSeconds > maxAgeSeconds) {
    return { ok: false, reason: "expired" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "no_user" };

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (typeof user?.id !== "number") {
    return { ok: false, reason: "no_user" };
  }

  return {
    ok: true,
    data: {
      user,
      authDate: new Date(authDateRaw * 1000),
      queryId: params.get("query_id") ?? undefined,
      startParam: params.get("start_param") ?? undefined,
    },
  };
}

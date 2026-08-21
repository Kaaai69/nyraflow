import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { validateInitData } from "@/lib/telegram/init-data";

// Проверка подписи — единственное, что отделяет пользователя от самозванца.

const BOT_TOKEN = "123456:TEST-TOKEN-FOR-UNIT-TESTS";
const MAX_AGE = 86_400;

function signInitData(
  fields: Record<string, string>,
  token = BOT_TOKEN,
): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

function freshFields(overrides: Record<string, string> = {}) {
  return {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "AAtest",
    user: JSON.stringify({ id: 42, first_name: "Тест", username: "tester" }),
    ...overrides,
  };
}

describe("validateInitData", () => {
  it("принимает корректно подписанные данные", () => {
    const result = validateInitData(signInitData(freshFields()), BOT_TOKEN, MAX_AGE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.id).toBe(42);
      expect(result.data.user.username).toBe("tester");
    }
  });

  it("отвергает подделанную подпись", () => {
    const raw = signInitData(freshFields()).replace(/hash=[0-9a-f]+/, `hash=${"0".repeat(64)}`);
    const result = validateInitData(raw, BOT_TOKEN, MAX_AGE);
    expect(result).toEqual({ ok: false, reason: "bad_hash" });
  });

  it("отвергает подпись чужим токеном", () => {
    const raw = signInitData(freshFields(), "999999:OTHER-BOT-TOKEN");
    expect(validateInitData(raw, BOT_TOKEN, MAX_AGE).ok).toBe(false);
  });

  it("отвергает протухшие данные", () => {
    const old = String(Math.floor(Date.now() / 1000) - 200_000);
    const result = validateInitData(signInitData(freshFields({ auth_date: old })), BOT_TOKEN, MAX_AGE);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("отвергает подписанные данные без пользователя", () => {
    const fields = { auth_date: String(Math.floor(Date.now() / 1000)), query_id: "AAtest" };
    const result = validateInitData(signInitData(fields), BOT_TOKEN, MAX_AGE);
    expect(result).toEqual({ ok: false, reason: "no_user" });
  });

  it("отвергает пустую строку и мусор", () => {
    expect(validateInitData("", BOT_TOKEN, MAX_AGE).ok).toBe(false);
    expect(validateInitData("что-то не то", BOT_TOKEN, MAX_AGE).ok).toBe(false);
  });

  // Регрессия на реальный отказ с боевого телефона: initData от современных
  // клиентов содержит поле signature, и Telegram считает hash вместе с ним.
  // Прежняя реализация исключала signature из строки проверки и отбивала
  // живых пользователей с bad_hash — а тест этого не ловил, потому что
  // подписывал данные тем же кодом, что и проверял.
  it("принимает данные с полем signature, подписанные вместе с ним", () => {
    const fields = { ...freshFields(), signature: "abcDEF123_-" };
    const result = validateInitData(signInitData(fields), BOT_TOKEN, MAX_AGE);
    expect(result.ok).toBe(true);
  });

  it("принимает данные, где signature не участвовал в подписи", () => {
    // Второй формат: hash посчитан без signature, а поле всё равно прислано.
    const base = freshFields();
    const signed = new URLSearchParams(signInitData(base));
    signed.set("signature", "ignored_by_this_variant");
    const result = validateInitData(signed.toString(), BOT_TOKEN, MAX_AGE);
    expect(result.ok).toBe(true);
  });

  it("подделка не проходит и при наличии signature", () => {
    const fields = { ...freshFields(), signature: "abcDEF123_-" };
    const raw = signInitData(fields).replace(/hash=[0-9a-f]+/, `hash=${"0".repeat(64)}`);
    expect(validateInitData(raw, BOT_TOKEN, MAX_AGE).ok).toBe(false);
  });

  it("не ломается, если добавлено новое поле от Telegram", () => {
    const result = validateInitData(
      signInitData(freshFields({ chat_type: "private", chat_instance: "123" })),
      BOT_TOKEN,
      MAX_AGE,
    );
    expect(result.ok).toBe(true);
  });
});

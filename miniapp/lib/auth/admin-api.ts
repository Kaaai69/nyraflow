import { env } from "@/lib/env";

// Авторизация для входящего API, которым пользуется n8n.
//
// Не Telegram initData: здесь нет человека, есть машина. Общий токен в
// заголовке Authorization: Bearer <token>. Сравнение постоянное по времени —
// токен короткий и подбирается быстрее, чем кажется.

export function isValidAdminToken(request: Request): boolean {
  const expected = env.adminApiToken;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;

  const provided = header.slice(7).trim();
  if (provided.length !== expected.length) return false;

  // Побайтовое сравнение без раннего выхода.
  let diff = 0;
  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

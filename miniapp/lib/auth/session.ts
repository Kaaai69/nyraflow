import { env } from "@/lib/env";
import { upsertUser, type UserRole, type UserRow } from "@/lib/db/users";
import { validateInitData } from "@/lib/telegram/init-data";

// Сессии без состояния: каждый запрос приносит initData в заголовке
// `Authorization: tma <initData>`, подпись проверяется заново. Хранить
// серверные сессии не нужно — Telegram уже подписал полезную нагрузку.

export type AuthResult =
  | { ok: true; user: UserRow }
  | { ok: false; status: 401 | 403; error: string };

const AUTH_SCHEME = "tma ";

export function readInitDataHeader(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith(AUTH_SCHEME)) return null;
  return header.slice(AUTH_SCHEME.length).trim() || null;
}

export async function authenticate(request: Request): Promise<AuthResult> {
  const raw = readInitDataHeader(request);
  if (!raw) {
    return { ok: false, status: 401, error: "no_init_data" };
  }

  const result = validateInitData(raw, env.botToken, env.initDataMaxAgeSeconds);
  if (!result.ok) {
    // Без этого лога отказ авторизации неотличим от любой другой ошибки:
    // наружу уходит 401, а причина теряется. Печатаем только метаданные —
    // ни подписи, ни содержимого initData в логах быть не должно.
    const params = new URLSearchParams(raw);
    console.warn(
      `[auth] отказ: ${result.reason}; длина=${raw.length}, поля=[${[...params.keys()].sort().join(",")}]`,
    );
    return { ok: false, status: 401, error: result.reason };
  }

  const isAdmin = env.adminTelegramIds.includes(result.data.user.id);
  const desiredRole: UserRole = isAdmin ? "admin" : "guest";
  const user = await upsertUser(result.data.user, desiredRole);

  if (user.is_blocked) {
    return { ok: false, status: 403, error: "blocked" };
  }

  return { ok: true, user };
}

export async function requireAdmin(request: Request): Promise<AuthResult> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return { ok: false, status: 403, error: "not_admin" };
  }
  return auth;
}

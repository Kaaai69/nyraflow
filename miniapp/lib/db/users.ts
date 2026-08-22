import { queryOne } from "@/lib/db/client";
import type { TelegramUser } from "@/lib/telegram/init-data";

export type UserRole = "guest" | "client" | "admin";

export type UserRow = {
  id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  language_code: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: Date;
  last_seen_at: Date;
};

/**
 * Заводит пользователя при первом заходе и освежает профиль при каждом
 * следующем. Роль намеренно не понижается: назначенный вручную client или
 * admin переживает любой повторный вход. Повысить до admin можно только
 * списком TELEGRAM_ADMIN_IDS.
 */
export async function upsertUser(
  user: TelegramUser,
  desiredRole: UserRole,
): Promise<UserRow> {
  const row = await queryOne<UserRow>(
    `
    insert into users (telegram_id, username, first_name, last_name, photo_url, language_code, role)
    values ($1, $2, $3, $4, $5, $6, $7)
    on conflict (telegram_id) do update set
      username      = excluded.username,
      first_name    = excluded.first_name,
      last_name     = excluded.last_name,
      photo_url     = excluded.photo_url,
      language_code = excluded.language_code,
      last_seen_at  = now(),
      role          = case when $7 = 'admin' then 'admin' else users.role end
    returning *
    `,
    [
      user.id,
      user.username ?? null,
      user.first_name ?? null,
      user.last_name ?? null,
      user.photo_url ?? null,
      user.language_code ?? null,
      desiredRole,
    ],
  );

  if (!row) {
    throw new Error("upsertUser не вернул строку");
  }

  return row;
}

/**
 * Пользователь по Telegram id. Нужен вебхуку бота: там нет initData, есть
 * только id отправителя, а поздороваться хочется по-разному с тем, кто пришёл
 * впервые, и с тем, у кого уже лежит заявка.
 */
export async function findUserByTelegramId(telegramId: number | string): Promise<UserRow | null> {
  return queryOne<UserRow>("select * from users where telegram_id = $1", [String(telegramId)]);
}

import type { ProviderConfig } from "@/lib/ai/provider";

// Доступ к переменным окружения.
//
// Все геттеры ленивые и бросают исключение только в рантайме: если проверять
// их на верхнем уровне модуля, упадёт `next build` в докере, где секретов нет.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

/** Имя провайдера для логов и колонки provider в БД: api.groq.com → groq. */
function providerName(baseUrl: string, fallback: string): string {
  try {
    const host = new URL(baseUrl).hostname;
    const parts = host.split(".").filter((part) => part !== "api" && part !== "www");
    return parts[0] ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Провайдер настроен, только если заданы все три переменные. Ненастроенные
 * молча пропускаются — так слот второго провайдера может пустовать, пока до
 * него не дошли руки, и это не ломает разбор.
 */
function readProvider(prefix: string, fallbackName: string): ProviderConfig | null {
  const baseUrl = optional(`${prefix}_BASE_URL`);
  const apiKey = optional(`${prefix}_API_KEY`);
  const model = optional(`${prefix}_MODEL`);
  if (!baseUrl || !apiKey || !model) return null;
  return { name: providerName(baseUrl, fallbackName), baseUrl, apiKey, model };
}

export const env = {
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },
  get botToken(): string {
    return required("TELEGRAM_BOT_TOKEN");
  },
  get publicUrl(): string {
    return optional("MINIAPP_PUBLIC_URL", "https://app.nyraflow.ru");
  },
  /** Telegram id участников команды — им выдаётся роль admin. */
  get adminTelegramIds(): readonly number[] {
    return optional("TELEGRAM_ADMIN_IDS")
      .split(",")
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((id) => Number.isFinite(id) && id > 0);
  },
  /**
   * Общий секрет вебхука бота. Telegram присылает его в заголовке
   * `X-Telegram-Bot-Api-Secret-Token` — по нему чужой POST на наш адрес
   * отличается от настоящего апдейта. Пустое значение проверку отключает:
   * так вебхук поднимается и на стенде, где секрета ещё нет.
   */
  get botWebhookSecret(): string {
    return optional("TELEGRAM_WEBHOOK_SECRET");
  },
  /** Максимальный возраст initData, после которого требуется перезапуск аппы. */
  get initDataMaxAgeSeconds(): number {
    const raw = Number.parseInt(optional("INIT_DATA_MAX_AGE_SECONDS", "86400"), 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 86_400;
  },
  /**
   * Провайдеры разбора по порядку: первый отвечает, остальные — страховка.
   * Смена провайдера — правка .env, перезапуск контейнера, ноль правок кода.
   */
  get aiProviders(): readonly ProviderConfig[] {
    return [
      readProvider("AI_PRIMARY", "primary"),
      readProvider("AI_FALLBACK", "fallback"),
    ].filter((provider): provider is ProviderConfig => provider !== null);
  },
  /** Модель для углублённого разбора вторым проходом (может быть медленной). */
  get aiDeepModel(): string {
    return optional("AI_DEEP_MODEL");
  },
  /** Общий токен для входящего API: им n8n двигает заявки и проекты. */
  get adminApiToken(): string {
    return optional("ADMIN_API_TOKEN");
  },
  get aiTimeoutMs(): number {
    const raw = Number.parseInt(optional("AI_TIMEOUT_MS", "25000"), 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 25_000;
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
} as const;

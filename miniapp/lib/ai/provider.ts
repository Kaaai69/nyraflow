// Клиент к любому OpenAI-совместимому провайдеру.
//
// Провайдер задаётся тремя переменными окружения (base url, ключ, модель), так
// что смена Groq на OpenRouter или платный DeepSeek — это правка .env, а не кода.

export type ProviderConfig = {
  /** Человекочитаемое имя для логов и колонки provider в БД. */
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatResult = {
  content: string;
  provider: string;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number;
};

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Требовать от модели строгий JSON-объект. */
  json?: boolean;
};

type CompletionResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export async function chat(
  config: ProviderConfig,
  messages: readonly ChatMessage[],
  options: ChatOptions = {},
): Promise<ChatResult> {
  const { maxTokens = 1600, temperature = 0.4, timeoutMs = 25_000, json = false } = options;

  const body = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" as const } } : {}),
  };

  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
        // Обязательно. Перед Groq стоит Cloudflare, и запросы без внятного
        // User-Agent он отбивает 403 с кодом 1010.
        "user-agent": "nyraflow-desk/0.1",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "таймаут" : String(error);
    throw new ProviderError(`${config.name}: запрос не прошёл (${reason})`, config.name);
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new ProviderError(
      `${config.name}: HTTP ${response.status} ${detail}`,
      config.name,
      response.status,
    );
  }

  let payload: CompletionResponse;
  try {
    payload = (await response.json()) as CompletionResponse;
  } catch {
    throw new ProviderError(`${config.name}: ответ не разобрался как JSON`, config.name);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError(`${config.name}: пустой ответ модели`, config.name);
  }

  return {
    content,
    provider: config.name,
    model: config.model,
    tokensIn: payload.usage?.prompt_tokens ?? null,
    tokensOut: payload.usage?.completion_tokens ?? null,
    latencyMs: Date.now() - startedAt,
  };
}

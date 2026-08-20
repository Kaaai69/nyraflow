import type { BriefAnswers } from "@/content/brief";
import { env } from "@/lib/env";
import { buildFallbackAnalysis } from "@/lib/ai/fallback";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { chat, ProviderError, type ProviderConfig } from "@/lib/ai/provider";
import { parseAnalysis, type BriefAnalysis } from "@/lib/ai/schema";

// Оркестрация разбора: провайдеры по очереди, затем детерминированный шаблон.
//
// Ответ клиенту важнее качества формулировок: пустого экрана он не увидит
// никогда. Отработавший фолбэк помечается в БД, чтобы было видно, как часто
// модели подводят.

export type AnalysisOutcome = {
  analysis: BriefAnalysis;
  provider: string;
  model: string;
  isFallback: boolean;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number;
  /** Что пошло не так у провайдеров, которые не сработали. */
  attempts: string[];
};

export async function analyzeBrief(answers: BriefAnswers): Promise<AnalysisOutcome> {
  const providers = env.aiProviders;
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(answers) },
  ];

  const attempts: string[] = [];

  for (const provider of providers) {
    const outcome = await tryProvider(provider, messages, attempts);
    if (outcome) return { ...outcome, attempts };
  }

  if (providers.length === 0) {
    attempts.push("провайдеры не настроены");
  }

  const startedAt = Date.now();
  return {
    analysis: buildFallbackAnalysis(answers),
    provider: "fallback",
    model: "rules",
    isFallback: true,
    tokensIn: null,
    tokensOut: null,
    latencyMs: Date.now() - startedAt,
    attempts,
  };
}

async function tryProvider(
  provider: ProviderConfig,
  messages: { role: "system" | "user"; content: string }[],
  attempts: string[],
): Promise<Omit<AnalysisOutcome, "attempts"> | null> {
  try {
    const result = await chat(provider, messages, {
      json: true,
      // Разбор с девятью секциями и пояснениями к каждой — это ~1500 токенов.
      // На лимите 1600 ответ обрывался на середине JSON и не проходил разбор.
      maxTokens: 3000,
      temperature: 0.4,
      timeoutMs: env.aiTimeoutMs,
    });

    const analysis = parseAnalysis(result.content);
    if (!analysis) {
      attempts.push(`${provider.name}: ответ не прошёл валидацию схемы`);
      // Сырое начало ответа в логах — без него причина отбраковки не видна.
      console.error(
        `[ai] ${provider.name} вернул непригодный ответ (${result.content.length} символов):`,
        result.content.slice(0, 400),
      );
      return null;
    }

    return {
      analysis,
      provider: result.provider,
      model: result.model,
      isFallback: false,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: result.latencyMs,
    };
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : String(error);
    attempts.push(message);
    console.error("[ai] провайдер не сработал", message);
    return null;
  }
}

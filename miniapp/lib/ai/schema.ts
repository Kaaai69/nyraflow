// Схема разбора брифа и её валидация.
//
// Модели на бесплатных тарифах иногда возвращают почти-правильный JSON: лишний
// ключ, строка вместо массива, восемь рисков вместо пяти. Валидатор приводит
// ответ к предсказуемой форме или честно отбраковывает его, чтобы сработал
// фолбэк. Своя проверка, а не zod: одна схема не стоит новой зависимости.

export type ProductId = "landing" | "web_service" | "ai_automation";

export type AnalysisSection = { section: string; purpose: string };
export type AnalysisRisk = { risk: string; mitigation: string };

export type BriefAnalysis = {
  summary: string;
  recommendedProduct: ProductId;
  offerHypothesis: string;
  structure: AnalysisSection[];
  risks: AnalysisRisk[];
  questions: string[];
};

const PRODUCTS: readonly ProductId[] = ["landing", "web_service", "ai_automation"];

const LIMITS = {
  summary: 600,
  offer: 400,
  section: 80,
  purpose: 300,
  risk: 200,
  mitigation: 300,
  question: 300,
} as const;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function pairs<T>(
  value: unknown,
  min: number,
  max: number,
  map: (item: Record<string, unknown>) => T | null,
): T[] | null {
  if (!Array.isArray(value)) return null;
  const result: T[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const mapped = map(item as Record<string, unknown>);
    if (mapped) result.push(mapped);
    if (result.length === max) break;
  }
  return result.length >= min ? result : null;
}

/** Разбирает ответ модели. Возвращает null, если ответ непригоден. */
export function parseAnalysis(raw: string): BriefAnalysis | null {
  let data: unknown;
  try {
    // Некоторые модели оборачивают JSON в ```json ... ``` вопреки инструкции.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    data = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;

  const summary = text(obj.summary, LIMITS.summary);
  const offerHypothesis = text(obj.offer_hypothesis ?? obj.offerHypothesis, LIMITS.offer);
  if (!summary || !offerHypothesis) return null;

  const productRaw = typeof obj.recommended_product === "string"
    ? obj.recommended_product
    : typeof obj.recommendedProduct === "string"
      ? obj.recommendedProduct
      : "";
  const recommendedProduct = PRODUCTS.find((p) => p === productRaw.trim());
  if (!recommendedProduct) return null;

  const structure = pairs<AnalysisSection>(obj.structure, 4, 9, (item) => {
    const section = text(item.section ?? item.title, LIMITS.section);
    const purpose = text(item.purpose ?? item.goal, LIMITS.purpose);
    return section && purpose ? { section, purpose } : null;
  });

  const risks = pairs<AnalysisRisk>(obj.risks, 2, 5, (item) => {
    const risk = text(item.risk ?? item.title, LIMITS.risk);
    const mitigation = text(item.mitigation ?? item.solution, LIMITS.mitigation);
    return risk && mitigation ? { risk, mitigation } : null;
  });

  const questions = Array.isArray(obj.questions)
    ? obj.questions
        .map((q) => text(q, LIMITS.question))
        .filter((q): q is string => q !== null)
        .slice(0, 5)
    : null;

  if (!structure || !risks || !questions || questions.length < 2) return null;

  return { summary, recommendedProduct, offerHypothesis, structure, risks, questions };
}

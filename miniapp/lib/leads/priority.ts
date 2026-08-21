import type { BriefAnswers } from "@/content/brief";

// Приоритет заявки.
//
// Отвечает на вопрос «с кем говорить первым», когда заявок больше, чем времени.
// Считается из четырёх сигналов, и все они берутся из того, что клиент сказал
// сам — никаких догадок о его платёжеспособности по нише или городу.
//
// Логика вынесена в отдельный модуль и не зависит от базы: её можно прогнать
// на любых текстах в тестах, не поднимая ничего.

export type PriorityLevel = "high" | "medium" | "low";

export type Priority = {
  level: PriorityLevel;
  score: number;
  /** Что именно повлияло — команде нужно видеть основание, а не только цифру. */
  reasons: string[];
  budget: number | null;
  /** Срок в днях, если его удалось понять из текста. */
  termDays: number | null;
};

// Суффиксы проверяются с начала строки, без \b.
//
// Граница слова в JavaScript определена через [A-Za-z0-9_], поэтому рядом с
// кириллицей она не срабатывает никогда: и «ч», и конец строки одинаково
// «не-словесные». Из-за \b множитель не применялся, «150 тысяч» читалось как
// 150 и отсеивалось порогом — в ленте у всех стояло «бюджет —».
const MULTIPLIERS: readonly { pattern: RegExp; factor: number }[] = [
  { pattern: /^\s*(млн|миллион)/i, factor: 1_000_000 },
  { pattern: /^\s*(к|k|тыс|т\.р|тр)/i, factor: 1_000 },
];

/**
 * Достаёт бюджет из свободного текста.
 *
 * Клиенты пишут «до 150 тысяч», «150к», «150 000 ₽», «от 100 до 200 тысяч».
 * Берём наибольшее число: если названа вилка, ориентируемся на верх — именно
 * он показывает, сколько человек готов отдать при хорошем предложении.
 */
export function extractBudget(text: string | undefined): number | null {
  if (!text) return null;

  const normalized = text.replace(/ /g, " ").toLowerCase();
  let best: number | null = null;

  // Число может идти с пробелами внутри разрядов: «150 000».
  const matches = normalized.matchAll(/(\d[\d\s]*(?:[.,]\d+)?)\s*([а-яёa-z.]*)/gi);

  for (const match of matches) {
    const raw = match[1]!.replace(/\s/g, "").replace(",", ".");
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value) || value <= 0) continue;

    const suffix = match[2] ?? "";
    let amount = value;

    for (const { pattern, factor } of MULTIPLIERS) {
      if (pattern.test(suffix)) {
        amount = value * factor;
        break;
      }
    }

    // Отсекаем явно не-деньги: сроки, количество мастеров, проценты.
    if (amount < 5_000) continue;
    if (amount > 100_000_000) continue;

    best = best === null ? amount : Math.max(best, amount);
  }

  return best;
}

const TERM_UNITS: readonly { pattern: RegExp; days: number }[] = [
  { pattern: /дн|день|дня|дней/i, days: 1 },
  { pattern: /недел/i, days: 7 },
  // Вместо \b — отрицательный просмотр вперёд: рядом с кириллицей граница
  // слова не работает (см. комментарий к MULTIPLIERS).
  { pattern: /месяц|мес(?![а-яё])/i, days: 30 },
  { pattern: /год|лет/i, days: 365 },
];

const WORD_NUMBERS: readonly [RegExp, number][] = [
  [/полтора|полутора/i, 1.5],
  [/пара|пару|две|два/i, 2],
  [/три|трёх|трех/i, 3],
  [/месяц-два|месяц-полтора/i, 1.5],
];

/** Понимает «полтора месяца», «2 недели», «до конца месяца», «срочно». */
export function extractTermDays(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.toLowerCase();

  if (/срочно|вчера|как можно быстрее|асап|asap/i.test(normalized)) return 7;

  for (const { pattern, days } of TERM_UNITS) {
    // Число перед единицей необязательно: «месяц» без числа — это один месяц.
    // Раньше оно требовалось, и такая ветка была недостижима.
    const unitMatch = normalized.match(
      new RegExp(`(?:([\\d.,]+|[а-яё-]+)\\s*)?(?:${pattern.source})`, "i"),
    );
    if (!unitMatch) continue;

    const token = unitMatch[1];
    if (!token) return days;

    const numeric = Number.parseFloat(token.replace(",", "."));

    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric * days);
    }

    for (const [wordPattern, value] of WORD_NUMBERS) {
      if (wordPattern.test(token)) return Math.round(value * days);
    }

    // Слово перед единицей не про количество («до месяца», «за месяц»).
    return days;
  }

  return null;
}

function scoreBudget(budget: number | null): { points: number; reason: string | null } {
  if (budget === null) return { points: 8, reason: null };
  if (budget >= 300_000) return { points: 40, reason: "бюджет от 300 000 ₽" };
  if (budget >= 120_000) return { points: 34, reason: "бюджет от 120 000 ₽" };
  if (budget >= 60_000) return { points: 25, reason: "бюджет от 60 000 ₽" };
  if (budget >= 30_000) return { points: 16, reason: "бюджет от 30 000 ₽" };
  return { points: 6, reason: "бюджет ниже минимального формата" };
}

function scoreTerm(days: number | null): { points: number; reason: string | null } {
  if (days === null) return { points: 8, reason: null };
  if (days <= 14) return { points: 25, reason: "нужно в пределах двух недель" };
  if (days <= 35) return { points: 20, reason: "срок — около месяца" };
  if (days <= 70) return { points: 13, reason: "срок — до двух месяцев" };
  return { points: 6, reason: "срок не горит" };
}

const PRODUCT_POINTS: Record<string, { points: number; reason: string }> = {
  ai_automation: { points: 20, reason: "задача на автоматизацию" },
  web_service: { points: 14, reason: "задача на веб-сервис" },
  landing: { points: 8, reason: "задача на лендинг" },
};

export type PriorityInput = {
  answers: BriefAnswers | null;
  recommendedProduct: string | null;
  /** Клиент нажал «обсудить разбор» — самый сильный сигнал намерения. */
  hasResponded: boolean;
};

export function calculatePriority({
  answers,
  recommendedProduct,
  hasResponded,
}: PriorityInput): Priority {
  const budgetText = answers?.budget_timeline;
  const budget = extractBudget(budgetText);
  const termDays = extractTermDays(budgetText);

  const reasons: string[] = [];
  let score = 0;

  const budgetScore = scoreBudget(budget);
  score += budgetScore.points;
  if (budgetScore.reason) reasons.push(budgetScore.reason);

  const termScore = scoreTerm(termDays);
  score += termScore.points;
  if (termScore.reason) reasons.push(termScore.reason);

  const product = recommendedProduct ? PRODUCT_POINTS[recommendedProduct] : undefined;
  if (product) {
    score += product.points;
    reasons.push(product.reason);
  }

  if (hasResponded) {
    score += 15;
    reasons.push("клиент сам попросил обсудить");
  }

  // Заполненный бриф — тоже сигнал: человек потратил время.
  const answered = answers ? Object.values(answers).filter((a) => a?.trim()).length : 0;
  if (answered >= 7) {
    score += 8;
  } else if (answered <= 4) {
    score -= 5;
    reasons.push("бриф заполнен наспех");
  }

  score = Math.max(0, Math.min(100, score));

  const level: PriorityLevel = score >= 65 ? "high" : score >= 40 ? "medium" : "low";

  return { level, score, reasons: reasons.slice(0, 3), budget, termDays };
}

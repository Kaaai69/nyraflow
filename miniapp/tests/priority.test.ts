import { describe, expect, it } from "vitest";

import { calculatePriority, extractBudget, extractTermDays } from "@/lib/leads/priority";

// Приоритет решает, кому позвонят первым. Ошибка здесь стоит денег, а разбор
// свободного текста — самое хрупкое место: клиенты пишут суммы и сроки как
// придётся.

describe("extractBudget", () => {
  it("понимает «до 150 тысяч»", () => {
    expect(extractBudget("Полтора месяца, бюджет до 150 тысяч")).toBe(150_000);
  });

  it("понимает сокращение «150к»", () => {
    expect(extractBudget("бюджет 150к")).toBe(150_000);
  });

  it("понимает разряды с пробелами", () => {
    expect(extractBudget("готовы вложить 250 000 рублей")).toBe(250_000);
  });

  it("понимает миллионы", () => {
    expect(extractBudget("до 1.5 млн")).toBe(1_500_000);
  });

  it("из вилки берёт верхнюю границу", () => {
    // Верх вилки показывает, сколько человек отдаст при хорошем предложении.
    expect(extractBudget("от 100 до 200 тысяч")).toBe(200_000);
  });

  it("не принимает срок за деньги", () => {
    expect(extractBudget("нужно за 2 месяца")).toBeNull();
  });

  it("возвращает null, если денег не назвали", () => {
    expect(extractBudget("бюджет обсудим")).toBeNull();
    expect(extractBudget(undefined)).toBeNull();
  });
});

describe("extractTermDays", () => {
  it("понимает «полтора месяца»", () => {
    expect(extractTermDays("Полтора месяца, до 150 тысяч")).toBe(45);
  });

  it("понимает недели", () => {
    expect(extractTermDays("нужно за 2 недели")).toBe(14);
  });

  it("понимает месяц без числа", () => {
    expect(extractTermDays("месяц")).toBe(30);
  });

  it("считает «срочно» неделей", () => {
    expect(extractTermDays("нужно срочно")).toBe(7);
  });

  it("возвращает null, когда срока нет", () => {
    expect(extractTermDays("бюджет 100 тысяч")).toBeNull();
  });
});

describe("calculatePriority", () => {
  const full = {
    business: "Студия ремонта кофемашин",
    audience: "Кофейни и частники",
    goal: "Нужны заявки с сайта",
    current_state: "Визитка на Тильде",
    advantage: "Выезд в день обращения",
    success_metric: "20 заявок в месяц",
    budget_timeline: "Полтора месяца, до 150 тысяч",
    references: "Нравится dyson",
  };

  it("крупный бюджет и близкий срок дают высокий приоритет", () => {
    const result = calculatePriority({
      answers: { ...full, budget_timeline: "Нужно за 2 недели, бюджет до 400 тысяч" },
      recommendedProduct: "ai_automation",
      hasResponded: true,
    });
    expect(result.level).toBe("high");
    expect(result.budget).toBe(400_000);
    expect(result.termDays).toBe(14);
  });

  it("маленький бюджет и дальний срок дают низкий приоритет", () => {
    const result = calculatePriority({
      answers: { ...full, budget_timeline: "Год, тысяч 20 максимум" },
      recommendedProduct: "landing",
      hasResponded: false,
    });
    expect(result.level).toBe("low");
  });

  it("отклик клиента поднимает приоритет", () => {
    const base = { answers: full, recommendedProduct: "landing" };
    const silent = calculatePriority({ ...base, hasResponded: false });
    const responded = calculatePriority({ ...base, hasResponded: true });
    expect(responded.score).toBeGreaterThan(silent.score);
  });

  it("наспех заполненный бриф понижает приоритет", () => {
    const result = calculatePriority({
      answers: { business: "Кафе", goal: "Сайт" },
      recommendedProduct: "landing",
      hasResponded: false,
    });
    expect(result.reasons).toContain("бриф заполнен наспех");
    expect(result.level).toBe("low");
  });

  it("объясняет основание, а не только показывает цифру", () => {
    const result = calculatePriority({
      answers: full,
      recommendedProduct: "web_service",
      hasResponded: true,
    });
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.length).toBeLessThanOrEqual(3);
  });

  it("не падает на пустом брифе", () => {
    const result = calculatePriority({
      answers: null,
      recommendedProduct: null,
      hasResponded: false,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("держит счёт в границах шкалы", () => {
    const result = calculatePriority({
      answers: { ...full, budget_timeline: "срочно, до 5 млн" },
      recommendedProduct: "ai_automation",
      hasResponded: true,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

import { describe, expect, it } from "vitest";

import { buildUserPrompt, sanitizeAnswer, SYSTEM_PROMPT } from "@/lib/ai/prompt";

// Контакты клиента не должны уезжать в чужой сервис: бесплатные тарифы
// оставляют за собой право учиться на переданных данных.

describe("sanitizeAnswer", () => {
  it("вырезает почту", () => {
    expect(sanitizeAnswer("пишите на ivan.petrov@example.com срочно")).toBe(
      "пишите на [почта] срочно",
    );
  });

  it("вырезает телефон в разных написаниях", () => {
    expect(sanitizeAnswer("звоните +7 999 123-45-67")).toContain("[телефон]");
    expect(sanitizeAnswer("тел 89991234567")).toContain("[телефон]");
    expect(sanitizeAnswer("+7 (999) 123 45 67")).toContain("[телефон]");
  });

  it("вырезает телеграм-ник", () => {
    expect(sanitizeAnswer("мой ник @ivanpetrov")).toBe("мой ник [ник]");
  });

  it("вырезает ссылки", () => {
    expect(sanitizeAnswer("сайт https://example.com/page?a=1 старый")).toBe(
      "сайт [ссылка] старый",
    );
  });

  it("не трогает обычный текст, включая цифры бюджета", () => {
    const text = "Бюджет до 150 000 рублей, срок 1,5 месяца, 4 мастера";
    expect(sanitizeAnswer(text)).toBe(text);
  });
});

describe("buildUserPrompt", () => {
  it("включает только заполненные ответы", () => {
    const prompt = buildUserPrompt({ business: "Барбершоп в центре", goal: "" });
    expect(prompt).toContain("Барбершоп в центре");
    expect(prompt).not.toContain("Что должно измениться");
  });

  it("прогоняет ответы через очистку контактов", () => {
    const prompt = buildUserPrompt({ business: "Пишите на mail@example.com" });
    expect(prompt).not.toContain("mail@example.com");
    expect(prompt).toContain("[почта]");
  });

  it("пустой бриф даёт пустой промпт, а не мусор", () => {
    expect(buildUserPrompt({})).toBe("");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("несёт прайс студии, чтобы модель не выдумывала цены", () => {
    expect(SYSTEM_PROMPT).toContain("30 000");
    expect(SYSTEM_PROMPT).toContain("60 000");
    expect(SYSTEM_PROMPT).toContain("120 000");
  });

  it("запрещает конструкторы — это противоречит позиционированию", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("конструктор");
  });

  it("требует русский язык в названиях секций", () => {
    expect(SYSTEM_PROMPT).toContain("Hero");
    expect(SYSTEM_PROMPT).toContain("Первый экран");
  });

  // Правка по итогам живого разбора: модель подавала срок клиента как риск
  // и рассуждала про A/B-тесты, которых студия не делает.
  it("запрещает подавать сроки клиента как риск", () => {
    expect(SYSTEM_PROMPT).toContain("СРОКИ");
    expect(SYSTEM_PROMPT).toContain("сжатые сроки");
  });

  it("выводит тестирование конверсии за пределы разбора", () => {
    expect(SYSTEM_PROMPT).toContain("A/B");
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("оптимизаци");
  });

  // Вторая итерация: запретив тестирование, модель ушла в соседнюю тему —
  // рекламные бюджеты и SEO-продвижение, которых студия тоже не продаёт.
  it("выводит привлечение трафика за пределы разбора", () => {
    expect(SYSTEM_PROMPT).toContain("ЗОНА ОТВЕТСТВЕННОСТИ");
    expect(SYSTEM_PROMPT).toContain("SEO-продвижение");
    expect(SYSTEM_PROMPT).toContain("рекламные бюджеты");
  });

  it("требует самопроверки перед выдачей ответа", () => {
    expect(SYSTEM_PROMPT).toContain("ПЕРЕД ОТВЕТОМ ПЕРЕЧИТАЙ");
  });

  it("несёт сроки сборки, чтобы модель не выдумывала их сама", () => {
    expect(SYSTEM_PROMPT).toContain("около двух недель");
  });
});

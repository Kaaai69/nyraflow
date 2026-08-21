import { describe, expect, it } from "vitest";

import { parseAnalysis } from "@/lib/ai/schema";

// Валидатор — последний рубеж между моделью и клиентом. Ответы бесплатных
// моделей бывают почти правильными, и «почти» здесь недопустимо.

const validPayload = {
  summary: "Студия ремонта кофемашин в Москве обслуживает кофейни и частных клиентов.",
  recommended_product: "landing",
  offer_hypothesis: "Выезд в день обращения с оригинальными запчастями.",
  structure: [
    { section: "Первый экран", purpose: "Объяснить услугу за пять секунд" },
    { section: "Услуги", purpose: "Разложить ремонт на понятные позиции" },
    { section: "Гарантии", purpose: "Показать годовую гарантию как аргумент" },
    { section: "Отзывы", purpose: "Снять сомнение отзывами кофеен" },
  ],
  risks: [
    { risk: "Сайт 2020 года не показывает выезд в день обращения", mitigation: "Выносим на первый экран" },
    { risk: "Заявки обрабатываются вручную", mitigation: "Подключаем уведомления в Telegram" },
  ],
  questions: ["Кто принимает решение?", "Какая средняя стоимость ремонта?"],
};

describe("parseAnalysis", () => {
  it("разбирает корректный ответ", () => {
    const result = parseAnalysis(JSON.stringify(validPayload));
    expect(result).not.toBeNull();
    expect(result?.recommendedProduct).toBe("landing");
    expect(result?.structure).toHaveLength(4);
    expect(result?.summary).toContain("кофемашин");
  });

  it("снимает markdown-обёртку, которую модели ставят вопреки инструкции", () => {
    const wrapped = "```json\n" + JSON.stringify(validPayload) + "\n```";
    expect(parseAnalysis(wrapped)).not.toBeNull();
  });

  it("отбраковывает обрезанный JSON — это симптом упора в лимит токенов", () => {
    const truncated = JSON.stringify(validPayload).slice(0, 200);
    expect(parseAnalysis(truncated)).toBeNull();
  });

  it("отбраковывает продукт вне списка форматов студии", () => {
    const bad = { ...validPayload, recommended_product: "mobile_app" };
    expect(parseAnalysis(JSON.stringify(bad))).toBeNull();
  });

  it("отбраковывает слишком короткую структуру", () => {
    const bad = { ...validPayload, structure: validPayload.structure.slice(0, 2) };
    expect(parseAnalysis(JSON.stringify(bad))).toBeNull();
  });

  it("отбраковывает ответ с одним вопросом", () => {
    const bad = { ...validPayload, questions: ["Единственный вопрос?"] };
    expect(parseAnalysis(JSON.stringify(bad))).toBeNull();
  });

  it("принимает camelCase-ключи: модели путают соглашения", () => {
    const camel = {
      summary: validPayload.summary,
      recommendedProduct: "web_service",
      offerHypothesis: validPayload.offer_hypothesis,
      structure: validPayload.structure,
      risks: validPayload.risks,
      questions: validPayload.questions,
    };
    expect(parseAnalysis(JSON.stringify(camel))?.recommendedProduct).toBe("web_service");
  });

  it("обрезает лишнее: девять секций максимум", () => {
    const many = {
      ...validPayload,
      structure: Array.from({ length: 14 }, (_, i) => ({
        section: `Секция ${i}`,
        purpose: "Назначение",
      })),
    };
    expect(parseAnalysis(JSON.stringify(many))?.structure.length).toBe(9);
  });

  it("пропускает битые элементы массива, но принимает остальные", () => {
    const mixed = {
      ...validPayload,
      structure: [
        ...validPayload.structure,
        { section: "Без назначения" },
        "строка вместо объекта",
      ],
    };
    expect(parseAnalysis(JSON.stringify(mixed))?.structure).toHaveLength(4);
  });

  // Живой прогон показал: промпт запрещает эти темы, но модель их всё равно
  // выдаёт. Фильтр — гарантия там, где инструкция лишь намерение.
  it("выбрасывает риск про ограниченный бюджет", () => {
    const bad = {
      ...validPayload,
      risks: [
        { risk: "Ограниченный бюджет до 400 000 ₽ ограничит функциональность", mitigation: "Сократить объём" },
        ...validPayload.risks,
      ],
    };
    const result = parseAnalysis(JSON.stringify(bad));
    expect(result?.risks.some((r) => /ограниченн/i.test(r.risk))).toBe(false);
    expect(result?.risks.length).toBe(2);
  });

  it("выбрасывает риск про сжатые сроки", () => {
    const bad = {
      ...validPayload,
      risks: [
        { risk: "Сжатые сроки могут помешать запуску", mitigation: "Начать раньше" },
        ...validPayload.risks,
      ],
    };
    expect(parseAnalysis(JSON.stringify(bad))?.risks.some((r) => /сжат/i.test(r.risk))).toBe(false);
  });

  it("выбрасывает вопрос про рекламный бюджет", () => {
    const bad = {
      ...validPayload,
      questions: [
        "Какой рекламный бюджет вы планируете?",
        "Кто принимает решение?",
        "Что считаете целевым обращением?",
      ],
    };
    const result = parseAnalysis(JSON.stringify(bad));
    expect(result?.questions.some((q) => /рекламн/i.test(q))).toBe(false);
    expect(result?.questions.length).toBe(2);
  });

  it("отбраковывает ответ, если после фильтра рисков не осталось", () => {
    const bad = {
      ...validPayload,
      risks: [
        { risk: "Ограниченный бюджет мешает", mitigation: "Урезать" },
        { risk: "Сжатые сроки давят", mitigation: "Ускориться" },
      ],
    };
    expect(parseAnalysis(JSON.stringify(bad))).toBeNull();
  });

  it("не падает на мусоре вместо JSON", () => {
    expect(parseAnalysis("извините, я не могу помочь")).toBeNull();
    expect(parseAnalysis("")).toBeNull();
  });
});

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

  it("не падает на мусоре вместо JSON", () => {
    expect(parseAnalysis("извините, я не могу помочь")).toBeNull();
    expect(parseAnalysis("")).toBeNull();
  });
});

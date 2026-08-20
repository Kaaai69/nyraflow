import { describe, expect, it } from "vitest";

import { buildFallbackAnalysis } from "@/lib/ai/fallback";
import { parseAnalysis } from "@/lib/ai/schema";
import type { BriefAnswers } from "@/content/brief";

// Фолбэк — это то, что увидит клиент, когда молчат все провайдеры. Он обязан
// быть не хуже вежливой заглушки и обязан проходить ту же схему, что и модель.

const fullAnswers: BriefAnswers = {
  business: "Студия ремонта кофемашин в Москве, 4 мастера",
  audience: "Кофейни 60 процентов, частники 40 процентов",
  goal: "Заявки идут только из сарафана, сайт не приносит обращений",
  current_state: "Визитка на Тильде, заявки принимаем в вотсапе вручную",
  advantage: "Выезд в день обращения, оригинальные запчасти, гарантия год",
  success_metric: "20 заявок в месяц, сейчас одна-две",
  budget_timeline: "Полтора месяца, до 150 тысяч",
};

describe("buildFallbackAnalysis", () => {
  it("выдаёт разбор, проходящий ту же схему, что и ответ модели", () => {
    const analysis = buildFallbackAnalysis(fullAnswers);
    const asModelWould = JSON.stringify({
      summary: analysis.summary,
      recommended_product: analysis.recommendedProduct,
      offer_hypothesis: analysis.offerHypothesis,
      structure: analysis.structure,
      risks: analysis.risks,
      questions: analysis.questions,
    });
    expect(parseAnalysis(asModelWould)).not.toBeNull();
  });

  it("не скатывается в два пункта на полностью заполненном брифе", () => {
    const analysis = buildFallbackAnalysis(fullAnswers);
    expect(analysis.risks.length).toBeGreaterThanOrEqual(3);
    expect(analysis.questions.length).toBeGreaterThanOrEqual(3);
    expect(analysis.structure.length).toBeGreaterThanOrEqual(6);
  });

  it("держится в границах схемы на пустом брифе", () => {
    const analysis = buildFallbackAnalysis({});
    expect(analysis.risks.length).toBeGreaterThanOrEqual(3);
    expect(analysis.risks.length).toBeLessThanOrEqual(5);
    expect(analysis.questions.length).toBeLessThanOrEqual(5);
    expect(analysis.structure.length).toBeLessThanOrEqual(9);
  });

  it("опирается на отличие клиента в гипотезе оффера", () => {
    const analysis = buildFallbackAnalysis(fullAnswers);
    expect(analysis.offerHypothesis).toContain("Выезд в день обращения");
  });

  it("узнаёт задачу на автоматизацию по ручной работе в ответах", () => {
    const analysis = buildFallbackAnalysis({
      business: "Оптовая компания",
      goal: "Заявки обрабатываем вручную, менеджеры копируют данные в таблицы руками",
      current_state: "Всё в excel, повторяющиеся операции съедают день",
    });
    expect(analysis.recommendedProduct).toBe("ai_automation");
  });

  it("узнаёт веб-сервис по кабинету и каталогу", () => {
    const analysis = buildFallbackAnalysis({
      business: "Прокат оборудования",
      goal: "Нужен личный кабинет клиента и каталог с бронированием",
      current_state: "Записываем в блокнот",
    });
    expect(analysis.recommendedProduct).toBe("web_service");
  });

  it("по умолчанию предлагает лендинг", () => {
    expect(buildFallbackAnalysis({ business: "Барбершоп" }).recommendedProduct).toBe("landing");
  });
});

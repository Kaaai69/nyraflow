import { briefQuestions, type BriefAnswers } from "@/content/brief";
import type { BriefAnalysis, ProductId } from "@/lib/ai/schema";

// Разбор без модели.
//
// Нужен, когда провайдеры недоступны или вернули мусор. Клиент никогда не
// видит «AI недоступен» — он видит разбор, просто менее живой. Собирается по
// правилам из его же ответов, поэтому остаётся честным, а не выдуманным.

const AUTOMATION_MARKERS = [
  "вручную", "руками", "рутин", "повторя", "обрабатыва", "документ",
  "excel", "таблиц", "копиру", "переписыва",
];

const SERVICE_MARKERS = [
  "кабинет", "каталог", "бронир", "расчёт", "расчет", "калькулятор",
  "заказ", "подбор", "запис", "склад", "crm", "интеграц", "внутренн",
];

function pickProduct(answers: BriefAnswers): ProductId {
  const haystack = Object.values(answers).join(" ").toLowerCase();
  const hits = (markers: readonly string[]) => markers.filter((m) => haystack.includes(m)).length;

  if (hits(AUTOMATION_MARKERS) >= 2) return "ai_automation";
  if (hits(SERVICE_MARKERS) >= 2) return "web_service";
  return "landing";
}

function firstSentence(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  const clipped = sentence.length > 220 ? `${sentence.slice(0, 219)}…` : sentence;
  // Точка в конце обязательна: куски склеиваются в один абзац, и без неё
  // получалось «четыре кресла Люди находят нас в поиске».
  return /[.!?…]$/.test(clipped) ? clipped : `${clipped}.`;
}

const ALWAYS_RELEVANT_RISKS: readonly { risk: string; mitigation: string }[] = [
  {
    risk: "Контент и материалы со стороны клиента — частая причина срыва сроков",
    mitigation: "Список нужных материалов выдаём на первом этапе, с дедлайнами по каждому пункту",
  },
  {
    risk: "Без аналитики не видно, на каком шаге теряются обращения",
    mitigation: "Подключаем события на ключевые действия ещё до запуска, а не после",
  },
  {
    risk: "Заявка остывает, если ответ приходит не в первые минуты",
    mitigation: "Заявки падают в Telegram сразу, с контекстом — отвечать можно не открывая почту",
  },
] as const;

const ALWAYS_RELEVANT_QUESTIONS: readonly string[] = [
  "Кто принимает финальное решение по проекту с вашей стороны?",
  "Какие обращения вы считаете целевыми, а какие — пустыми?",
  "Что происходит с заявкой после того, как она к вам попала?",
] as const;

const BASE_STRUCTURE: readonly { section: string; purpose: string }[] = [
  { section: "Первый экран", purpose: "За 5 секунд объяснить, что предлагаете и кому это подходит" },
  { section: "Проблема клиента", purpose: "Показать, что вы понимаете ситуацию, в которой он находится" },
  { section: "Что вы делаете", purpose: "Разложить услугу на понятные шаги вместо общего описания" },
  { section: "Почему вы", purpose: "Отличия, которые можно проверить, а не заявить" },
  { section: "Работы и результаты", purpose: "Снять сомнение фактами, а не обещаниями" },
  { section: "Как начать", purpose: "Один понятный следующий шаг вместо формы «оставьте заявку»" },
];

export function buildFallbackAnalysis(answers: BriefAnswers): BriefAnalysis {
  const recommendedProduct = pickProduct(answers);

  const business = firstSentence(answers.business, "Бизнес по описанию из брифа");
  const goal = firstSentence(answers.goal, "Задача — получать больше обращений");
  const advantage = answers.advantage?.trim();

  const structure = [...BASE_STRUCTURE];
  if (advantage) {
    structure.splice(4, 0, {
      section: "Гарантии и условия",
      purpose: `Развернуть то, что вы назвали своим отличием: ${firstSentence(advantage, advantage)}`,
    });
  }

  const risks: BriefAnalysis["risks"] = [];
  if (!answers.success_metric?.trim()) {
    risks.push({
      risk: "Нет измеримой цели — успех проекта будет оцениваться на ощущениях",
      mitigation: "Фиксируем целевое число обращений до начала работы и настраиваем аналитику под него",
    });
  }
  if (!advantage) {
    risks.push({
      risk: "Отличия от конкурентов не сформулированы, предложение рискует выглядеть как у всех",
      mitigation: "На диагностике вытаскиваем проверяемые отличия и строим оффер вокруг них",
    });
  }
  if (answers.current_state?.toLowerCase().includes("вручную")) {
    risks.push({
      risk: "Ручная обработка обращений не выдержит роста потока после запуска",
      mitigation: "Закладываем структуру, к которой подключаются CRM и автоматизации без переделки",
    });
  }
  // Добираем до трёх: когда бриф заполнен полностью, поводов для риска из
  // пропусков не остаётся, а разбор из двух пунктов выглядит отпиской.
  for (const extra of ALWAYS_RELEVANT_RISKS) {
    if (risks.length >= 3) break;
    risks.push(extra);
  }

  const questions = briefQuestions
    .filter((q) => q.required && !answers[q.id]?.trim())
    .map((q) => q.title)
    .slice(0, 2);

  for (const extra of ALWAYS_RELEVANT_QUESTIONS) {
    if (questions.length >= 4) break;
    questions.push(extra);
  }

  return {
    summary: `${business} ${goal} Разбор собран автоматически по вашим ответам — на созвоне уточним детали.`,
    recommendedProduct,
    offerHypothesis: advantage
      ? `${firstSentence(advantage, advantage)} — это и есть основа предложения, которую стоит вынести на первый экран.`
      : "Предложение соберём вокруг проверяемого отличия — его определим на диагностике.",
    structure: structure.slice(0, 9),
    risks: risks.slice(0, 5),
    questions: questions.slice(0, 5),
  };
}

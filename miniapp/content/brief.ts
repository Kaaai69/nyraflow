// Вопросы брифа.
//
// Один источник правды: по этому списку API валидирует входящие ответы, а
// интерфейс потом рисует экраны. Порядок важен — он же порядок экранов.

export type BriefQuestionId =
  | "business"
  | "audience"
  | "goal"
  | "current_state"
  | "advantage"
  | "success_metric"
  | "budget_timeline"
  | "references";

export type BriefQuestion = {
  id: BriefQuestionId;
  /** Короткий вопрос — заголовок экрана. */
  title: string;
  /** Подсказка под полем: что именно писать. */
  hint: string;
  placeholder: string;
  required: boolean;
  minLength: number;
};

export const briefQuestions: readonly BriefQuestion[] = [
  {
    id: "business",
    title: "Чем занимается бизнес?",
    hint: "Что продаёте, где работаете, сколько человек в команде.",
    placeholder: "Студия ремонта кофемашин в Москве, 4 мастера",
    required: true,
    minLength: 15,
  },
  {
    id: "audience",
    title: "Кто ваши клиенты?",
    hint: "Если сегментов несколько — укажите примерные доли.",
    placeholder: "Кофейни — примерно 60%, частники с дорогой техникой — 40%",
    required: true,
    minLength: 15,
  },
  {
    id: "goal",
    title: "Что должно измениться после запуска?",
    hint: "Главная причина, по которой вы сейчас это делаете.",
    placeholder: "Заявки идут только из сарафана, с сайта — ноль",
    required: true,
    minLength: 15,
  },
  {
    id: "current_state",
    title: "Что уже есть?",
    hint: "Сайт, соцсети, реклама, CRM — и как сейчас принимаете заявки.",
    placeholder: "Визитка на Тильде 2020 года, инстаграм 3к, заявки в вотсапе вручную",
    required: true,
    minLength: 10,
  },
  {
    id: "advantage",
    title: "Чем вы лучше конкурентов?",
    hint: "Только то, что можно проверить. Без «высокого качества и индивидуального подхода».",
    placeholder: "Выезд в день обращения, оригинальные запчасти, гарантия год",
    required: true,
    minLength: 15,
  },
  {
    id: "success_metric",
    title: "По какому числу поймём, что получилось?",
    hint: "Заявки, продажи, сэкономленные часы — и сколько сейчас.",
    placeholder: "20 заявок в месяц с сайта, сейчас 1-2",
    required: true,
    minLength: 5,
  },
  {
    id: "budget_timeline",
    title: "Сроки и бюджет?",
    hint: "Ориентир, а не точная цифра. Помогает предложить реалистичный формат.",
    placeholder: "Полтора месяца, до 150 тысяч",
    required: true,
    minLength: 5,
  },
  {
    id: "references",
    title: "Что нравится и что категорически нет?",
    hint: "Ссылки или описание словами — оба варианта работают.",
    placeholder: "Нравится сайт dyson, не нравятся шаблоны с людьми в галстуках",
    required: false,
    minLength: 0,
  },
] as const;

export const briefQuestionIds = briefQuestions.map((q) => q.id) as readonly BriefQuestionId[];

export type BriefAnswers = Partial<Record<BriefQuestionId, string>>;

/** Максимальная длина одного ответа — защита от простыней и от раздувания промпта. */
export const MAX_ANSWER_LENGTH = 1500;

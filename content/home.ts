export type HomeSectionId =
  | "hero"
  | "credibility"
  | "problem"
  | "work"
  | "services"
  | "team"
  | "process"
  | "faq"
  | "contact";

export type ImageAsset = {
  src: `/images/${string}`;
  alt: string;
  width: number;
  height: number;
};

type WorkMediaBase = ImageAsset & {
  caption: string;
};

export type WorkMedia =
  | (WorkMediaBase & {
      status: "published";
      isTemporary: false;
      href: `https://${string}`;
      cta: string;
    })
  | (WorkMediaBase & {
      status: "concept";
      isTemporary: true;
      href?: never;
      cta?: never;
    });

type TextItem = {
  id: string;
  title: string;
  description: string;
};

type ServiceItem = {
  id: string;
  title: string;
  whenNeeded: string;
  whatWeDo: string;
  businessOutcome: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  description: string;
  isRoleConfirmed: boolean;
  photo: ImageAsset;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type HomeContent = {
  hero: {
    id: "hero";
    isLockedInSpline: true;
  };
  credibility: {
    id: "credibility";
    items: readonly TextItem[];
  };
  problem: {
    id: "problem";
    title: string;
    description: string;
    items: readonly TextItem[];
    conclusion: string;
  };
  work: {
    id: "work";
    title: string;
    description: string;
    media: readonly WorkMedia[];
  };
  services: {
    id: "services";
    title: string;
    description: string;
    cta: string;
    items: readonly ServiceItem[];
  };
  team: {
    id: "team";
    title: string;
    description: string;
    items: readonly TeamMember[];
  };
  process: {
    id: "process";
    title: string;
    description: string;
    items: readonly TextItem[];
  };
  faq: {
    id: "faq";
    items: readonly FaqItem[];
  };
  contact: {
    id: "contact";
    title: string;
    description: string;
    fields: readonly string[];
    cta: string;
    privacyNotice: null;
    directContact: null;
  };
};

export const homeSectionOrder = [
  "hero",
  "credibility",
  "problem",
  "work",
  "services",
  "team",
  "process",
  "faq",
  "contact",
] as const satisfies readonly HomeSectionId[];

export const homeContent = {
  hero: {
    id: "hero",
    isLockedInSpline: true,
  },
  credibility: {
    id: "credibility",
    items: [
      {
        id: "direct-team-contact",
        title: "Прямой контакт с командой",
        description:
          "Задачу ведут те же люди, которые проектируют и собирают продукт. Без цепочки менеджеров и потери контекста.",
      },
      {
        id: "one-process",
        title: "Один процесс от идеи до запуска",
        description:
          "Стратегия, дизайн, разработка и автоматизация собираются вокруг одной бизнес-цели.",
      },
      {
        id: "foundation-for-growth",
        title: "Основа для развития",
        description:
          "Передаём понятную систему, которую можно измерять, обновлять и расширять после запуска.",
      },
    ],
  },
  problem: {
    id: "problem",
    title: "Красивого интерфейса недостаточно.",
    description:
      "Digital-продукт приносит результат, когда предложение, сценарий, интерфейс и техническая часть усиливают друг друга.",
    items: [
      {
        id: "unclear-value",
        title: "Ценность не считывается сразу",
        description:
          "Посетитель видит набор услуг, но не понимает, почему решение подходит именно его задаче.",
      },
      {
        id: "broken-path",
        title: "Путь обрывается до действия",
        description:
          "Контент объясняет продукт, но не переводит интерес в следующий понятный шаг.",
      },
      {
        id: "disconnected-systems",
        title: "Системы не связаны",
        description:
          "Сайт, формы, аналитика и внутренние процессы существуют отдельно и создают ручную работу.",
      },
    ],
    conclusion:
      "Мы проектируем не отдельный экран, а связанный путь от первого контакта до рабочего процесса внутри бизнеса.",
  },
  work: {
    id: "work",
    title: "Работа, которую можно проверить.",
    description:
      "Показываем не только интерфейс. Для каждого проекта объясняем контекст, принятые решения и подтверждённый результат.",
    media: [
      {
        src: "/images/work/aura-reference.jpg",
        alt: "Скриншот опубликованного проекта в сфере загородной недвижимости",
        caption: "Опубликованный проект в сфере загородной недвижимости",
        width: 1272,
        height: 716,
        status: "published",
        isTemporary: false,
        href: "https://aura-developer.vercel.app/",
        cta: "Открыть опубликованный проект",
      },
      {
        src: "/images/work/concept-01.jpg",
        alt: "Временный визуальный референс для композиции портфолио",
        caption: "Концепт",
        width: 1600,
        height: 1000,
        status: "concept",
        isTemporary: true,
      },
      {
        src: "/images/work/concept-02.jpg",
        alt: "Временный визуальный референс для композиции портфолио",
        caption: "Концепт",
        width: 1600,
        height: 1000,
        status: "concept",
        isTemporary: true,
      },
    ],
  },
  services: {
    id: "services",
    title: "Собираем продукт вокруг бизнес-задачи.",
    description:
      "Формат работы зависит от того, что должно измениться после запуска: продажи, сервис или внутренний процесс.",
    cta: "Обсудить проект",
    items: [
      {
        id: "conversion-websites",
        title: "Конверсионные сайты",
        whenNeeded:
          "Когда предложение сложно объяснить, текущий сайт не ведёт к действию или новый продукт нужно уверенно вывести на рынок.",
        whatWeDo:
          "Исследуем аудиторию, собираем структуру, пишем ключевые смыслы, проектируем интерфейс и подключаем аналитику.",
        businessOutcome:
          "Ясный путь от первого экрана до заявки и основу для дальнейших улучшений.",
      },
      {
        id: "web-services",
        title: "Веб-сервисы",
        whenNeeded:
          "Когда клиентский или внутренний процесс уже не помещается в лендинг, таблицу или набор ручных действий.",
        whatWeDo:
          "Проектируем сценарии, роли, состояния и интерфейс, затем собираем устойчивый продукт вокруг реального процесса.",
        businessOutcome:
          "Сервис, который сокращает ручную координацию и делает работу понятной для пользователей и команды.",
      },
      {
        id: "ai-automation",
        title: "AI-автоматизации",
        whenNeeded:
          "Когда заявки, документы или повторяющиеся операции требуют постоянной ручной обработки.",
        whatWeDo:
          "Находим подходящие точки автоматизации, связываем сервисы и задаём безопасный сценарий контроля результата человеком.",
        businessOutcome:
          "Меньше повторяющейся работы и более быстрый путь данных к нужному сотруднику или системе.",
      },
    ],
  },
  team: {
    id: "team",
    title: "Два человека. Одна ответственность за результат.",
    description:
      "Работаем небольшой командой, чтобы сохранять контекст, быстро принимать решения и отвечать за продукт целиком.",
    items: [
      {
        id: "arseniy",
        name: "Арсений",
        role: "Стратегия и дизайн",
        description:
          "Отвечает за исследование, структуру и визуальную систему. Помогает превратить разрозненные идеи в продукт, который ясно объясняет ценность.",
        isRoleConfirmed: false,
        photo: {
          src: "/images/team/arseniy.jpg",
          alt: "Арсений",
          width: 1280,
          height: 960,
        },
      },
      {
        id: "artem",
        name: "Артём",
        role: "Разработка и автоматизация",
        description:
          "Отвечает за техническую архитектуру, интеграции и запуск. Собирает устойчивую основу и связывает продукт с процессами бизнеса.",
        isRoleConfirmed: false,
        photo: {
          src: "/images/team/artem.jpg",
          alt: "Артём",
          width: 1920,
          height: 2560,
        },
      },
    ],
  },
  process: {
    id: "process",
    title: "Сначала смысл. Потом система. Затем запуск.",
    description:
      "Каждый этап заканчивается понятным результатом, который можно проверить до следующего шага.",
    items: [
      {
        id: "understand",
        title: "Разобраться",
        description:
          "Уточняем задачу, аудиторию, ограничения и критерии результата. Фиксируем, что именно должен изменить продукт.",
      },
      {
        id: "design",
        title: "Спроектировать",
        description:
          "Собираем пользовательский путь, структуру, ключевые смыслы и визуальное направление.",
      },
      {
        id: "build",
        title: "Собрать",
        description:
          "Разрабатываем интерфейс, подключаем данные, формы, аналитику и необходимые интеграции.",
      },
      {
        id: "launch",
        title: "Запустить и проверить",
        description:
          "Тестируем ключевые сценарии, публикуем продукт, передаём доступы и определяем следующие точки роста.",
      },
    ],
  },
  faq: {
    id: "faq",
    items: [
      {
        id: "no-specification",
        question: "С чего начать, если у нас нет подробного ТЗ?",
        answer:
          "Достаточно описать задачу, текущую ситуацию и желаемый результат. На первой встрече мы соберём недостающий контекст и предложим следующий шаг.",
      },
      {
        id: "time-and-budget",
        question: "Как формируются сроки и бюджет?",
        answer:
          "После короткой диагностики фиксируем объём, зависимости и критерии готовности. Оценка строится вокруг состава работ, а не количества экранов.",
      },
      {
        id: "visual-direction",
        question: "Что произойдёт, если визуальное направление не подойдёт?",
        answer:
          "До полной разработки согласуем структуру и ключевой визуальный принцип. Это позволяет проверить направление, пока изменения ещё не затрагивают весь продукт.",
      },
      {
        id: "updates-after-launch",
        question: "Сможем ли мы обновлять продукт после запуска?",
        answer:
          "Способ управления зависит от задачи. До начала разработки согласуем, какие данные команда должна менять самостоятельно и как будет устроена передача.",
      },
      {
        id: "analytics-and-integrations",
        question: "Вы подключаете аналитику и внешние сервисы?",
        answer:
          "Да, если они входят в согласованный сценарий продукта. Набор интеграций и события аналитики фиксируются до реализации.",
      },
      {
        id: "after-launch",
        question: "Что происходит после запуска?",
        answer:
          "Проверяем основные сценарии, передаём доступы и документацию. Формат дальнейшей поддержки или развития согласуется отдельно.",
      },
    ],
  },
  contact: {
    id: "contact",
    title: "Обсудим, какой продукт нужен вашему бизнесу.",
    description:
      "Опишите задачу в нескольких предложениях. Мы разберём контекст и предложим понятный следующий шаг.",
    fields: [
      "Ваше имя",
      "Телефон, Telegram или email",
      "Коротко о задаче",
    ],
    cta: "Обсудить проект",
    privacyNotice: null,
    directContact: null,
  },
} as const satisfies HomeContent;

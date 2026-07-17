export type HomeSectionId =
  | "hero"
  | "credibility"
  | "problem"
  | "metrics"
  | "work"
  | "starter"
  | "pricing"
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
  id: string;
  title: string;
  caption: string;
};

export type WorkMedia = WorkMediaBase & {
  status: "published";
  href: `https://${string}`;
  cta: string;
};

type TextItem = {
  id: string;
  title: string;
  description: string;
};

type MetricItem = TextItem & {
  value: string;
};

export type StarterIconName =
  | "structure"
  | "copy"
  | "analytics"
  | "automation";

type StarterItem = TextItem & {
  icon: StarterIconName;
};

export type PricingItem = {
  id: string;
  title: string;
  price: string;
  description: string;
  included: readonly string[];
  optional?: readonly string[];
  featured?: boolean;
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
  metrics: {
    id: "metrics";
    items: readonly MetricItem[];
  };
  work: {
    id: "work";
    title: string;
    description: string;
    media: readonly WorkMedia[];
  };
  starter: {
    id: "starter";
    title: string;
    price: string;
    items: readonly StarterItem[];
  };
  pricing: {
    id: "pricing";
    title: string;
    description: string;
    cta: string;
    items: readonly PricingItem[];
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
  "metrics",
  "work",
  "starter",
  "pricing",
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
    title:
      "Разрабатываем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
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
  metrics: {
    id: "metrics",
    items: [
      {
        id: "experience",
        value: "2+",
        title: "года опыта разработки",
        description:
          "Проектируем и собираем сайты под конкретные задачи бизнеса, а не ради набора красивых экранов.",
      },
      {
        id: "completed-projects",
        value: "20+",
        title: "выполненных проектов",
        description:
          "Лендинги, сервисные сайты, каталоги, формы и интеграции для разных ниш.",
      },
      {
        id: "contract-deadlines",
        value: "100%",
        title: "дедлайны по договору",
        description:
          "Сроки, объём работ и ожидаемый результат фиксируются до начала разработки.",
      },
    ],
  },
  work: {
    id: "work",
    title: "Работа, которую можно проверить.",
    description:
      "Показываем не только интерфейс. Для каждого проекта объясняем контекст, принятые решения и подтверждённый результат.",
    media: [
      {
        id: "atelier-kitchens",
        title: "Atelier Kitchens",
        src: "/images/work/atelier-kitchens.jpg",
        alt: "Главная страница кухонной студии Atelier Kitchens",
        caption: "Кухонная студия",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://atelier-kitchens.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "premium-school-landing",
        title: "Лингва.Академия",
        src: "/images/work/premium-school-landing.jpg",
        alt: "Главная страница онлайн-школы языков Лингва.Академия",
        caption: "Онлайн-школа языков",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://premium-school-landing.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "glamping-silenzio",
        title: "Silenzio",
        src: "/images/work/glamping-silenzio.jpg",
        alt: "Главная страница загородного глэмпинга Silenzio",
        caption: "Загородный глэмпинг",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://glamping-silenzio.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "aether-landing",
        title: "Мезонин",
        src: "/images/work/aether-landing.jpg",
        alt: "Главная страница агентства недвижимости Мезонин",
        caption: "Агентство недвижимости",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://aether-landing-liard.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "furniture",
        title: "Дом в деталях",
        src: "/images/work/furniture.jpg",
        alt: "Главная страница студии мебели на заказ Дом в деталях",
        caption: "Мебель на заказ",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://furniture-tau-two.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "florist",
        title: "Florea",
        src: "/images/work/florist.jpg",
        alt: "Главная страница цветочной студии Florea",
        caption: "Цветочная студия",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://florist-six.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "amore",
        title: "Amore",
        src: "/images/work/amore.jpg",
        alt: "Главная страница свадебного агентства Amore",
        caption: "Свадебное агентство",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://amore-liart.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "soul",
        title: "SOUL",
        src: "/images/work/soul.jpg",
        alt: "Главная страница студии йоги и пилатеса SOUL",
        caption: "Студия йоги и пилатеса",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://soul-dun-two.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "detailing",
        title: "Detail Pro",
        src: "/images/work/detailing.jpg",
        alt: "Главная страница студии автодетейлинга Detail Pro",
        caption: "Студия автодетейлинга",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://detailing-silk.vercel.app",
        cta: "Открыть проект",
      },
      {
        id: "groom",
        title: "Groom Atelier",
        src: "/images/work/groom.jpg",
        alt: "Главная страница салона груминга Groom Atelier",
        caption: "Салон груминга",
        width: 1440,
        height: 900,
        status: "published",
        href: "https://groom-woad.vercel.app",
        cta: "Открыть проект",
      },
    ],
  },
  starter: {
    id: "starter",
    title: "Быстрый старт",
    price: "от 20 000 ₽",
    items: [
      {
        id: "selling-structure",
        icon: "structure",
        title: "Продающая структура",
        description:
          "Оффер, блоки доверия и понятный путь к заявке собираются вокруг одной бизнес-задачи.",
      },
      {
        id: "copy-and-packaging",
        icon: "copy",
        title: "Тексты и упаковка",
        description:
          "Формулируем ценность продукта и аргументы для клиента, даже если подробного ТЗ пока нет.",
      },
      {
        id: "integrations-and-analytics",
        icon: "analytics",
        title: "Интеграции и аналитика",
        description:
          "Подключаем формы, Telegram и базовые события, чтобы видеть обращения и ключевые действия.",
      },
      {
        id: "automation-ready",
        icon: "automation",
        title: "Готовность к автоматизации",
        description:
          "Закладываем структуру, к которой позже можно подключить CRM, ботов и новые сценарии.",
      },
    ],
  },
  pricing: {
    id: "pricing",
    title: "Форматы работы и стоимость",
    description:
      "Выберите подходящий уровень продукта. Точный состав работ фиксируем после короткого разбора задачи.",
    cta: "Обсудить проект",
    items: [
      {
        id: "landing",
        title: "Лендинг",
        price: "от 20 000 ₽",
        description: "Для запуска продукта, услуги или проверки новой ниши.",
        included: [
          "Маркетинговая упаковка",
          "Адаптация под мобильные устройства",
          "Базовая SEO-настройка",
          "Форма заявки в Telegram",
        ],
        optional: [
          "Индивидуальный или анимированный дизайн",
          "Расширенное количество секций",
          "Углублённая SEO-настройка",
        ],
      },
      {
        id: "web-service-mini-app",
        title: "Веб-сервис / Telegram Mini App",
        price: "от 60 000 ₽",
        description:
          "Для личных кабинетов, каталогов, бронирования, расчётов и внутренних инструментов.",
        included: [
          "Проектирование пользовательских сценариев",
          "Интерфейс, роли и состояния",
          "Работа с данными",
          "Необходимые интеграции",
          "Адаптация под веб или Telegram Mini App",
        ],
        featured: true,
      },
      {
        id: "site-ai-automation",
        title: "Сайт + AI-автоматизация",
        price: "от 120 000 ₽",
        description:
          "Для системы, которая принимает заявки и помогает обрабатывать их без лишней ручной работы.",
        included: [
          "Сайт или веб-сервис",
          "AI-бот для первичной обработки",
          "Интеграции с CRM, Make или n8n",
          "Автоматизация повторяющихся процессов",
          "Передача заявок в работу",
        ],
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
    title: "Три человека. Одна ответственность за результат.",
    description:
      "Работаем небольшой командой, чтобы сохранять контекст, быстро принимать решения и отвечать за продукт целиком.",
    items: [
      {
        id: "fedor",
        name: "Федор",
        role: "Founder & Creative director",
        photo: {
          src: "/images/team/fedor.webp",
          alt: "Федор",
          width: 2316,
          height: 3088,
        },
      },
      {
        id: "arseniy",
        name: "Арсений",
        role: "Backend & Automation Engineer",
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
        role: "Frontend & Product Developer",
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

export type HomeSectionId =
  | "hero"
  | "credibility"
  | "problem"
  | "metrics"
  | "work"
  | "automation"
  | "starter"
  | "pricing"
  | "services"
  | "team"
  | "process"
  | "faq"
  | "benefits"
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

/** Карточка блока «Проблема»: текст слева, иллюстрация справа. */
export type ProblemItem = TextItem & {
  image: ImageAsset;
};

export type StarterIconName =
  | "structure"
  | "copy"
  | "analytics"
  | "automation";

type StarterItem = TextItem & {
  icon: StarterIconName;
};

export type BenefitIconName =
  | "marketing"
  | "legal"
  | "result"
  | "growth";

type BenefitItem = TextItem & {
  icon: BenefitIconName;
};

export type AutomationStep = {
  id: string;
  title: string;
  description: string;
  /** Факт, который делает шаг проверяемым: время, гарантия, поведение при сбое. */
  proof: string;
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
    items: readonly ProblemItem[];
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
  automation: {
    id: "automation";
    eyebrow: string;
    title: string;
    description: string;
    steps: readonly AutomationStep[];
    note: string;
    cta: string;
    ctaHref: string;
    /** Куда ведёт кнопка: ссылка уходит из сайта в Telegram, и это не должно быть сюрпризом. */
    ctaHint: string;
    secondaryCta: string;
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
    eyebrow: string;
    title: string;
    items: readonly TextItem[];
  };
  faq: {
    id: "faq";
    items: readonly FaqItem[];
  };
  benefits: {
    id: "benefits";
    eyebrow: string;
    title: string;
    items: readonly BenefitItem[];
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
  "automation",
  "starter",
  "pricing",
  "services",
  "team",
  "process",
  "faq",
  "benefits",
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
      "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
    description:
      "Digital-продукт приносит результат, когда предложение, сценарий, интерфейс и техническая часть усиливают друг друга.",
    items: [
      {
        id: "unclear-value",
        title: "Ценность не считывается сразу",
        description:
          "Посетитель открывает сайт, но не понимает, что вы предлагаете и почему это важно для него. Ключевое сообщение теряется в визуальном шуме и конкурирующих акцентах.",
        image: {
          src: "/images/problem/unclear-value.webp",
          alt: "Экран сайта, перегруженный блоками одинакового веса: главное сообщение в нём не читается",
          width: 557,
          height: 511,
        },
      },
      {
        id: "broken-path",
        title: "Путь обрывается до действия",
        description:
          "Пользователь понимает предложение и движется по странице, но маршрут к целевому действию слабый, прерывается или обрывается до кнопки или формы.",
        image: {
          src: "/images/problem/broken-path.webp",
          alt: "Тропа пользователя обрывается у края пропасти, не доходя до формы заявки",
          width: 603,
          height: 509,
        },
      },
      {
        id: "disconnected-systems",
        title: "Системы не связаны",
        description:
          "Трафик, формы, CRM, Telegram и аналитика работают отдельно друг от друга. Из-за этого заявки теряются, задерживаются или обрабатываются хаотично.",
        image: {
          src: "/images/problem/disconnected-systems.webp",
          alt: "Сайт, CRM, Telegram и аналитика соединены разорванными связями",
          width: 625,
          height: 569,
        },
      },
      {
        id: "scattered-traffic",
        title: "Трафик рассеивается без результата",
        description:
          "Пользователи приходят на сайт, проявляют интерес, но поток рассеивается на пути: внимание распыляется, смысл теряется, а действие так и не происходит.",
        image: {
          src: "/images/problem/scattered-traffic.webp",
          alt: "Плотный поток посетителей расходится веером и не доходит до целевого действия",
          width: 578,
          height: 503,
        },
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
    title: "Концепты, которые можно посмотреть.",
    description:
      "Девять редизайн-концептов реальных брендов. Каждый собран целиком и открывается в браузере — не мокап в презентации.",
    media: [
      {
        id: "brabus",
        title: "BRABUS",
        src: "/images/work/brabus.jpg",
        alt: "Главная страница редизайн-концепта тюнинг-ателье BRABUS",
        caption: "Тюнинг-ателье суперкаров",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/",
        cta: "Открыть проект",
      },
      {
        id: "oharchitecture",
        title: "OH Architecture",
        src: "/images/work/oharchitecture.jpg",
        alt: "Главная страница редизайн-концепта архитектурного бюро OH Architecture",
        caption: "Архитектурное бюро",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/oharchitecture/",
        cta: "Открыть проект",
      },
      {
        id: "laserandme",
        title: "Laser and Me",
        src: "/images/work/laserandme.jpg",
        alt: "Главная страница редизайн-концепта центра лазерной косметологии Laser and Me",
        caption: "Лазерная косметология",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/laserandme/",
        cta: "Открыть проект",
      },
      {
        id: "newlegend4x4",
        title: "New Legend 4x4",
        src: "/images/work/newlegend4x4.jpg",
        alt: "Главная страница редизайн-концепта мастерской рестомодов New Legend 4x4",
        caption: "Кастомные рестомоды",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/newlegend4x4/",
        cta: "Открыть проект",
      },
      {
        id: "skinlaundry",
        title: "Skin Laundry",
        src: "/images/work/skinlaundry.jpg",
        alt: "Главная страница редизайн-концепта сети клиник Skin Laundry",
        caption: "Сеть клиник лазерного ухода",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/skinlaundry/",
        cta: "Открыть проект",
      },
      {
        id: "lavadental",
        title: "LAVA dental studio",
        src: "/images/work/lavadental.jpg",
        alt: "Главная страница редизайн-концепта стоматологии LAVA dental studio",
        caption: "Стоматология",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/lavadental/",
        cta: "Открыть проект",
      },
      {
        id: "nordiskakok",
        title: "Nordiska Kök",
        src: "/images/work/nordiskakok.jpg",
        alt: "Главная страница редизайн-концепта кухонной мануфактуры Nordiska Kök",
        caption: "Скандинавские кухни",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/nordiskakok/",
        cta: "Открыть проект",
      },
      {
        id: "rodewald",
        title: "Мастерская Rodewald",
        src: "/images/work/rodewald.jpg",
        alt: "Главная страница редизайн-концепта мебельной мастерской Rodewald",
        caption: "Авторская мебель на заказ",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/rodewald/",
        cta: "Открыть проект",
      },
      {
        id: "ultraviolet-way",
        title: "Ultraviolet Way",
        src: "/images/work/ultraviolet-way.jpg",
        alt: "Главная страница редизайн-концепта диджитал-продакшна Efir Media",
        caption: "Диджитал-продакшн",
        width: 1600,
        height: 1000,
        status: "published",
        href: "https://landings-for-message.vercel.app/ultraviolet-way/",
        cta: "Открыть проект",
      },
    ],
  },
  automation: {
    id: "automation",
    eyebrow: "Автоматизация в работе",
    title: "Мы собрали это себе. Так же соберём вам.",
    description:
      "Наш пресейл работает без ручной обработки: клиент отвечает на восемь вопросов в Telegram, разбор задачи готовится за пару секунд, заявка попадает в работу с приоритетом и уходит в сценарии n8n. Ниже — та же система, которую мы ставим клиентам.",
    steps: [
      {
        id: "brief",
        title: "Бриф вместо анкеты",
        description:
          "Восемь вопросов по одному на экран. Ответы сохраняются на каждом шаге, поэтому закрытое приложение не стоит клиенту заполненной формы.",
        proof: "8 вопросов · 2 минуты",
      },
      {
        id: "analysis",
        title: "Разбор задачи",
        description:
          "Языковая модель по нашей методике собирает структуру будущего сайта, гипотезу оффера и вопросы, которых клиент себе не задавал. Если модель недоступна, разбор собирается по правилам — пустого экрана не бывает.",
        proof: "около 2 секунд",
      },
      {
        id: "priority",
        title: "Заявка с приоритетом",
        description:
          "Бюджет и срок вычитываются из ответов, к ним добавляются формат задачи и реакция клиента. В ленте видно, с кем говорить первым и на каком основании.",
        proof: "бюджет · срок · формат",
      },
      {
        id: "delivery",
        title: "Сценарии n8n",
        description:
          "Каждое событие уходит в автоматизацию подписанным запросом: уведомление команде, саммари разбора, напоминание через сутки. Если сценарий недоступен, события копятся и доставляются повторами.",
        proof: "доставка с повторами",
      },
    ],
    note:
      "Это не демонстрационный стенд: студия ведёт через эту систему собственные заявки каждый день.",
    cta: "Пройти бриф в Telegram",
    // Прямая ссылка на мини-апп появится, когда в BotFather будет заведено
    // короткое имя через /newapp. Пока ведём в чат с ботом — эта ссылка
    // работает всегда и не может отдать 404.
    ctaHref: "https://t.me/nyrabusinessbot?start=site_automation",
    ctaHint: "Откроется чат с ботом @nyrabusinessbot — бриф проходится прямо в Telegram.",
    secondaryCta: "Обсудить проект",
  },
  starter: {
    id: "starter",
    title: "Быстрый старт",
    price: "от 30 000 ₽",
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
        price: "от 30 000 ₽",
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
    eyebrow: "Процесс",
    title: "Этапы разработки",
    items: [
      {
        id: "diagnostics",
        title: "Диагностика задачи",
        description:
          "Разбираем продукт, аудиторию, оффер и главную причину, почему сейчас нет заявок.",
      },
      {
        id: "structure",
        title: "Структура и смыслы",
        description:
          "Собираем путь клиента, пишем продающие блоки и фиксируем логику будущего сайта.",
      },
      {
        id: "design-concept",
        title: "Дизайн-концепт",
        description:
          "Показываем первый экран и визуальный язык до полной сборки, чтобы не идти вслепую.",
      },
      {
        id: "development",
        title: "Разработка и интеграции",
        description:
          "Верстаем, подключаем формы, аналитику, CRM и автоматизации, тестируем на устройствах.",
      },
      {
        id: "launch-growth",
        title: "Запуск и рост",
        description:
          "Публикуем сайт, проверяем заявки, передаём инструкцию и помогаем улучшать конверсию.",
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
  benefits: {
    id: "benefits",
    eyebrow: "Почему с нами",
    title: "Почему с нами безопасно и выгодно работать",
    items: [
      {
        id: "marketing",
        icon: "marketing",
        title: "Глубокий маркетинг",
        description:
          "Не просим у вас «ТЗ и тексты». Сами изучаем нишу, вытаскиваем смыслы и пишем продающий копирайтинг.",
      },
      {
        id: "legal",
        icon: "legal",
        title: "Юридическая чистота",
        description:
          "Работаем официально по договору: чеки самозанятого, закрывающие документы и зафиксированные обязательства.",
      },
      {
        id: "result",
        icon: "result",
        title: "Работа до результата",
        description:
          "Правки включены в стоимость. Запускаем проект только тогда, когда он выглядит убедительно.",
      },
      {
        id: "growth",
        icon: "growth",
        title: "Помощь в дальнейшем развитии проекта",
        description:
          "Вы сможете менять цены и тексты в 2 клика. Запишем видеоинструкцию под ваш сайт и поможем развивать проект после запуска.",
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

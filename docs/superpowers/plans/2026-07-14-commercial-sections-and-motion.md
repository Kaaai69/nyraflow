# Commercial Sections and Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить показатели, быстрый старт, три тарифа, более материальные проекты и услуги, а также плавный доступный FAQ, сохранив Spline hero и текущие данные сайта без регрессий.

**Architecture:** Контент новых секций расширяет типизированный объект `homeContent`, а `HomeSections` остаётся единственной точкой композиции страницы после hero. Статические секции остаются React Server Components; интерактивность FAQ изолируется в одном клиентском листе. Общие переходы реализуются текущими CSS-токенами, без GSAP, marquee и нового scroll runtime.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Onest Variable, `@phosphor-icons/react` SSR и CSR entry points, Vitest, Playwright.

## Global Constraints

- Не менять URL `https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode`.
- Не изменять `LockedSplineHero`, карту Spline-объектов, анимации или взаимодействия сцены.
- Не менять порядок, данные, ссылки и изображения десяти опубликованных проектов.
- Не менять состав команды, процесс, контактную форму или подвал.
- Третий тариф стоит `от 120 000 ₽`.
- Калькулятор стоимости отсутствует.
- Новые CTA используют единый текст `Обсудить проект` и ведут к `#contact`.
- Не подключать Aceternity UI, GSAP ScrollTrigger или Magic UI Marquee.
- Все новые движения учитывают `prefers-reduced-motion`.
- Не добавлять `—` или `–` в видимый текст.
- Сохранять текущую светлую тему, Onest Variable, синий и циановый акцент, систему радиусов и focus-visible.
- Использовать только Phosphor для новых иконок, серверные секции импортируют иконки из `@phosphor-icons/react/ssr` согласно [официальной документации](https://github.com/phosphor-icons/react#react-server-components-and-ssr).

## File Map

- Modify: `content/home.ts` - типы, данные и порядок секций.
- Modify: `components/HomeSections.tsx` - композиция секций после hero.
- Create: `components/home/MetricsSection.tsx` - три показателя.
- Create: `components/home/StarterSection.tsx` - быстрый старт и четыре преимущества.
- Create: `components/home/PricingSection.tsx` - три тарифа и CTA.
- Modify: `components/home/WorkSection.tsx` - материальные контейнеры проектов.
- Modify: `components/home/ServicesSection.tsx` - премиальные панели услуг.
- Modify: `components/home/FaqSection.tsx` - серверная граница FAQ.
- Create: `components/home/FaqAccordion.tsx` - доступное плавное раскрытие.
- Modify: `app/globals.css` - новые токены, карточные поверхности и motion rules.
- Modify: `package.json`, `package-lock.json` - Phosphor Icons.
- Modify: `tests/home-content.test.ts` - контракт контента.
- Modify: `tests/home-page.test.ts` - порядок, разметка, CTA и визуальные контракты.
- Modify: `tests/e2e/home.spec.ts` - FAQ, якоря, overflow и неизменность Spline.

---

### Task 1: Расширить типизированный контент и порядок секций

**Files:**
- Modify: `tests/home-content.test.ts`
- Modify: `content/home.ts`
- Test: `tests/home-content.test.ts`

**Interfaces:**
- Consumes: существующие `HomeSectionId`, `HomeContent`, `homeContent`, `homeSectionOrder`.
- Produces: `MetricItem`, `StarterItem`, `PricingItem`, новые поля `metrics`, `starter`, `pricing` и итоговый порядок секций.

- [ ] **Step 1: Расширить тестовый контракт и написать RED-тест данных**

В `HomeModule` добавить точные формы:

```ts
problem: { title: string };
metrics: {
  items: readonly { id: string; value: string; title: string; description: string }[];
};
starter: {
  title: string;
  price: string;
  items: readonly { id: string; title: string; description: string; icon: string }[];
};
pricing: {
  title: string;
  cta: string;
  items: readonly {
    id: string;
    title: string;
    price: string;
    description: string;
    included: readonly string[];
    optional?: readonly string[];
  }[];
};
```

Заменить ожидание порядка и добавить новый тест:

```ts
expect(homeSectionOrder).toEqual([
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
]);

expect(homeContent.problem.title).toBe(
  "Разрабатываем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
);
expect(homeContent.metrics.items.map((item) => item.value)).toEqual([
  "2+",
  "20+",
  "100%",
]);
expect(homeContent.starter.price).toBe("от 20 000 ₽");
expect(homeContent.starter.items).toHaveLength(4);
expect(homeContent.pricing.items.map(({ title, price }) => ({ title, price }))).toEqual([
  { title: "Лендинг", price: "от 20 000 ₽" },
  { title: "Веб-сервис / Telegram Mini App", price: "от 60 000 ₽" },
  { title: "Сайт + AI-автоматизация", price: "от 120 000 ₽" },
]);
expect(homeContent.pricing.cta).toBe("Обсудить проект");
expect(homeContent.pricing.items[0]?.included).toEqual([
  "Маркетинговая упаковка",
  "Адаптация под мобильные устройства",
  "Базовая SEO-настройка",
  "Форма заявки в Telegram",
]);
expect(homeContent.pricing.items[0]?.optional).toEqual([
  "Индивидуальный или анимированный дизайн",
  "Расширенное количество секций",
  "Углублённая SEO-настройка",
]);
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- tests/home-content.test.ts`

Expected: FAIL, потому что `metrics`, `starter`, `pricing` и новый порядок ещё отсутствуют.

- [ ] **Step 3: Добавить типы и точные данные**

В `HomeSectionId` добавить `metrics`, `starter`, `pricing`. Рядом с существующими типами определить:

```ts
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
```

Расширить `HomeContent`:

```ts
metrics: {
  id: "metrics";
  items: readonly MetricItem[];
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
```

Обновить `problem.title` и добавить в `homeContent` точные объекты:

```ts
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
```

Обновить `homeSectionOrder` точным массивом из Step 1.

- [ ] **Step 4: Запустить GREEN и проверку видимого текста**

Run: `npm test -- tests/home-content.test.ts && rg -n '—|–' content/home.ts`

Expected: тест проходит; `rg` не выводит новых запрещённых символов.

- [ ] **Step 5: Commit**

```bash
git add content/home.ts tests/home-content.test.ts
git commit -m "feat: define commercial section content"
```

---

### Task 2: Добавить показатели, быстрый старт и тарифы

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `components/home/MetricsSection.tsx`
- Create: `components/home/StarterSection.tsx`
- Create: `components/home/PricingSection.tsx`
- Modify: `components/HomeSections.tsx`
- Modify: `app/globals.css`
- Modify: `tests/home-page.test.ts`
- Test: `tests/home-page.test.ts`

**Interfaces:**
- Consumes: `homeContent.metrics`, `homeContent.starter`, `homeContent.pricing`, `StarterIconName`, `PricingItem`, `SectionContainer`.
- Produces: три серверные секции с `id="metrics"`, `id="starter"`, `id="pricing"` и три ссылки `href="#contact"`.

- [ ] **Step 1: Написать RED-тест разметки и порядка**

В список `expectedH2` добавить:

```ts
"Быстрый старт",
"Форматы работы и стоимость",
```

В тест порядка заменить `ids`:

```ts
const ids = [
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
];
```

Добавить тест:

```ts
it("renders commercial cards and their contact actions", async () => {
  const markup = await renderPageAfterHero();
  const metrics = markup.slice(
    markup.indexOf('<section id="metrics"'),
    markup.indexOf('<section id="work"'),
  );
  const starter = markup.slice(
    markup.indexOf('<section id="starter"'),
    markup.indexOf('<section id="pricing"'),
  );
  const pricing = markup.slice(
    markup.indexOf('<section id="pricing"'),
    markup.indexOf('<section id="services"'),
  );

  expect(metrics.match(/<article/g)).toHaveLength(3);
  expect(metrics).toContain("2+");
  expect(metrics).toContain("20+");
  expect(metrics).toContain("100%");
  expect(starter.match(/<article/g)).toHaveLength(4);
  expect(starter).toContain("от 20 000 ₽");
  expect(pricing.match(/<article/g)).toHaveLength(3);
  expect(pricing).toContain("от 120 000 ₽");
  expect(pricing.match(/href="#contact"/g)).toHaveLength(3);
  expect(pricing.match(/>Обсудить проект</g)).toHaveLength(3);
  expect(markup).not.toContain("Калькулятор стоимости проекта");
});
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- tests/home-page.test.ts`

Expected: FAIL из-за отсутствующих секций и заголовков.

- [ ] **Step 3: Установить Phosphor Icons**

Run: `npm install @phosphor-icons/react`

Expected: dependency появляется в `package.json`, lockfile обновлён.

- [ ] **Step 4: Создать `MetricsSection`**

```tsx
import { BriefcaseIcon, ChartLineUpIcon, ClipboardTextIcon } from "@phosphor-icons/react/ssr";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

const icons = [ChartLineUpIcon, BriefcaseIcon, ClipboardTextIcon] as const;

export default function MetricsSection() {
  return (
    <section id="metrics" aria-label="Опыт и результаты" className="pb-section-mobile md:pb-section-desktop">
      <SectionContainer>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {homeContent.metrics.items.map((item, index) => {
            const Icon = icons[index];
            return (
              <article key={item.id} className="commercial-card p-7 md:p-9">
                {Icon ? <Icon aria-hidden size={34} weight="regular" className="text-cyan" /> : null}
                <p className="mt-10 text-5xl font-semibold tracking-[-0.045em] md:text-6xl">{item.value}</p>
                <h2 className="mt-6 text-xl font-semibold leading-tight">{item.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-text-secondary">{item.description}</p>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
```

- [ ] **Step 5: Создать `StarterSection`**

Использовать точные SSR imports и карту:

```tsx
import {
  BrowserIcon,
  PulseIcon,
  RobotIcon,
  TextAlignLeftIcon,
} from "@phosphor-icons/react/ssr";

import {
  homeContent,
  type StarterIconName,
} from "../../content/home";
import { SectionContainer } from "./Layout";

const starterIcons = {
  structure: BrowserIcon,
  copy: TextAlignLeftIcon,
  analytics: PulseIcon,
  automation: RobotIcon,
} satisfies Record<StarterIconName, typeof BrowserIcon>;
```

```tsx
export default function StarterSection() {
  const content = homeContent.starter;
  return (
    <section id="starter" className="py-section-mobile md:py-section-desktop">
      <SectionContainer>
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan">{content.title}</h2>
          <p className="mt-3 text-title-compact">{content.price}</p>
        </header>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {content.items.map((item) => {
            const Icon = starterIcons[item.icon];
            return (
              <article key={item.id} className="commercial-card p-7 md:p-8">
                <Icon aria-hidden size={32} weight="regular" className="text-cyan" />
                <h3 className="mt-10 text-xl font-semibold leading-tight">{item.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-text-secondary">{item.description}</p>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
```

- [ ] **Step 6: Создать `PricingSection`**

```tsx
import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function PricingSection() {
  const content = homeContent.pricing;
  return (
    <section id="pricing" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />
        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3 md:mt-20">
          {content.items.map((item) => (
            <article
              key={item.id}
              className={`pricing-card grid min-w-0 grid-rows-[auto_auto_auto_1fr_auto] p-7 md:p-8 ${item.featured ? "pricing-card-featured" : ""}`}
            >
              <h3 className="text-2xl font-semibold tracking-[-0.025em]">{item.title}</h3>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-blue-deep">{item.price}</p>
              <p className="mt-5 leading-relaxed text-text-secondary">{item.description}</p>
              <div className="mt-9 space-y-3">
                {item.included.map((line) => (
                  <p key={line} className="flex gap-3 leading-relaxed text-text-secondary">
                    <CheckIcon aria-hidden size={19} weight="bold" className="mt-1 shrink-0 text-cyan" />
                    <span>{line}</span>
                  </p>
                ))}
                {item.optional?.length ? (
                  <div className="mt-7 rounded-card bg-surface-blue p-5">
                    <p className="font-semibold text-text-primary">Опционально</p>
                    {item.optional.map((line) => <p key={line} className="mt-2 text-sm leading-relaxed text-text-secondary">{line}</p>)}
                  </div>
                ) : null}
              </div>
              <a href="#contact" className="button-primary mt-9 inline-flex justify-center">{content.cta}</a>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
```

- [ ] **Step 7: Добавить секции в `HomeSections`**

Импортировать новые компоненты и установить точный порядок:

```tsx
<CredibilitySection />
<ProblemSection />
<MetricsSection />
<WorkSection />
<StarterSection />
<PricingSection />
<ServicesSection />
<TeamSection />
<ProcessSection />
<FaqSection />
<ContactSection />
```

- [ ] **Step 8: Добавить общие поверхности в `globals.css`**

В `@theme` добавить:

```css
--color-line-strong: #c9d4e4;
--shadow-card-strong: 0 24px 70px rgb(36 87 255 / 0.11);
```

В `@layer components` добавить:

```css
.commercial-card,
.pricing-card {
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-card);
  background: linear-gradient(145deg, var(--color-surface), var(--color-surface-blue));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.72), var(--shadow-card);
}

.pricing-card {
  background: var(--color-surface);
}

.pricing-card-featured {
  border-color: color-mix(in srgb, var(--color-cyan) 56%, var(--color-line));
  background: linear-gradient(160deg, var(--color-surface-blue), var(--color-surface));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.82), var(--shadow-card-strong);
}
```

- [ ] **Step 9: Запустить GREEN**

Run: `npm test -- tests/home-page.test.ts tests/home-content.test.ts && npm run typecheck`

Expected: оба файла тестов и TypeScript проходят.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json components/HomeSections.tsx components/home/MetricsSection.tsx components/home/StarterSection.tsx components/home/PricingSection.tsx app/globals.css tests/home-page.test.ts
git commit -m "feat: add commercial offer sections"
```

---

### Task 3: Отделить проекты от фона премиальными контейнерами

**Files:**
- Modify: `tests/home-page.test.ts`
- Modify: `components/home/WorkSection.tsx`
- Modify: `app/globals.css`
- Test: `tests/home-page.test.ts`

**Interfaces:**
- Consumes: неизменный `WorkMedia`, `homeContent.work.media` и `project.href`.
- Produces: десять `.project-card`, десять `.project-card-image` и прежние безопасные внешние ссылки.

- [ ] **Step 1: Написать RED-тест карточек**

В существующий тест портфолио добавить:

```ts
expect(workMarkup.match(/class="[^"]*project-card[^"]*"/g)).toHaveLength(10);
expect(workMarkup.match(/class="[^"]*project-card-image[^"]*"/g)).toHaveLength(10);

const styles = readProjectFile("app/globals.css");
expect(styles).toMatch(/\.project-card\s*{/);
expect(styles).toMatch(/\.project-card:hover\s*{/);
expect(styles).toMatch(/\.project-card:hover \.project-card-image\s*{/);
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- tests/home-page.test.ts`

Expected: FAIL, потому что semantic classes отсутствуют.

- [ ] **Step 3: Обновить `ProjectCard` без изменения данных**

Основная ссылка получает:

```tsx
className={`project-card block overflow-hidden rounded-media border border-line-strong bg-surface p-3 shadow-card md:p-4 ${className ?? ""}`}
```

Контейнер изображения сохраняет `aspect-[8/5]`, а `Image` получает:

```tsx
className="project-card-image h-full w-full object-cover"
```

`figcaption` размещается внутри поверхности с `px-2 pb-2` и текущими реальными данными. Не добавлять overlay, badge или новый текст поверх изображения.

- [ ] **Step 4: Добавить pointer-qualified motion**

В существующий `@media (hover: hover) and (pointer: fine)` добавить:

```css
.project-card:hover {
  border-color: color-mix(in srgb, var(--color-blue) 30%, var(--color-line));
  box-shadow: var(--shadow-card-strong);
  transform: translateY(-4px);
}

.project-card:hover .project-card-image {
  transform: scale(1.015);
}
```

Базовые transitions:

```css
.project-card {
  transition: transform var(--duration-slow) var(--ease-premium),
    border-color var(--duration-slow) var(--ease-premium),
    box-shadow var(--duration-slow) var(--ease-premium);
}

.project-card-image {
  transition: transform var(--duration-slow) var(--ease-premium);
}

.project-card:active {
  transform: scale(0.995);
}
```

- [ ] **Step 5: Запустить GREEN и регрессию ссылок**

Run: `npm test -- tests/home-page.test.ts tests/home-content.test.ts`

Expected: 10 карточек, 10 secure links и исходный порядок проектов проходят.

- [ ] **Step 6: Commit**

```bash
git add components/home/WorkSection.tsx app/globals.css tests/home-page.test.ts
git commit -m "style: give project cards premium separation"
```

---

### Task 4: Сделать услуги материальными панелями

**Files:**
- Modify: `tests/home-page.test.ts`
- Modify: `components/home/ServicesSection.tsx`
- Modify: `app/globals.css`
- Test: `tests/home-page.test.ts`

**Interfaces:**
- Consumes: текущие три `homeContent.services.items` и labels `Когда нужны`, `Что делаем`, `Что получает бизнес`.
- Produces: три `.service-panel` с неизменным содержанием и одна прежняя CTA к `#contact`.

- [ ] **Step 1: Написать RED-тест структуры**

```ts
it("renders three visually separated service panels without changing service copy", async () => {
  const markup = await renderPageAfterHero();
  const services = markup.slice(
    markup.indexOf('<section id="services"'),
    markup.indexOf('<section id="team"'),
  );

  expect(services.match(/class="[^"]*service-panel[^"]*"/g)).toHaveLength(3);
  expect(services.match(/>Когда нужны</g)).toHaveLength(3);
  expect(services.match(/>Что делаем</g)).toHaveLength(3);
  expect(services.match(/>Что получает бизнес</g)).toHaveLength(3);
  expect(services).toContain('href="#contact"');
});
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- tests/home-page.test.ts`

Expected: FAIL из-за отсутствующих `.service-panel`.

- [ ] **Step 3: Заменить строковую таблицу панелями**

Убрать общий `border-t` контейнера. Каждая статья получает:

```tsx
className="service-panel grid gap-8 rounded-media border border-line-strong bg-surface p-7 shadow-card md:p-9 lg:grid-cols-12 lg:gap-6"
```

Контейнер списка использует `mt-14 grid gap-5 md:mt-20`. Три смысловые колонки сохраняются. Для `businessOutcome` добавить `service-outcome` с `rounded-card bg-surface-blue p-5`, остальные колонки получают `p-5` без дополнительной карточной рамки.

- [ ] **Step 4: Добавить ограниченный hover**

```css
.service-panel {
  transition: transform var(--duration-slow) var(--ease-premium),
    border-color var(--duration-slow) var(--ease-premium),
    box-shadow var(--duration-slow) var(--ease-premium);
}

@media (hover: hover) and (pointer: fine) {
  .service-panel:hover {
    border-color: color-mix(in srgb, var(--color-blue) 24%, var(--color-line));
    box-shadow: var(--shadow-card-strong);
    transform: translateY(-2px);
  }
}
```

Существующий `.service-title` translate можно сохранить внутри панели.

- [ ] **Step 5: Запустить GREEN**

Run: `npm test -- tests/home-page.test.ts && npm run typecheck`

Expected: три услуги, тексты и CTA проходят.

- [ ] **Step 6: Commit**

```bash
git add components/home/ServicesSection.tsx app/globals.css tests/home-page.test.ts
git commit -m "style: strengthen service section hierarchy"
```

---

### Task 5: Реализовать доступный плавный FAQ

**Files:**
- Create: `components/home/FaqAccordion.tsx`
- Modify: `components/home/FaqSection.tsx`
- Modify: `app/globals.css`
- Modify: `tests/home-page.test.ts`
- Modify: `tests/e2e/home.spec.ts`
- Test: `tests/home-page.test.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `homeContent.faq.items` с `{ id, question, answer }`.
- Produces: `FaqAccordion({ items })`, кнопки `faq-trigger-*`, панели `faq-panel-*`, независимое раскрытие нескольких вопросов.

- [ ] **Step 1: Написать RED-тест доступной серверной разметки**

Заменить тест native details на:

```ts
it("renders accessible FAQ accordion controls", async () => {
  const markup = await renderPageAfterHero();

  expect(markup.match(/class="[^"]*faq-trigger[^"]*"/g)).toHaveLength(6);
  expect(markup.match(/aria-expanded="false"/g)).toHaveLength(6);
  expect(markup.match(/aria-controls="faq-panel-/g)).toHaveLength(6);
  expect(markup.match(/role="region"/g)).toHaveLength(6);
  expect(markup).toContain("С чего начать, если у нас нет подробного ТЗ?");
  expect(markup).toContain("Что происходит после запуска?");
});
```

- [ ] **Step 2: Добавить RED E2E для раскрытия**

```ts
test("FAQ opens smoothly and remains keyboard accessible", async ({ page }) => {
  await page.goto("/#faq", { waitUntil: "load" });
  const trigger = page.getByRole("button", {
    name: "С чего начать, если у нас нет подробного ТЗ?",
  });
  const panel = page.locator("#faq-panel-no-specification");

  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Достаточно описать задачу");
  await expect(panel).toHaveCSS("grid-template-rows", /.+/);
});
```

- [ ] **Step 3: Запустить RED**

Run: `npm test -- tests/home-page.test.ts && npm run test:e2e -- tests/e2e/home.spec.ts --grep "FAQ opens"`

Expected: unit FAIL из-за отсутствующих кнопок; E2E не находит button.

- [ ] **Step 4: Создать `FaqAccordion`**

```tsx
"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";

type FaqItem = Readonly<{ id: string; question: string; answer: string }>;

export default function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openItems, setOpenItems] = useState<ReadonlySet<string>>(() => new Set());

  function toggle(id: string) {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-x-16 lg:grid-cols-2">
      {[items.slice(0, 3), items.slice(3)].map((column, columnIndex) => (
        <div key={columnIndex} className="border-t border-line">
          {column.map((item) => {
            const isOpen = openItems.has(item.id);
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;
            return (
              <div key={item.id} className="border-b border-line">
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="faq-trigger flex w-full items-start justify-between gap-5 py-7 text-left text-lg font-semibold leading-snug md:text-xl"
                  onClick={() => toggle(item.id)}
                >
                  <span>{item.question}</span>
                  <CaretDownIcon aria-hidden size={22} weight="bold" className="faq-indicator mt-1 shrink-0 text-blue" />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`faq-panel grid ${isOpen ? "is-open" : ""}`}
                >
                  <div className="faq-panel-inner overflow-hidden">
                    <p className="max-w-[65ch] pb-7 pr-8 text-base leading-relaxed text-text-secondary">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Подключить client leaf в `FaqSection`**

`FaqSection` остаётся серверным:

```tsx
import { homeContent } from "../../content/home";
import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <FaqAccordion items={homeContent.faq.items} />
      </SectionContainer>
    </section>
  );
}
```

- [ ] **Step 6: Добавить CSS-переходы FAQ**

```css
.faq-trigger {
  transition: color var(--duration-base) var(--ease-premium);
}

.faq-indicator {
  transition: transform var(--duration-base) var(--ease-premium);
}

.faq-trigger[aria-expanded="true"] .faq-indicator {
  transform: rotate(180deg);
}

.faq-panel {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-0.25rem);
  transition: grid-template-rows var(--duration-slow) var(--ease-premium),
    opacity var(--duration-base) var(--ease-premium),
    transform var(--duration-base) var(--ease-premium);
}

.faq-panel.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 7: Запустить GREEN**

Run: `npm test -- tests/home-page.test.ts && npm run test:e2e -- tests/e2e/home.spec.ts --grep "FAQ opens"`

Expected: unit и FAQ E2E проходят, Enter меняет `aria-expanded` на `true`.

- [ ] **Step 8: Commit**

```bash
git add components/home/FaqAccordion.tsx components/home/FaqSection.tsx app/globals.css tests/home-page.test.ts tests/e2e/home.spec.ts
git commit -m "feat: add accessible animated FAQ"
```

---

### Task 6: Унифицировать плавные переходы и reduced motion

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/home-page.test.ts`
- Modify: `tests/e2e/home.spec.ts`
- Test: `tests/home-page.test.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: текущие duration/easing tokens, `.button-primary`, project cards, service panels, FAQ.
- Produces: плавные якоря для обычных ссылок и полное отключение необязательного движения при reduced motion.

- [ ] **Step 1: Написать RED unit-контракт CSS**

```ts
it("defines smooth anchors and a reduced-motion fallback", () => {
  const styles = readProjectFile("app/globals.css");

  expect(styles).toMatch(/html\s*{[^}]*scroll-behavior:\s*smooth/);
  expect(styles).toMatch(/:where\(\s*a,\s*button,\s*summary\s*\)[^{]*{[^}]*transition:/s);
  expect(styles).toMatch(
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*html\s*{[^}]*scroll-behavior:\s*auto/,
  );
});
```

- [ ] **Step 2: Добавить RED E2E обычного якоря**

```ts
test("ordinary contact actions preserve the contact anchor", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.locator('#pricing a[href="#contact"]').first().click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});
```

- [ ] **Step 3: Запустить RED**

Run: `npm test -- tests/home-page.test.ts`

Expected: FAIL, `scroll-behavior` и общий transition отсутствуют.

- [ ] **Step 4: Добавить общий motion contract**

```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 1.5rem;
}

:where(a, button, summary) {
  transition: color var(--duration-base) var(--ease-premium),
    background-color var(--duration-base) var(--ease-premium),
    border-color var(--duration-base) var(--ease-premium),
    box-shadow var(--duration-base) var(--ease-premium),
    opacity var(--duration-base) var(--ease-premium),
    transform var(--duration-base) var(--ease-premium);
}
```

Текущие более специфичные transitions сохраняются. В reduced motion блок добавить:

```css
html {
  scroll-behavior: auto;
}

*,
*::before,
*::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  scroll-behavior: auto !important;
  transition-duration: 0.01ms !important;
}
```

- [ ] **Step 5: Запустить GREEN и Spline-регрессию**

Run: `npm test -- tests/home-page.test.ts tests/spline-navigation.test.ts && npm run test:e2e -- tests/e2e/home.spec.ts --grep "ordinary contact|routes every visible layer"`

Expected: обычный CTA ведёт к contact; все девять Spline hit layers по-прежнему проходят.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tests/home-page.test.ts tests/e2e/home.spec.ts
git commit -m "style: unify smooth site interactions"
```

---

### Task 7: Полная регрессия, visual QA и production-деплой

**Files:**
- Modify only if verification reveals an in-scope defect.
- Test: all files under `tests/`.

**Interfaces:**
- Consumes: завершённые Tasks 1-6.
- Produces: проверенная desktop/mobile production-страница на существующем Vercel alias.

- [ ] **Step 1: Провести механический preflight**

Run:

```bash
git diff --check
rg -n '—|–' app components content
rg -n 'TODO|TBD|PLACEHOLDER' app components content
```

Expected: `git diff --check` exit 0; новые видимые строки не содержат запрещённых dash characters или placeholders. Существующий технический текст проверяется отдельно, изменения вне scope не делаются без необходимости.

- [ ] **Step 2: Запустить полный набор проверок**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Expected: все Vitest files, TypeScript, Next production build и полный Playwright suite проходят без ошибок.

- [ ] **Step 3: Проверить desktop 1440 × 900**

Запустить `npm run dev`, открыть `/` и проверить:

- точный порядок секций;
- три metrics cards;
- десять project cards с заметной границей;
- starter и три pricing cards;
- цена `от 120 000 ₽`;
- три CTA в одну строку внутри карточек;
- премиальные service panels;
- плавное раскрытие FAQ;
- отсутствие severe console errors.

- [ ] **Step 4: Проверить 1280 × 720 Spline**

Повторить все девять pointer-проверок существующего hero E2E: верхнее меню, фон, текст и стрелка обеих CTA. Сравнить scene URL и убедиться, что canvas остаётся прямым ребёнком locked component.

- [ ] **Step 5: Проверить mobile 390 × 844**

Проверить:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`;
- metrics, starter, pricing, services и work складываются в одну колонку;
- тарифные CTA не переносят текст;
- FAQ раскрывается и закрывается с touch;
- видимые Spline controls сохраняют переходы;
- изображения не растягиваются и не вызывают CLS.

- [ ] **Step 6: Проверить reduced motion**

Эмулировать `prefers-reduced-motion: reduce`. Убедиться, что якоря переходят мгновенно, FAQ остаётся функциональным, а Spline navigation tests проходят.

- [ ] **Step 7: Запустить Lighthouse smoke**

Проверить production build на mobile profile. Зафиксировать отсутствие новых accessibility errors, CLS ниже `0.1` и отсутствие очевидной регрессии LCP из-за статических секций. Spline остаётся главным весом страницы и не расширяется этой задачей.

- [ ] **Step 8: Исправить только подтверждённые in-scope дефекты и повторить полный прогон**

Если исправления потребовались, повторить Step 2 целиком и сделать отдельный commit:

```bash
git add app/globals.css content/home.ts components/HomeSections.tsx components/home/MetricsSection.tsx components/home/StarterSection.tsx components/home/PricingSection.tsx components/home/WorkSection.tsx components/home/ServicesSection.tsx components/home/FaqSection.tsx components/home/FaqAccordion.tsx tests/home-content.test.ts tests/home-page.test.ts tests/e2e/home.spec.ts package.json package-lock.json
git commit -m "fix: resolve commercial page QA findings"
```

- [ ] **Step 9: Задеплоить production**

Run: `npx vercel deploy --prod --yes`

Expected: deployment `READY`, alias `https://myland-sooty.vercel.app` обновлён.

- [ ] **Step 10: Выполнить production smoke**

На публичном alias подтвердить HTTP 200, цену третьего тарифа, три CTA, FAQ, отсутствие overflow и все существующие Spline-переходы.

---

## Completion Criteria

- Новые секции стоят в утверждённом порядке.
- Цена третьего тарифа равна `от 120 000 ₽`.
- Калькулятора нет.
- Проекты и услуги ясно отделены от фона.
- FAQ и обычные якоря двигаются плавно и доступны с клавиатуры.
- Reduced motion работает.
- Десять проектов, команда, контакт и Spline не изменены по содержанию и поведению.
- Полный test, typecheck, build и E2E проходят.
- Production alias отвечает 200 и повторяет локально проверенное поведение.

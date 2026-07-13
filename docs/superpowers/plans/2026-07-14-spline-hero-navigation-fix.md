# Spline Hero Navigation Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать фон, текст и стрелки обеих CTA, а также три пункта верхнего меню Spline hero кликабельными и направить их к подтверждённым целям.

**Architecture:** Исходная Spline-сцена и прямой `Spline`-компонент остаются неизменными. Изолированный адаптер навигации сопоставляет точные имена существующих Spline-объектов с целями `home`, `team`, `work`, `contact`; сначала читает штатный hover snapshot, а для верхнего меню без hover-событий выполняет raycast по нативному pointer-событию. Компонент hero только передаёт найденную цель в функцию навигации.

**Tech Stack:** Next.js 16, React, TypeScript, `@splinetool/react-spline`, Vitest, Playwright.

## Global Constraints

- Не менять URL `https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode`.
- Не добавлять HTML-overlay, wrapper, стили или изображения поверх canvas.
- Не менять Spline-анимации, hover-состояния и внутренние события.
- Сохранить `prefers-reduced-motion`.
- Не менять секции ниже hero.
- Любая ошибка приватного runtime raycast должна безопасно вернуть `null`, не ломая страницу.
- Реализовать через RED, GREEN и полный регрессионный прогон.

---

### Task 1: Зафиксировать правильную карту объектов тестами

**Files:**
- Modify: `tests/spline-navigation.test.ts`
- Test: `tests/spline-navigation.test.ts`

**Interfaces:**
- Consumes: текущие `resolveSplineTarget`, `getCurrentSplineTarget`, `scrollToSection`.
- Produces: тестовый контракт для `HeroNavigationTarget` и `navigateToHeroTarget`.

- [ ] **Step 1: Заменить ожидания карты на подтверждённые цели**

Добавить табличный контракт:

```ts
const expectedTargets = [
  ["Text 5", "home"],
  ["Text 6", "team"],
  ["Text 7", "contact"],
  ["Rectangle 2", "contact"],
  ["Text 4", "contact"],
  ["get", "contact"],
  ["Rectangle 3", "work"],
  ["Rectangle 4", "work"],
  ["Text 3", "work"],
  ["dis", "work"],
] as const;

for (const [name, target] of expectedTargets) {
  expect(resolveSplineTarget(name)).toBe(target);
}
```

Сохранить проверки неизвестных имён и добавить `Text 8`, `rectangle 3`, `DIS` как отрицательные примеры.

- [ ] **Step 2: Добавить RED-контракт перехода на начало страницы**

Тест должен импортировать `navigateToHeroTarget`, подставить `window.scrollTo`, `window.location.pathname`, `window.location.search` и проверить:

```ts
expect(navigateToHeroTarget("home")).toBe(true);
expect(scrollTo).toHaveBeenCalledWith({
  top: 0,
  behavior: "smooth",
});
expect(replaceState).toHaveBeenCalledWith(null, "", "/?source=hero");
```

Существующие проверки секций перенести с `scrollToSection` на `navigateToHeroTarget`.

- [ ] **Step 3: Запустить RED**

Run: `npm test -- tests/spline-navigation.test.ts`

Expected: FAIL, потому что `home` и новые точные соответствия ещё не реализованы, а `Text 3` по-прежнему возвращает `contact`.

---

### Task 2: Реализовать точную маршрутизацию

**Files:**
- Modify: `lib/spline-navigation.ts`
- Modify: `components/LockedSplineHero.tsx`
- Test: `tests/spline-navigation.test.ts`

**Interfaces:**
- Consumes: имена объектов из Task 1.
- Produces: `HeroNavigationTarget`, `resolveSplineTarget(name)`, `getCurrentSplineTarget(application)`, `navigateToHeroTarget(target)`.

- [ ] **Step 1: Расширить тип и карту**

```ts
export type HeroNavigationTarget = "home" | "team" | "work" | "contact";

const splineTargets: ReadonlyMap<string, HeroNavigationTarget> = new Map([
  ["Text 5", "home"],
  ["Text 6", "team"],
  ["Text 7", "contact"],
  ["Rectangle 2", "contact"],
  ["Text 4", "contact"],
  ["get", "contact"],
  ["Rectangle 3", "work"],
  ["Rectangle 4", "work"],
  ["Text 3", "work"],
  ["dis", "work"],
]);
```

- [ ] **Step 2: Реализовать единую функцию перехода**

```ts
export function navigateToHeroTarget(target: HeroNavigationTarget) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const behavior = reduceMotion ? "auto" : "smooth";

  if (target === "home") {
    window.scrollTo({ top: 0, behavior });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    return true;
  }

  const section = document.getElementById(target);
  if (!section) return false;

  section.scrollIntoView({ behavior, block: "start" });
  window.history.replaceState(null, "", `#${target}`);
  return true;
}
```

- [ ] **Step 3: Подключить функцию в locked hero**

`LockedSplineHero` сохраняет прямой `<Spline>` и исходный URL. В `handlePointerUp` передать нативное pointer-событие, чтобы адаптер мог выполнить raycast для объектов верхнего меню без hover-событий:

```ts
const target = getCurrentSplineTarget(appRef.current, event.nativeEvent);
const destination = target ? resolveSplineTarget(target) : null;

if (destination) navigateToHeroTarget(destination);
```

- [ ] **Step 4: Запустить GREEN**

Run: `npm test -- tests/spline-navigation.test.ts`

Expected: все тесты файла проходят.

- [ ] **Step 5: Зафиксировать реализацию**

```bash
git add lib/spline-navigation.ts components/LockedSplineHero.tsx tests/spline-navigation.test.ts
git commit -m "fix: route all Spline hero controls"
```

---

### Task 3: Добавить browser-регрессию и проверить production

**Files:**
- Modify: `tests/e2e/home.spec.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: реальные Spline hit-targets и подтверждённые hash-цели.
- Produces: автоматическая регрессия для центральных текстовых слоёв и ручной smoke всех слоёв.

- [ ] **Step 1: Добавить E2E для пяти пользовательских переходов**

На viewport `1440x900` дождаться загруженного canvas. Для каждой проверки открывать `/`, наводить курсор на подтверждённую координату, кликать и проверять hash:

```ts
const controls = [
  { point: { x: 603, y: 30 }, hash: "" },
  { point: { x: 699, y: 30 }, hash: "#team" },
  { point: { x: 815, y: 30 }, hash: "#contact" },
  { point: { x: 205, y: 550 }, hash: "#contact" },
  { point: { x: 484, y: 550 }, hash: "#work" },
] as const;
```

Для «Главная» заранее установить `#contact` через `history.replaceState`, затем проверить пустой hash и `scrollY === 0`. После каждого `goto("/")` ждать фактический canvas и отсутствие severe browser errors.

- [ ] **Step 2: Запустить E2E и скорректировать только подтверждённые координаты при необходимости**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`

Expected: три существующих сценария, включая новый hero navigation, проходят. Если конкретная координата не попадает в объект, снять новый screenshot на том же viewport и заменить её фактическим центром, не меняя production-код.

- [ ] **Step 3: Выполнить полный регрессионный прогон**

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Expected: unit, TypeScript, production build и весь Playwright suite проходят без ошибок приложения.

- [ ] **Step 4: Провести live smoke до деплоя**

На desktop проверить фон, текст и стрелку каждой CTA отдельно, затем «Главная», «О нас», «Контакты». На mobile проверить видимые контролы и отсутствие горизонтального overflow. Подтвердить неизменность hero screenshot и анимации кубов.

- [ ] **Step 5: Зафиксировать browser-регрессию**

```bash
git add tests/e2e/home.spec.ts
git commit -m "test: cover Spline hero navigation"
```

- [ ] **Step 6: Задеплоить и повторить production smoke**

```bash
npx vercel deploy --prod --yes
```

После READY проверить публичный alias: HTTP 200, пять переходов, CTA по фону/тексту/стрелке, отсутствие console errors и horizontal overflow.

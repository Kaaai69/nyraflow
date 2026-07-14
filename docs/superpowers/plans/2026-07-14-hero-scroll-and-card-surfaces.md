# Hero Scroll and Card Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать wheel/trackpad-прокрутку над Spline hero предсказуемой, обновить problem-heading и привести metrics/starter-карточки к тёплой поверхности credibility-карточек.

**Architecture:** Locked Spline component остаётся неизменным. Прокрутка исправляется во внешнем `SplineWheelBridge`: wheel над canvas перехватывается на capture-фазе и переводится в агрегированный `window.scrollBy`, а события вне canvas не меняются. Текст хранится в `content/home.ts`, поверхность карточек задаётся одним CSS-контрактом `.commercial-card`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Vitest, Playwright.

## Global Constraints

- Не менять `components/LockedSplineHero.tsx`, scene URL, Spline canvas или карту девяти hit-зон.
- Не добавлять overlay-слои, зависимости и advanced scroll animation.
- Заголовок должен быть точным: `Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.`
- Metrics и starter используют `surface`, `line` и `shadow-card`, как credibility-карточки.
- Pricing cards, сетки, типографика, иконки и внутренние accent colors не меняются.

---

### Task 1: Надёжная wheel/trackpad-прокрутка над hero

**Files:**
- Modify: `components/SplineWheelBridge.tsx`
- Modify: `tests/spline-wheel-bridge.test.ts`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number): number`.
- Produces: capture wheel listener, который предотвращает default только для Spline canvas и передаёт агрегированный delta в `window.scrollBy`.

- [ ] **Step 1: Написать RED unit-контракт bridge**

В `tests/spline-wheel-bridge.test.ts` заменить ожидание passive listener на точный контракт:

```ts
expect(bridge).toContain("passive: false");
expect(bridge).toContain("event.preventDefault()");
expect(bridge).not.toContain("scrollYBeforeWheel");
expect(bridge).toContain("pendingDelta += normalizeWheelDelta");
expect(bridge).toContain('window.scrollBy({ top: delta, left: 0, behavior: "auto" })');
```

- [ ] **Step 2: Добавить RED browser-регрессию реального canvas**

Перед synthetic-canvas частью первого теста `tests/e2e/home.spec.ts` добавить:

```ts
const realCanvas = page.locator("main > div > canvas");
const realCanvasBox = await realCanvas.boundingBox();
if (!realCanvasBox) throw new Error("Spline canvas box is missing");

await page.evaluate(() => window.scrollTo(0, 0));
await page.mouse.move(
  realCanvasBox.x + realCanvasBox.width / 2,
  realCanvasBox.y + Math.min(realCanvasBox.height / 2, 700),
);
await page.mouse.wheel(0, 700);
await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
```

- [ ] **Step 3: Запустить RED**

Run: `npm test -- tests/spline-wheel-bridge.test.ts`

Expected: FAIL, потому что listener всё ещё `passive: true`, `preventDefault()` отсутствует, а bridge содержит `scrollYBeforeWheel`.

- [ ] **Step 4: Реализовать минимальный bridge**

В `components/SplineWheelBridge.tsx` сохранить canvas/path/viewport guards и заменить conditional fallback на гарантированную передачу delta:

```ts
const handleWheel = (event: WheelEvent) => {
  const splineCanvas = document.querySelector("main canvas");

  if (
    !(splineCanvas instanceof HTMLCanvasElement) ||
    !event.composedPath().includes(splineCanvas)
  ) {
    return;
  }

  const canvasRect = splineCanvas.getBoundingClientRect();
  const canvasIntersectsViewport =
    canvasRect.bottom > 0 &&
    canvasRect.top < window.innerHeight &&
    canvasRect.right > 0 &&
    canvasRect.left < window.innerWidth;

  if (!canvasIntersectsViewport) return;

  event.preventDefault();
  pendingDelta += normalizeWheelDelta(
    event.deltaY,
    event.deltaMode,
    window.innerHeight,
  );

  if (animationFrame !== null) return;

  animationFrame = window.requestAnimationFrame(() => {
    animationFrame = null;
    const delta = pendingDelta;
    pendingDelta = 0;
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
  });
};

const listenerOptions: AddEventListenerOptions = {
  capture: true,
  passive: false,
};
```

- [ ] **Step 5: Запустить GREEN и Spline-регрессию**

Run: `npm test -- tests/spline-wheel-bridge.test.ts tests/spline-navigation.test.ts`

Expected: PASS.

Run: `npm run test:e2e -- tests/e2e/home.spec.ts --grep "wheel bridge|routes every visible layer"`

Expected: wheel над реальным и synthetic canvas прокручивает документ; все девять Spline hit-зон проходят.

- [ ] **Step 6: Commit**

```bash
git add components/SplineWheelBridge.tsx tests/spline-wheel-bridge.test.ts tests/e2e/home.spec.ts
git commit -m "fix: stabilize scrolling over Spline hero"
```

---

### Task 2: Новый heading и тёплые card surfaces

**Files:**
- Modify: `content/home.ts`
- Modify: `app/globals.css`
- Modify: `tests/home-content.test.ts`
- Modify: `tests/home-page.test.ts`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `homeContent.problem.heading`, `.commercial-card`, design tokens `--color-surface`, `--color-line`, `--shadow-card`.
- Produces: точный новый problem-heading и единый credibility-like surface для metrics/starter.

- [ ] **Step 1: Написать RED copy-контракт**

Заменить старую строку в `tests/home-content.test.ts`, `tests/home-page.test.ts` и массиве `approvedHeadings` в `tests/e2e/home.spec.ts`:

```ts
"Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете."
```

- [ ] **Step 2: Написать RED surface-контракт**

В `tests/home-page.test.ts` добавить:

```ts
it("uses the credibility surface for metrics and starter cards", () => {
  const styles = readProjectFile("app/globals.css");
  const commercialCardRule = styles.match(/\.commercial-card\s*{[^}]*}/)?.[0] ?? "";

  expect(commercialCardRule).toContain("border: 1px solid var(--color-line);");
  expect(commercialCardRule).toContain("background: var(--color-surface);");
  expect(commercialCardRule).toContain("box-shadow: var(--shadow-card);");
  expect(commercialCardRule).not.toContain("linear-gradient");
  expect(commercialCardRule).not.toContain("inset");
});
```

- [ ] **Step 3: Запустить RED**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: FAIL на старом heading и gradient `.commercial-card`.

- [ ] **Step 4: Обновить контент**

В `content/home.ts` заменить только `problem.heading`:

```ts
heading:
  "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
```

- [ ] **Step 5: Разделить surface-контракты**

В `app/globals.css` заменить общий gradient block на два явных правила:

```css
.commercial-card {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.pricing-card {
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.72), var(--shadow-card);
}
```

`pricing-card-featured` оставить без изменений.

- [ ] **Step 6: Запустить GREEN**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content/home.ts app/globals.css tests/home-content.test.ts tests/home-page.test.ts tests/e2e/home.spec.ts
git commit -m "style: align commercial cards with credibility surfaces"
```

---

### Task 3: Полный QA и production deploy

**Files:**
- Verify: all tracked files.
- Modify only if a confirmed in-scope defect is reproduced.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: проверенный production alias `https://myland-sooty.vercel.app`.

- [ ] **Step 1: Механический preflight**

Run:

```bash
git diff --check
rg -n 'TODO|TBD|PLACEHOLDER|—|–' app components content tests
```

Expected: diff clean; новые строки без placeholders и запрещённых dash characters.

- [ ] **Step 2: Полный verification**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Expected: 0 failures.

- [ ] **Step 3: Visual QA**

Проверить 1440×900 и 390×844:

- hero прокручивается wheel/trackpad при курсоре над canvas;
- problem-heading начинается с `Создаем`;
- metrics и starter совпадают по поверхности с credibility;
- нет horizontal overflow;
- все девять Spline hit-зон работают.

- [ ] **Step 4: Production deploy**

Run: `npx vercel deploy --prod --yes`

Expected: deployment `READY`, alias `https://myland-sooty.vercel.app` обновлён.

- [ ] **Step 5: Production smoke**

На публичном alias проверить HTTP 200, wheel над hero, новый heading, семь изменённых карточек, desktop/mobile overflow и девять Spline hit-зон.


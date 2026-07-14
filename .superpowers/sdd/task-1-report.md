# Task 1 report: Надёжная wheel/trackpad-прокрутка над hero

## Status

`DONE`

## Scope delivered

- Wheel listener сохранён в capture phase и переведён на `passive: false`.
- Для wheel-событий только над видимым Spline canvas вызывается
  `event.preventDefault()`.
- Нормализованные wheel/trackpad delta агрегируются до следующего animation
  frame и безусловно передаются в
  `window.scrollBy({ top: delta, left: 0, behavior: "auto" })`.
- Сохранены исходные canvas, composed-path и viewport guards, а также cleanup
  animation frame.
- Browser-регрессия сначала проверяет реальный Spline canvas, затем synthetic
  wheel-capturing canvas.
- Перед `boundingBox()` тест condition-based ожидает видимость реального
  canvas: Spline сначала монтирует скрытый `display: none` canvas и показывает
  его после загрузки внешней сцены.
- `components/LockedSplineHero.tsx`, scene URL, Spline canvas-разметка и карта
  девяти hit-зон не изменялись.

## TDD record

### RED

Сначала были изменены только scoped unit/E2E contracts.

```sh
npm test -- tests/spline-wheel-bridge.test.ts
```

Exit 1: 1 failed, 2 passed. Ожидаемый контракт упал на старом
`passive: true`; output также показывал старые `scrollYBeforeWheel` и
conditional fallback.

### GREEN focused unit

```sh
npm test -- tests/spline-wheel-bridge.test.ts tests/spline-navigation.test.ts
```

Exit 0: 2 files passed, 19 tests passed.

### Focused browser regression

Первый combined запуск подтвердил все девять hit-зон, но wheel-тест завершился
до wheel-сценария: React canvas уже существовал, однако `boundingBox()` вернул
`null`. Повтор `--repeat-each=2` воспроизвёл это 2/2. Диагностический layout
snapshot показал canvas `display: none`, rect `0×0`, wrapper `1440×900`.
Condition-based ожидание видимости подтвердило гипотезу: без production-правок
canvas стал `display: block`, `1440×900`, и regression прошла. Временная
диагностика была удалена; оставлен только `toBeVisible()`.

Финальный focused запуск:

```sh
npm run test:e2e -- tests/e2e/home.spec.ts --grep "wheel bridge|routes every visible layer"
```

Exit 0: 2 tests passed. Wheel regression проверила real и synthetic canvas;
navigation regression проверила все девять Spline hit-зон.

## Full verification

```sh
npm test
```

Exit 0: 5 files passed, 49 tests passed.

```sh
npm run typecheck
```

Exit 0: Next route types generated; `tsc --noEmit` passed.

```sh
git diff --check
```

Exit 0, clean.

## Self-review

- Diff production scope ограничен `components/SplineWheelBridge.tsx`.
- Listener options идентичны при add/remove; cleanup pending animation frame
  сохранён.
- Delta нормализуется и агрегируется до одного `scrollBy` на animation frame.
- События вне Spline canvas и события при невидимом canvas остаются без
  `preventDefault()`.
- `git diff --exit-code HEAD -- components/LockedSplineHero.tsx` clean.
- В E2E не изменены координаты, hashes или порядок девяти hit-зон.
- Временные diagnostic logs отсутствуют.

## Concerns

Функциональных concerns нет. Playwright dev server выводит существующие
warnings о нескольких lockfiles/workspace root и `NO_COLOR`/`FORCE_COLOR`; они
не влияют на exit code или assertions.

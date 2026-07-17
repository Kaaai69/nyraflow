# Mobile HTML Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken mobile Spline presentation with a responsive HTML hero while leaving the existing desktop Spline scene and interactions unchanged.

**Architecture:** A client-side `ResponsiveHero` uses `matchMedia("(min-width: 768px)")` to mount exactly one hero implementation. Mobile receives semantic HTML and a static optimized cube image; desktop receives the existing dynamically imported `LockedSplineHero`, preserving its direct `main > div > canvas` DOM shape and the existing wheel bridge.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Playwright, `next/image`.

## Global Constraints

- Below `768px`, render the mobile HTML hero and do not mount or request the Spline scene.
- At `768px` and above, render the existing `LockedSplineHero` with the exact current scene URL and callbacks.
- Do not change `components/LockedSplineHero.tsx`, `components/SplineWheelBridge.tsx`, or `lib/spline-navigation.ts`.
- Mobile scrolling must remain native; do not add `touchmove` handlers or simulated scrolling.
- Use `min-height: 100svh`, allow content-driven growth, and respect safe-area insets.
- Preserve the approved Russian copy, link destinations, desktop hero, footer, legal pages, and team content.
- On mobile, use the existing `nyraflow` wordmark as the `#top` link, one filled primary action, one text secondary action, a `34-40px` heading, and a masked cube visual at `72-86%` width.
- Verify first on a preview deployment; update production only after mobile and desktop checks pass.

## File Map

- Create `content/mobile-hero.ts`: approved mobile hero copy, navigation, calls to action, and image metadata.
- Create `components/MobileHero.tsx`: semantic mobile-only hero markup.
- Create `components/ResponsiveHero.tsx`: media-query boundary and lazy desktop Spline mount.
- Create `public/images/hero/mobile-cubes.webp`: static decorative crop from the current Spline composition.
- Modify `app/page.tsx`: replace the direct hero component with the responsive boundary.
- Modify `app/globals.css`: scope the full-viewport rule to the desktop Spline div and style the mobile hero.
- Create `tests/mobile-hero.test.ts`: content, semantics, asset, and implementation contract.
- Modify `tests/home-page.test.ts`: update the expected component boundary inside `<main>`.
- Modify `tests/spline-wheel-bridge.test.ts`: preserve the bridge placement while expecting `ResponsiveHero`.
- Modify `tests/e2e/home.spec.ts`: add mobile hero, no-Spline-request, overflow, and native touch-scroll coverage.

---

### Task 1: Add mobile hero regression tests

**Files:**
- Create: `tests/mobile-hero.test.ts`
- Modify: `tests/home-page.test.ts`
- Modify: `tests/spline-wheel-bridge.test.ts`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: existing `app/page.tsx`, homepage sections, Spline wheel bridge, and Playwright Chromium project.
- Produces: a failing contract for `MobileHero`, `ResponsiveHero`, the mobile asset, and touch behavior.

- [ ] **Step 1: Write the failing unit contract**

Create `tests/mobile-hero.test.ts` with this complete test:

```tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("mobile hero", () => {
  it("renders approved semantic content and links", async () => {
    const { default: MobileHero } = await import("../components/MobileHero");
    const markup = renderToStaticMarkup(createElement(MobileHero));

    expect(markup).toContain('id="top"');
    expect(markup).toContain('data-testid="mobile-hero"');
    expect(markup).toContain("Создаём digital-продукты, которые двигают бизнес вперёд");
    expect(markup).toContain(
      "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.",
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="Навигация первого экрана"');
    expect(markup).toContain('href="#top"');
    expect(markup).toContain('href="#team"');
    expect(markup).toContain('href="#contact"');
    expect(markup).toContain('href="#work"');
    expect(markup).toContain("Обсудить проект");
    expect(markup).toContain("Узнать больше");
  });

  it("uses an optimized decorative WebP that cannot capture touch input", async () => {
    const { default: MobileHero } = await import("../components/MobileHero");
    const markup = decodeURIComponent(
      renderToStaticMarkup(createElement(MobileHero)),
    );
    const assetPath = resolve(
      projectRoot,
      "public/images/hero/mobile-cubes.webp",
    );

    expect(existsSync(assetPath)).toBe(true);
    const asset = readFileSync(assetPath);
    expect(asset.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(asset.subarray(8, 12).toString("ascii")).toBe("WEBP");
    expect(markup).toContain("/images/hero/mobile-cubes.webp");
    expect(markup).toContain('alt=""');
    expect(markup).toContain("pointer-events-none");
  });

  it("keeps the desktop Spline implementation lazy and unchanged", () => {
    const responsive = readFileSync(
      resolve(projectRoot, "components/ResponsiveHero.tsx"),
      "utf8",
    );
    const locked = readFileSync(
      resolve(projectRoot, "components/LockedSplineHero.tsx"),
      "utf8",
    );

    expect(responsive).toContain('matchMedia("(min-width: 768px)")');
    expect(responsive).toContain('dynamic(() => import("./LockedSplineHero")');
    expect(responsive).toContain("<MobileHero />");
    expect(responsive).toContain("<DesktopSplineHero />");
    expect(locked).toContain(
      'scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"',
    );
  });
});
```

- [ ] **Step 2: Update structural tests for the responsive boundary**

In `tests/home-page.test.ts`, change the main-child expectation and import assertion to:

```ts
expect(page).toContain('import ResponsiveHero from "@/components/ResponsiveHero";');
expect(mainChildren).toEqual(["<ResponsiveHero />", "<HomeSections />"]);
```

In `tests/spline-wheel-bridge.test.ts`, replace the direct-hero position variable and assertion with:

```ts
const hero = page.indexOf("<ResponsiveHero />");

expect(page).toContain(
  'import ResponsiveHero from "@/components/ResponsiveHero";',
);
```

Keep all existing bridge-order and locked-Spline assertions intact.

- [ ] **Step 3: Extend the existing mobile Playwright test before implementation**

Inside `mobile layout stays single-column, overflow-free, and touch accessible`, register Spline requests before navigation and add these checks immediately after the response assertion:

```ts
const splineRequests: string[] = [];
page.on("request", (request) => {
  if (request.url().includes("prod.spline.design")) {
    splineRequests.push(request.url());
  }
});

const hero = page.getByTestId("mobile-hero");
await expect(hero).toBeVisible();
await expect(page.locator("main canvas")).toHaveCount(0);
await expect(page.getByRole("heading", {
  name: "Создаём digital-продукты, которые двигают бизнес вперёд",
  exact: true,
})).toBeVisible();
await expect(hero.getByRole("link", { name: "Обсудить проект" })).toHaveAttribute(
  "href",
  "#contact",
);
await expect(hero.getByRole("link", { name: "Узнать больше" })).toHaveAttribute(
  "href",
  "#work",
);

const heroMetrics = await hero.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    height: rect.height,
    viewportHeight: window.visualViewport?.height ?? window.innerHeight,
    backgroundImage: style.backgroundImage,
    overflowX: element.scrollWidth - element.clientWidth,
  };
});
expect(heroMetrics.height).toBeGreaterThanOrEqual(heroMetrics.viewportHeight);
expect(heroMetrics.backgroundImage).not.toBe("none");
expect(heroMetrics.overflowX).toBe(0);

const cdp = await context.newCDPSession(page);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: 195, y: 650, radiusX: 2, radiusY: 2, force: 1 }],
});
for (const y of [600, 550, 500, 450, 400, 350]) {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 195, y, radiusX: 2, radiusY: 2, force: 1 }],
  });
}
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
expect(splineRequests).toEqual([]);
```

- [ ] **Step 4: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/mobile-hero.test.ts tests/home-page.test.ts tests/spline-wheel-bridge.test.ts
npx playwright test tests/e2e/home.spec.ts --project=chromium --grep "mobile layout"
```

Expected: unit tests fail because `MobileHero`, `ResponsiveHero`, and the WebP do not exist; the mobile E2E test fails because production code still mounts the Spline hero and has no `mobile-hero` test id.

- [ ] **Step 5: Commit the verified failing regression tests**

```bash
git add tests/mobile-hero.test.ts tests/home-page.test.ts tests/spline-wheel-bridge.test.ts tests/e2e/home.spec.ts
git commit -m "test: define mobile hero behavior"
```

---

### Task 2: Implement the responsive mobile hero

**Files:**
- Create: `content/mobile-hero.ts`
- Create: `components/MobileHero.tsx`
- Create: `components/ResponsiveHero.tsx`
- Create: `public/images/hero/mobile-cubes.webp`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/mobile-hero.test.ts`
- Test: `tests/home-page.test.ts`
- Test: `tests/spline-wheel-bridge.test.ts`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Produces: `mobileHeroContent`, default `MobileHero`, and default `ResponsiveHero`.
- Consumes: unchanged default `LockedSplineHero` and existing section anchors `#work`, `#team`, and `#contact`.

- [ ] **Step 1: Add the approved content contract**

Create `content/mobile-hero.ts`:

```ts
export const mobileHeroContent = {
  navigation: [
    { label: "Главная", href: "#top" },
    { label: "О нас", href: "#team" },
    { label: "Контакты", href: "#contact" },
  ],
  title: "Создаём digital-продукты, которые двигают бизнес вперёд",
  description:
    "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.",
  primaryAction: { label: "Обсудить проект", href: "#contact" },
  secondaryAction: { label: "Узнать больше", href: "#work" },
  visual: {
    src: "/images/hero/mobile-cubes.webp",
    alt: "",
    width: 1120,
    height: 1040,
  },
} as const;
```

- [ ] **Step 2: Create the static decorative asset from the current desktop scene**

Use Playwright to capture a 2× crop that contains only the blue cube cluster and background, then convert it to WebP:

```bash
mkdir -p public/images/hero
node --input-type=module -e 'import { chromium } from "playwright"; const browser = await chromium.launch(); const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 }); const page = await context.newPage(); await page.goto("https://myland-sooty.vercel.app/?mobile-asset=1", { waitUntil: "load" }); await page.waitForTimeout(4000); await page.screenshot({ path: "/tmp/nyraflow-mobile-cubes.png", clip: { x: 650, y: 70, width: 560, height: 520 } }); await browser.close();'
sips -s format webp /tmp/nyraflow-mobile-cubes.png --out public/images/hero/mobile-cubes.webp
```

Verify:

```bash
file public/images/hero/mobile-cubes.webp
sips -g pixelWidth -g pixelHeight public/images/hero/mobile-cubes.webp
```

Expected: RIFF WebP, `1120 × 1040`.

- [ ] **Step 3: Build semantic mobile markup**

Create `components/MobileHero.tsx`:

```tsx
import Image from "next/image";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/ssr";

import { mobileHeroContent } from "@/content/mobile-hero";

export default function MobileHero() {
  const content = mobileHeroContent;

  return (
    <section
      id="top"
      data-testid="mobile-hero"
      className="mobile-hero relative isolate flex min-w-0 flex-col overflow-hidden px-gutter-mobile md:hidden"
    >
      <nav aria-label="Навигация первого экрана" className="relative z-10">
        <ul className="flex items-center justify-center gap-6 text-sm text-text-secondary">
          {content.navigation.map((item) => (
            <li key={item.href}>
              <a className="inline-flex min-h-11 items-center" href={item.href}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative z-10 mt-10 max-w-[34rem]">
        <h1 className="text-[clamp(2.5rem,11vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em] text-text-primary">
          {content.title}
        </h1>
        <p className="mt-6 max-w-[31rem] text-base leading-relaxed text-text-secondary">
          {content.description}
        </p>
        <div className="mt-7 grid gap-3 min-[390px]:grid-cols-2">
          <a className="button-primary inline-flex justify-between gap-4" href={content.primaryAction.href}>
            {content.primaryAction.label}
            <ArrowRight aria-hidden size={20} weight="bold" />
          </a>
          <a className="button-secondary inline-flex min-h-12 items-center justify-between gap-4 rounded-full border border-blue px-6 font-semibold text-blue" href={content.secondaryAction.href}>
            {content.secondaryAction.label}
            <ArrowRight aria-hidden size={20} weight="bold" />
          </a>
        </div>
      </div>

      <div className="pointer-events-none relative mt-3 min-h-52 flex-1" aria-hidden>
        <Image
          {...content.visual}
          priority
          sizes="100vw"
          className="absolute inset-x-[-10%] bottom-[-4%] mx-auto h-auto w-[120%] max-w-[36rem] object-contain"
        />
      </div>

      <CaretDown
        aria-hidden
        className="relative z-10 mx-auto mt-2 shrink-0 text-text-secondary"
        size={28}
      />
    </section>
  );
}
```

- [ ] **Step 4: Mount only the implementation needed by the viewport**

Create `components/ResponsiveHero.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import MobileHero from "./MobileHero";

const DesktopSplineHero = dynamic(() => import("./LockedSplineHero"), {
  ssr: false,
});

export default function ResponsiveHero() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop ? <DesktopSplineHero /> : <MobileHero />;
}
```

This server-renders mobile HTML for content availability. The `md:hidden` class suppresses it during the brief desktop hydration interval; desktop then mounts the existing dynamic Spline component directly, keeping `main > div > canvas` unchanged.

- [ ] **Step 5: Wire the boundary into the page and scope hero CSS**

In `app/page.tsx`, replace the `LockedSplineHero` import and render with:

```tsx
import ResponsiveHero from "@/components/ResponsiveHero";

// inside main
<ResponsiveHero />
```

In `app/globals.css`, replace `.site-main > :first-child` with `.site-main > div:first-child` so only the direct desktop Spline wrapper receives the full viewport rule. Add:

```css
.mobile-hero {
  min-height: 100svh;
  padding-top: max(1.25rem, env(safe-area-inset-top));
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 76% 72%, rgb(67 185 242 / 0.3), transparent 42%),
    linear-gradient(180deg, #f7f6f2 0%, #d9f2ff 16%, #acdfff 72%, #f7f6f2 100%);
  touch-action: pan-y;
}

.button-secondary {
  transition:
    color var(--duration-base) var(--ease-premium),
    background-color var(--duration-base) var(--ease-premium),
    border-color var(--duration-base) var(--ease-premium),
    transform var(--duration-base) var(--ease-premium);
}

@media (hover: hover) and (pointer: fine) {
  .button-secondary:hover {
    border-color: var(--color-blue-deep);
    background: rgb(255 255 255 / 0.42);
    color: var(--color-blue-deep);
    transform: translateY(-1px);
  }
}
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/mobile-hero.test.ts tests/home-page.test.ts tests/spline-wheel-bridge.test.ts
npx playwright test tests/e2e/home.spec.ts --project=chromium --grep "mobile layout|trackpad bursts|desktop home page"
```

Expected: all focused Vitest and Playwright checks pass. The mobile test observes no canvas or Spline request and a positive `window.scrollY` after the touch gesture.

- [ ] **Step 7: Commit the implementation**

```bash
git add app/page.tsx app/globals.css components/MobileHero.tsx components/ResponsiveHero.tsx content/mobile-hero.ts public/images/hero/mobile-cubes.webp
git commit -m "feat: add responsive mobile hero"
```

---

### Task 3: Verify responsive behavior and deploy safely

**Files:**
- Test: all existing test and source files.
- Deploy: Vercel preview, then the existing `myland` production project.

**Interfaces:**
- Consumes: committed responsive hero implementation and current Vercel project link.
- Produces: evidence that mobile is fixed and desktop remains unchanged in production.

- [ ] **Step 1: Run the complete local verification suite**

```bash
npm test
npm run typecheck
npm run build
npx playwright test tests/e2e/home.spec.ts --project=chromium
```

Expected: all unit tests, type checking, build, and E2E checks pass. If the external WebGL scene cannot become visible in headless Chromium, record that environmental failure separately; all synthetic desktop wheel tests, mobile touch tests, and non-WebGL page tests must pass.

- [ ] **Step 2: Capture local mobile and desktop screenshots**

Use Playwright at `390 × 844`, `430 × 932`, and `1280 × 720`. Confirm mobile copy is not clipped, the decorative crop contains no embedded text, both CTA buttons fit, there is no horizontal overflow, and desktop matches the current Spline scene.

- [ ] **Step 3: Push the implementation branch**

```bash
git push origin codex/hero-scroll-card-polish
```

Expected: GitHub accepts the new design, test, and implementation commits.

- [ ] **Step 4: Deploy and verify a preview**

```bash
npx vercel@latest --yes
```

Open the returned preview URL and repeat the mobile touch gesture, no-Spline-request check, mobile screenshots, and desktop screenshot. Do not promote if any check fails.

- [ ] **Step 5: Deploy the verified build to production**

```bash
npx vercel@latest --prod --yes
```

Expected: deployment reaches `READY` and aliases `https://myland-sooty.vercel.app`.

- [ ] **Step 6: Verify production and working tree state**

Confirm on production:

- mobile hero is visible at `390 × 844` with no Spline request;
- a touch gesture from the hero increases `window.scrollY`;
- desktop Spline renders at `1280 × 720` and wheel/trackpad scrolling still works;
- Fedor remains first in the team section;
- legal footer, `/terms`, and `/privacy` remain present;
- `git status --porcelain` is empty and local HEAD matches the pushed branch.

---

### Task 4: Refine the mobile hero composition

**Files:**
- Modify: `tests/mobile-hero.test.ts`
- Modify: `components/MobileHero.tsx`
- Modify: `content/mobile-hero.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the existing `MobileHero`, `mobileHeroContent`, WebP asset, and responsive `768px` boundary.
- Produces: the approved premium editorial-tech mobile composition without changing `ResponsiveHero`, desktop Spline, homepage sections, or footer.

- [x] **Step 1: Add a failing composition contract**

Extend `tests/mobile-hero.test.ts` with:

```ts
it("uses the approved editorial hierarchy", async () => {
  const { default: MobileHero } = await import("../components/MobileHero");
  const markup = renderToStaticMarkup(createElement(MobileHero));
  const source = readFileSync(
    resolve(projectRoot, "components/MobileHero.tsx"),
    "utf8",
  );
  const styles = readFileSync(resolve(projectRoot, "app/globals.css"), "utf8");

  expect(markup).toContain("nyraflow");
  expect(markup).toContain("mobile-hero-wordmark");
  expect(markup).toContain("mobile-hero-title");
  expect(markup).toContain("mobile-hero-secondary-action");
  expect(markup).not.toContain("button-secondary");
  expect(source).not.toContain("CaretDown");
  expect(source).not.toContain("grid-cols-2");
  expect(styles).toMatch(/\.mobile-hero-art[\s\S]*mask-image:/);
  expect(styles).not.toContain("width: calc(120%");
});
```

Update the approved description assertion to:

```ts
expect(markup).toContain(
  "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы в понятную систему.",
);
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/mobile-hero.test.ts
```

Expected: the new test fails because the wordmark, hierarchy classes, text secondary action, and masked art treatment do not exist yet.

- [x] **Step 3: Implement the approved mobile composition**

Update `content/mobile-hero.ts` so the `#top` destination is owned by the wordmark and the description contains no em dash:

```ts
brand: { label: "nyraflow", href: "#top" },
navigation: [
  { label: "О нас", href: "#team" },
  { label: "Контакты", href: "#contact" },
],
description:
  "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы в понятную систему.",
```

Update `MobileHero` to use this structure:

```tsx
<header className="mobile-hero-header relative z-10 flex min-h-11 items-center justify-between gap-5">
  <a className="mobile-hero-wordmark inline-flex min-h-11 items-center" href={content.brand.href}>
    {content.brand.label}
  </a>
  <nav aria-label="Навигация первого экрана">
    <ul className="flex items-center gap-5 text-sm text-text-secondary">
      {content.navigation.map((item) => (
        <li key={item.href}>
          <a className="inline-flex min-h-11 items-center whitespace-nowrap" href={item.href}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</header>

<div className="relative z-10 mt-12 max-w-[34rem]">
  <h1 className="mobile-hero-title font-medium text-text-primary">{content.title}</h1>
  <p className="mt-5 max-w-[31rem] text-base leading-[1.55] text-text-secondary">
    {content.description}
  </p>
  <div className="mt-7 flex flex-col items-start gap-3">
    <a className="button-primary inline-flex min-w-[13.5rem] justify-between gap-4" href={content.primaryAction.href}>
      {content.primaryAction.label}
      <ArrowRight aria-hidden size={20} weight="bold" />
    </a>
    <a className="mobile-hero-secondary-action inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-1 font-medium text-blue" href={content.secondaryAction.href}>
      {content.secondaryAction.label}
      <ArrowRight aria-hidden size={18} weight="bold" />
    </a>
  </div>
</div>
```

Keep the existing decorative `Image`, but remove `priority`, remove the down indicator, and keep it inside `.mobile-hero-art-frame`.

Replace the mobile hero CSS with the approved restrained treatment:

```css
.mobile-hero {
  min-height: 100svh;
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 72% 82%, rgb(67 185 242 / 0.18), transparent 38%),
    linear-gradient(180deg, #f7f6f2 0%, #eef9ff 34%, #caebff 100%);
  touch-action: pan-y;
}

.mobile-hero-wordmark {
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.035em;
}

.mobile-hero-title {
  max-width: 22rem;
  font-size: clamp(2.125rem, 9.2vw, 2.5rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.mobile-hero-art-frame {
  position: absolute;
  inset: 0 calc(-1 * var(--spacing-gutter-mobile));
  overflow: hidden;
}

.mobile-hero-art {
  inset-inline: 0;
  bottom: -6%;
  width: 82%;
  max-width: 22rem;
  mask-image: radial-gradient(ellipse 72% 78% at 50% 52%, #000 58%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 72% 78% at 50% 52%, #000 58%, transparent 100%);
}
```

- [x] **Step 4: Run focused verification and capture the three mobile sizes**

Run:

```bash
npm test -- tests/mobile-hero.test.ts
npm run typecheck
npx playwright test tests/e2e/home.spec.ts --project=chromium --grep "mobile layout"
```

Capture `375 × 667`, `390 × 844`, and `430 × 932`. Confirm no action wraps, the art has no rectangular seam, horizontal overflow is zero, native touch scrolling works, and the hero remains readable with Safari browser chrome.

- [x] **Step 5: Run regressions and commit**

Run:

```bash
npm test
npm run build
npx playwright test tests/e2e/home.spec.ts --project=chromium --grep "desktop home page|trackpad bursts|mobile layout"
```

Expected: all unit tests, type checking, build, focused desktop behavior, and mobile behavior pass.

Commit:

```bash
git add tests/mobile-hero.test.ts components/MobileHero.tsx content/mobile-hero.ts app/globals.css docs/superpowers/plans/2026-07-17-mobile-html-hero.md
git commit -m "fix: refine mobile hero composition"
```

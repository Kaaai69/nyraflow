# Hero, Team and Portfolio Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать две кнопки исходной Spline-сцены навигационными, исправить секцию команды под три места и показать десять реальных опубликованных проектов вместо концептов.

**Architecture:** Внешняя Spline-сцена остаётся источником всей графики hero, а клиентский адаптер переводит события двух существующих интерактивных объектов в переходы к DOM-секциям. Контент команды и работ хранится в `content/home.ts`; секционные компоненты только отображают эти данные. Все скриншоты проектов хранятся локально и проходят тот же контракт размеров, что существующие изображения.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, `@splinetool/react-spline/next`, Vitest, Playwright, Vercel CLI.

## Global Constraints

- Использовать исходную сцену `https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode` без изменения геометрии, материалов, камеры и анимаций.
- Основная кнопка hero ведёт к `#contact`, вторичная — к `#work`.
- Не добавлять HTML-оверлей поверх Spline canvas.
- Сохранить существующий `SplineWheelBridge` и порядок секций.
- Заголовок команды: `Три человека. Одна ответственность за результат.`
- Подписи: `Арсений, Backend & Automation Engineer` и `Артём, Frontend & Product Developer`.
- Третья карточка — неинтерактивное место под будущую фотографию без вымышленного человека.
- Портфолио содержит ровно десять опубликованных проектов и ни одного концепта.
- Новая анимация ограничивается `scrollIntoView` и существующими CSS-переходами.

---

### Task 1: Адаптер навигации Spline hero

**Files:**
- Create: `lib/spline-navigation.ts`
- Modify: `components/LockedSplineHero.tsx`
- Modify: `tests/foundation.test.ts`
- Create: `tests/spline-navigation.test.ts`

**Interfaces:**
- Produces: `resolveSplineTarget(name: string): "work" | "contact" | null`
- Produces: `scrollToSection(id: "work" | "contact"): boolean`
- Consumes: `SplineEvent.target.name` от `@splinetool/react-spline/next`.

- [ ] **Step 1: Write the failing navigation contract tests**

Add tests that require exact routing, unknown-object safety, reduced-motion behavior, the unchanged scene URL and the absence of wrapper/overlay JSX:

```ts
expect(resolveSplineTarget("Rectangle 4")).toBe("contact");
expect(resolveSplineTarget("get")).toBe("work");
expect(resolveSplineTarget("Camera")).toBeNull();
expect(heroSource).toContain("xOl5brZcGdsZ7KV4/scene.splinecode");
expect(heroSource).not.toMatch(/<button|<a\b/);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/spline-navigation.test.ts tests/foundation.test.ts`

Expected: FAIL because `lib/spline-navigation.ts` does not exist and the current hero exposes no event adapter.

- [ ] **Step 3: Implement the pure resolver and section navigation**

Create a client-safe utility with a closed mapping and reduced-motion handling:

```ts
export type HeroSectionId = "work" | "contact";

const splineTargets: Readonly<Record<string, HeroSectionId>> = {
  "Rectangle 4": "contact",
  get: "work",
};

export function resolveSplineTarget(name: string) {
  return splineTargets[name] ?? null;
}

export function scrollToSection(id: HeroSectionId) {
  const section = document.getElementById(id);
  if (!section) return false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
  return true;
}
```

Make `LockedSplineHero` a client component. Track the current Spline hover target and invoke the resolver when the canvas receives a pointer-up; keep the direct `<Spline>` return, original scene literal and no extra visual DOM:

```tsx
"use client";

import { useRef } from "react";
import type { SplineEvent } from "@splinetool/react-spline";
import Spline from "@splinetool/react-spline/next";
import { resolveSplineTarget, scrollToSection } from "@/lib/spline-navigation";

export default function LockedSplineHero() {
  const activeTarget = useRef<string | null>(null);
  const handleSplineHover = (event: SplineEvent) => {
    activeTarget.current = event.target.name;
  };
  const handlePointerUp = () => {
    const id = activeTarget.current ? resolveSplineTarget(activeTarget.current) : null;
    if (id) scrollToSection(id);
  };

  return (
    <Spline
      scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"
      onSplineMouseHover={handleSplineHover}
      onPointerUp={handlePointerUp}
    />
  );
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- tests/spline-navigation.test.ts tests/foundation.test.ts`

Expected: PASS; the protected scene and isolated component assertions accept event props but still reject wrappers, overlays and style changes.

- [ ] **Step 5: Commit**

```bash
git add lib/spline-navigation.ts components/LockedSplineHero.tsx tests/spline-navigation.test.ts tests/foundation.test.ts
git commit -m "feat: connect Spline hero buttons to page sections"
```

### Task 2: Контент и компоновка команды

**Files:**
- Modify: `content/home.ts`
- Modify: `components/home/TeamSection.tsx`
- Modify: `tests/home-content.test.ts`
- Modify: `tests/home-page.test.ts`

**Interfaces:**
- Produces: `TeamMember` с подтверждёнными `name`, `role` и существующим `photo`.
- Consumes: `homeContent.team.items` в `TeamSection`.

- [ ] **Step 1: Write failing team contract tests**

Require the new heading, exact inline labels, two real images, one placeholder and a strict responsive grid without the old stagger:

```ts
expect(markup).toContain("Три человека. Одна ответственность за результат.");
expect(markup).toContain("Арсений, Backend &amp; Automation Engineer");
expect(markup).toContain("Артём, Frontend &amp; Product Developer");
expect(markup).toContain("Место для третьего фото");
expect(markup).not.toContain("md:mt-20");
expect(markup).toContain("xl:grid-cols-3");
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: FAIL on the old word `Два`, absent roles/placeholder and staggered two-column layout.

- [ ] **Step 3: Update team data and layout**

Set the two role values to the approved English titles and remove the unused unconfirmed-role branch. Render the two members and a third placeholder inside one grid:

```tsx
<div className="grid min-w-0 gap-8 md:grid-cols-2 lg:col-span-8 xl:grid-cols-3 xl:gap-5">
  {content.items.map((member) => (
    <article key={member.id} className="min-w-0">
      <div className="aspect-[4/5] overflow-hidden rounded-media bg-surface-blue">
        <Image className="h-full w-full object-cover" {...member.photo} />
      </div>
      <h3 className="mt-5 text-xl font-semibold leading-snug tracking-[-0.02em]">
        {member.name}<span className="font-medium text-text-secondary">, {member.role}</span>
      </h3>
    </article>
  ))}
  <article className="min-w-0" aria-label="Место для третьего фото">
    <div className="flex aspect-[4/5] items-end rounded-media border border-line bg-surface-blue p-6">
      <p className="text-sm font-semibold text-blue-deep">Место для третьего фото</p>
    </div>
  </article>
</div>
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: PASS with two image assets and three visual team slots.

- [ ] **Step 5: Commit**

```bash
git add content/home.ts components/home/TeamSection.tsx tests/home-content.test.ts tests/home-page.test.ts
git commit -m "feat: expand team section to three slots"
```

### Task 3: Десять опубликованных работ

**Files:**
- Modify: `content/home.ts`
- Modify: `components/home/WorkSection.tsx`
- Modify: `tests/home-content.test.ts`
- Modify: `tests/home-page.test.ts`
- Create: `public/images/work/atelier-kitchens.jpg`
- Create: `public/images/work/premium-school-landing.jpg`
- Create: `public/images/work/glamping-silenzio.jpg`
- Create: `public/images/work/aether-landing.jpg`
- Create: `public/images/work/furniture.jpg`
- Create: `public/images/work/florist.jpg`
- Create: `public/images/work/amore.jpg`
- Create: `public/images/work/soul.jpg`
- Create: `public/images/work/detailing.jpg`
- Create: `public/images/work/groom.jpg`

**Interfaces:**
- Produces: единый `WorkMedia` со `status: "published"`, `href`, `title`, `caption`, `cta` и локальным `ImageAsset`.
- Consumes: массив `homeContent.work.media` длиной 10 в `WorkSection`.

- [ ] **Step 1: Write failing portfolio contract tests**

Require ten non-temporary published items, ten unique URLs, local matching image dimensions, no concepts and rendered secure external links:

```ts
expect(homeContent.work.media).toHaveLength(10);
expect(homeContent.work.media.every((item) => item.status === "published")).toBe(true);
expect(new Set(homeContent.work.media.map((item) => item.href))).toHaveSize(10);
expect(markup).not.toContain("Концепт");
expect(markup.match(/target="_blank"/g)).toHaveLength(10);
expect(markup.match(/rel="noreferrer noopener"/g)).toHaveLength(10);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: FAIL because only one published work and two concepts exist.

- [ ] **Step 3: Install the audited real screenshots**

Copy the already captured 1440×900 PNGs into `public/images/work/` and convert them to JPEG at quality 88 using the system image tool. Use the exact source-to-destination mapping:

```text
/tmp/myland-vercel-audit/atelier-kitchens.png -> atelier-kitchens.jpg
/tmp/myland-vercel-audit/premium-school-landing.png -> premium-school-landing.jpg
/tmp/myland-vercel-audit/glamping-silenzio.png -> glamping-silenzio.jpg
/tmp/myland-vercel-audit/aether-landing.png -> aether-landing.jpg
/tmp/myland-vercel-audit/furniture.png -> furniture.jpg
/tmp/myland-vercel-audit/florist.png -> florist.jpg
/tmp/myland-vercel-audit/amore.png -> amore.jpg
/tmp/myland-vercel-audit/soul.png -> soul.jpg
/tmp/myland-vercel-audit/detailing.png -> detailing.jpg
/tmp/myland-vercel-audit/groom.png -> groom.jpg
```

All content entries use `width: 1440` and `height: 900` after verifying the generated files.

- [ ] **Step 4: Replace the concept union and content with real projects**

Use one published type and the approved URLs. Each item has a concise category caption and `cta: "Открыть проект"`. The first item is Atelier Kitchens, followed by Лингва.Академия, Silenzio, Мезонин, Дом в деталях, Florea, Amore, SOUL, Detail Pro and Groom Atelier.

- [ ] **Step 5: Render one feature and a nine-card editorial grid**

Make the first item a full-width figure. Render the remainder in a two-column grid and alternate seven/five column spans without vertical negative margins:

```tsx
const [featured, ...projects] = content.media;

<ProjectCard project={featured} featured />
<div className="mt-12 grid items-start gap-x-6 gap-y-14 md:mt-16 md:grid-cols-12">
  {projects.map((project, index) => (
    <ProjectCard
      key={project.id}
      project={project}
      className={index % 2 === 0 ? "md:col-span-7" : "md:col-span-5"}
    />
  ))}
</div>
```

Every card wraps its image and caption in an `<a target="_blank" rel="noreferrer noopener">` and keeps a visible focus outline through the global focus rule.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test -- tests/home-content.test.ts tests/home-page.test.ts`

Expected: PASS with ten local assets, ten secure links and zero concepts.

- [ ] **Step 7: Commit**

```bash
git add content/home.ts components/home/WorkSection.tsx tests/home-content.test.ts tests/home-page.test.ts public/images/work/*.jpg
git commit -m "feat: publish ten real portfolio projects"
```

### Task 4: Browser verification and deployment

**Files:**
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: complete page from Tasks 1–3.
- Produces: regression coverage for desktop structure, links, team non-overlap and hero navigation.

- [ ] **Step 1: Write failing browser assertions**

Update the approved heading and replace concept assertions with:

```ts
await expect(page.locator("#work a[target='_blank']")).toHaveCount(10);
await expect(page.getByText("Место для третьего фото", { exact: true })).toBeVisible();
expect(await page.getByRole("heading", { name: /Арсений,/ }).boundingBox()).not.toBeNull();
expect(await page.getByRole("heading", { name: /Артём,/ }).boundingBox()).not.toBeNull();
```

Add DOM-level calls to the tested navigation adapter for deterministic hash/scroll verification, while retaining a manual live-Spline click check in the final browser pass.

- [ ] **Step 2: Run the browser test and verify RED**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`

Expected: FAIL on the old team heading, concept count and single project link.

- [ ] **Step 3: Complete E2E assertions and run GREEN**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`

Expected: PASS with 8 ordered non-hero sections, 10 work links, 3 team slots, no horizontal overflow and no page/console errors.

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Expected: every command exits 0 with no failed tests or TypeScript/build errors.

- [ ] **Step 5: Capture desktop visual evidence**

Run the local dev server, capture a full-page 1440×900 screenshot and inspect the team and portfolio crops. Confirm no text/image overlap, consistent card radii and no horizontal overflow.

- [ ] **Step 6: Commit E2E coverage**

```bash
git add tests/e2e/home.spec.ts
git commit -m "test: cover refreshed team portfolio and hero navigation"
```

- [ ] **Step 7: Deploy and smoke-test Vercel**

Run `npx vercel deploy --prod --yes --scope kaaai`, wait for the production URL, then open it at 1440×900. Verify HTTP 200, ten project links, the new team copy, both hero destinations and absence of severe console errors.

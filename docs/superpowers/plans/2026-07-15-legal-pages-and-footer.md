# Юридические страницы и футер Nyraflow — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельные страницы `/terms` и `/privacy`, расширить футер юридическими данными и контактами, а также связать документы с существующей контактной формой.

**Architecture:** Юридические тексты хранятся как типизированные данные в одном content-модуле и отображаются общим серверным шаблоном. Две route-страницы задают собственные metadata и передают нужный документ шаблону; общий `SiteFooter` используется на главной и юридических страницах. Существующая форма остаётся неактивной, но получает корректные ссылки на документы.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript 5.9, Tailwind CSS 4, Vitest, ReactDOM server rendering, Playwright.

## Global Constraints

- Бренд пишется как `nyraflow`.
- Исполнитель: Шевцов Федор Дмитриевич, физическое лицо на НПД, ИНН `463309989306`.
- Контакты: `nyraflow@yandex.ru`, `+7 904 524 61 08`, `@nyraflow`.
- Оферта содержит ровно 14 основных разделов из `/Users/a1111/Downloads/Договор-оферта_Шевцов_Федор_Дмитриевич.docx`; реквизиты выводятся отдельным ненумерованным блоком.
- Политика описывает только реально существующие или непосредственно предусмотренные интерфейсом способы обработки данных.
- `LockedSplineHero`, Spline scene, `SplineWheelBridge` и библиотека навигации hero не изменяются.
- Новые зависимости, сложные анимации и сторонние UI-библиотеки не добавляются.
- Визуальный язык продолжает текущие tokens: canvas/surface, graphite text, blue/cyan accents, Onest, существующие radius/shadow/spacing.

---

## Структура файлов

- Create: `content/legal.ts` — типы, реквизиты, 14 разделов оферты и политика.
- Create: `components/legal/LegalDocumentPage.tsx` — общий серверный шаблон юридического документа.
- Create: `app/terms/page.tsx` — metadata и страница оферты.
- Create: `app/privacy/page.tsx` — metadata и страница политики.
- Modify: `components/home/SiteFooter.tsx` — бренд, навигация, контакты, юридический блок.
- Modify: `components/home/ContactSection.tsx` — ссылки под отключённой формой.
- Modify: `app/globals.css` — print-правила и минимальные legal utilities.
- Create: `tests/legal-content.test.ts` — контракт юридических данных.
- Create: `tests/legal-pages.test.ts` — рендер страниц, footer и metadata.
- Modify: `tests/home-page.test.ts` — регрессия формы и нового футера.
- Create: `tests/e2e/legal.spec.ts` — desktop/mobile browser QA обеих страниц.

---

### Task 1: Типизированный юридический контент

**Files:**
- Create: `tests/legal-content.test.ts`
- Create: `content/legal.ts`

**Interfaces:**
- Produces: `type LegalSection`, `type LegalDocument`, `legalIdentity`, `termsDocument`, `privacyDocument`.
- `LegalSection`: `{ id: string; title: string; paragraphs: readonly string[] }`.
- `LegalDocument`: `{ eyebrow: string; title: string; description: string; effectiveDate: string; sections: readonly LegalSection[]; requisites?: readonly string[] }`.

- [ ] **Step 1: Write the failing content contract**

```ts
import { describe, expect, it } from "vitest";
import {
  legalIdentity,
  privacyDocument,
  termsDocument,
} from "../content/legal";

describe("legal content", () => {
  it("publishes the approved self-employed identity and contacts", () => {
    expect(legalIdentity).toEqual({
      brand: "nyraflow",
      fullName: "Шевцов Федор Дмитриевич",
      status:
        "Физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход»",
      inn: "463309989306",
      email: "nyraflow@yandex.ru",
      phoneLabel: "+7 904 524 61 08",
      phoneHref: "tel:+79045246108",
      telegramLabel: "@nyraflow",
      telegramHref: "https://t.me/nyraflow",
    });
  });

  it("keeps exactly fourteen offer sections and separate requisites", () => {
    expect(termsDocument.sections).toHaveLength(14);
    expect(termsDocument.sections.map(({ title }) => title)).toEqual([
      "Термины и общие положения",
      "Заключение договора и юридическая сила переписки",
      "Предмет договора",
      "Порядок выполнения Проекта",
      "Стоимость и порядок оплаты",
      "Сдача и приёмка Результата",
      "Гарантийные исправления и техническая поддержка",
      "Исключительные права и лицензии",
      "Материалы Заказчика и законность Проекта",
      "Конфиденциальность и персональные данные",
      "Ответственность и ограничения",
      "Отказ от договора, приостановка и возвраты",
      "Претензии и споры",
      "Срок действия и изменение Оферты",
    ]);
    expect(termsDocument.requisites ?? []).toContain("ИНН: 463309989306");
    expect(JSON.stringify(termsDocument)).not.toMatch(/ОГРНИП|ИП Шевцов/);
  });

  it("limits the privacy policy to the approved data and purposes", () => {
    const policy = JSON.stringify(privacyDocument);

    expect(policy).toContain("имя");
    expect(policy).toContain("контакт");
    expect(policy).toContain("текст сообщения");
    expect(policy).toContain("отозвать согласие");
    expect(policy).not.toMatch(/рекламн(ая|ые) рассылк|пиксел|биометрическ/iu);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/legal-content.test.ts`

Expected: FAIL because `content/legal.ts` does not exist.

- [ ] **Step 3: Add the legal data model and exact approved content**

Create the module with this public shape:

```ts
export type LegalSection = Readonly<{
  id: string;
  title: string;
  paragraphs: readonly string[];
}>;

export type LegalDocument = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
  requisites?: readonly string[];
}>;

export const legalIdentity = {
  brand: "nyraflow",
  fullName: "Шевцов Федор Дмитриевич",
  status:
    "Физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход»",
  inn: "463309989306",
  email: "nyraflow@yandex.ru",
  phoneLabel: "+7 904 524 61 08",
  phoneHref: "tel:+79045246108",
  telegramLabel: "@nyraflow",
  telegramHref: "https://t.me/nyraflow",
} as const;
```

For `termsDocument`, transcribe every numbered clause from the provided DOCX into its matching section. Keep section IDs `section-1` through `section-14`, preserve clause numbering inside paragraph strings, and place the document's section 15 values only in `requisites`:

```ts
requisites: [
  "Исполнитель: Шевцов Федор Дмитриевич",
  "Статус: физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход» (самозанятый)",
  "ИНН: 463309989306",
  "Сайт: https://nyraflow.ru/",
  "Email: nyraflow@yandex.ru",
  "Банковские реквизиты сообщаются в счёте, платёжной ссылке или переписке Сторон.",
]
```

For `privacyDocument`, use sections with exact IDs and titles:

```ts
const privacySectionTitles = [
  ["general", "Общие положения"],
  ["operator", "Сведения об Операторе"],
  ["principles", "Принципы обработки персональных данных"],
  ["data", "Категории субъектов и состав данных"],
  ["purposes", "Цели и правовые основания обработки"],
  ["operations", "Порядок и способы обработки"],
  ["transfer", "Передача и поручение обработки"],
  ["storage", "Сроки хранения и уничтожение"],
  ["security", "Защита персональных данных"],
  ["rights", "Права субъекта персональных данных"],
  ["requests", "Обращения и отзыв согласия"],
  ["changes", "Изменение Политики"],
] as const;
```

The body must state that the current website form is inactive; when activated it may collect name, chosen contact channel and message solely to answer a request, prepare an offer, conclude/perform a contract and satisfy legal duties. Requests and consent withdrawal go to `nyraflow@yandex.ru`. Do not claim cookies, analytics, advertising or mailing integrations that are absent from the repository.

- [ ] **Step 4: Run the content test and verify GREEN**

Run: `npm test -- tests/legal-content.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the content contract**

```bash
git add content/legal.ts tests/legal-content.test.ts
git commit -m "feat: add Nyraflow legal content"
```

---

### Task 2: Общий шаблон и две route-страницы

**Files:**
- Create: `tests/legal-pages.test.ts`
- Create: `components/legal/LegalDocumentPage.tsx`
- Create: `app/terms/page.tsx`
- Create: `app/privacy/page.tsx`

**Interfaces:**
- Consumes: `LegalDocument`, `termsDocument`, `privacyDocument` from `content/legal.ts`.
- Produces: `LegalDocumentPage({ document }: { document: LegalDocument })`, `/terms`, `/privacy`, route-level `metadata`.

- [ ] **Step 1: Write failing render and metadata tests**

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyPage, { metadata as privacyMetadata } from "../app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "../app/terms/page";

describe("legal pages", () => {
  it("renders the offer as fourteen addressable sections", () => {
    const markup = renderToStaticMarkup(createElement(TermsPage));

    expect(markup).toContain("Договор-оферта");
    expect(markup.match(/<section id="section-\d+"/g)).toHaveLength(14);
    expect(markup).toContain("Сведения и реквизиты Исполнителя");
    expect(markup).toContain("ИНН: 463309989306");
    expect(markup).toContain('href="/privacy"');
  });

  it("renders the self-employed privacy policy", () => {
    const markup = renderToStaticMarkup(createElement(PrivacyPage));

    expect(markup).toContain("Политика обработки персональных данных");
    expect(markup).toContain("Налог на профессиональный доход");
    expect(markup).toContain("nyraflow@yandex.ru");
    expect(markup).toContain('href="/terms"');
  });

  it("sets unique Russian metadata", () => {
    expect(termsMetadata.title).toBe("Договор-оферта — nyraflow");
    expect(privacyMetadata.title).toBe(
      "Политика обработки персональных данных — nyraflow",
    );
    expect(termsMetadata.description).not.toBe(privacyMetadata.description);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/legal-pages.test.ts`

Expected: FAIL because both routes and the shared component are missing.

- [ ] **Step 3: Implement the shared server component**

`LegalDocumentPage` must render:

```tsx
<>
  <main className="legal-page">
    <header className="legal-hero">...</header>
    <div className="legal-layout">
      <nav aria-label="Содержание документа">...</nav>
      <article className="legal-document">
        {document.sections.map((section, index) => (
          <section key={section.id} id={section.id} className="legal-section scroll-mt-8">
            <p aria-hidden="true">{String(index + 1).padStart(2, "0")}</p>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  </main>
  <SiteFooter />
</>
```

The actual markup must include a `nyraflow` home link, a `/` return link, date of revision, anchor table of contents, optional requisites block, and cross-link to the other legal document. Keep it a Server Component with no `use client`.

- [ ] **Step 4: Add both route pages and metadata**

```tsx
import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { termsDocument } from "@/content/legal";

export const metadata: Metadata = {
  title: "Договор-оферта — nyraflow",
  description: "Условия оказания услуг и выполнения работ Nyraflow.",
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
```

Create the privacy route with `privacyDocument`, title `Политика обработки персональных данных — nyraflow`, and description `Порядок обработки и защиты персональных данных на сайте Nyraflow.`.

- [ ] **Step 5: Run the route tests and verify GREEN**

Run: `npm test -- tests/legal-content.test.ts tests/legal-pages.test.ts`

Expected: 6 tests PASS.

- [ ] **Step 6: Commit the pages**

```bash
git add app/terms/page.tsx app/privacy/page.tsx components/legal/LegalDocumentPage.tsx tests/legal-pages.test.ts
git commit -m "feat: add legal document pages"
```

---

### Task 3: Расширенный footer и юридическая подпись формы

**Files:**
- Modify: `tests/home-page.test.ts`
- Modify: `components/home/SiteFooter.tsx`
- Modify: `components/home/ContactSection.tsx`

**Interfaces:**
- Consumes: `legalIdentity` from `content/legal.ts`.
- Produces: общий footer с абсолютными homepage anchors и рабочими contact/legal links.

- [ ] **Step 1: Add failing home-page assertions**

Extend the footer test with:

```ts
expect(markup).toContain("nyraflow");
expect(markup).toContain("Все права защищены");
expect(markup).toContain('href="mailto:nyraflow@yandex.ru"');
expect(markup).toContain('href="tel:+79045246108"');
expect(markup).toContain('href="https://t.me/nyraflow"');
expect(markup).toContain('href="/terms"');
expect(markup).toContain('href="/privacy"');
expect(markup).toContain("ИНН 463309989306");

for (const href of ["/#work", "/#services", "/#team", "/#faq", "/#contact"]) {
  expect(markup).toContain(`href="${href}"`);
}
```

Extend the form test with:

```ts
expect(form).toContain('href="/terms"');
expect(form).toContain('href="/privacy"');
expect(form).toContain("персональных данных");
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/home-page.test.ts`

Expected: FAIL on missing brand, contacts and legal links.

- [ ] **Step 3: Implement the footer content**

Keep `SectionContainer`, create four semantic groups, and source identity values from `legalIdentity`. Use these exact link groups:

```ts
const footerLinks = [
  { label: "Работы", href: "/#work" },
  { label: "Услуги", href: "/#services" },
  { label: "Команда", href: "/#team" },
  { label: "FAQ", href: "/#faq" },
  { label: "Контакты", href: "/#contact" },
] as const;

const legalLinks = [
  { label: "Договор-оферта", href: "/terms" },
  { label: "Политика обработки персональных данных", href: "/privacy" },
] as const;
```

The footer must display `© ${new Date().getFullYear()} nyraflow.` and `Все права защищены.`. External Telegram uses `target="_blank"` and `rel="noreferrer noopener"`; phone and email remain same-tab protocol links.

- [ ] **Step 4: Add the legal note below the inert form**

Keep the existing disabled status text and add:

```tsx
<p className="mt-3 text-sm leading-relaxed text-text-secondary">
  Используя форму после подключения отправки, вы принимаете условия{" "}
  <a href="/terms">договора-оферты</a> и подтверждаете ознакомление с{" "}
  <a href="/privacy">политикой обработки персональных данных</a>.
</p>
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- tests/home-page.test.ts tests/legal-pages.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 6: Commit the integration**

```bash
git add components/home/SiteFooter.tsx components/home/ContactSection.tsx tests/home-page.test.ts
git commit -m "feat: expand footer legal information"
```

---

### Task 4: Nyraflow legal-page styling and print behavior

**Files:**
- Modify: `tests/legal-pages.test.ts`
- Modify: `app/globals.css`
- Modify: `components/legal/LegalDocumentPage.tsx`

**Interfaces:**
- Consumes: existing design tokens in `app/globals.css`.
- Produces: responsive `.legal-*` presentation and print-safe document.

- [ ] **Step 1: Add failing style-contract assertions**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const styles = readFileSync(resolve(import.meta.dirname, "../app/globals.css"), "utf8");

expect(styles).toMatch(/\.legal-layout\s*{/);
expect(styles).toMatch(/\.legal-document\s*{/);
expect(styles).toMatch(/\.legal-section\s*{/);
expect(styles).toMatch(/@media print[\s\S]*\.legal-print-hidden/);
expect(styles).toContain("var(--color-canvas)");
expect(styles).toContain("var(--color-blue)");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/legal-pages.test.ts`

Expected: FAIL because `.legal-*` and print rules do not exist.

- [ ] **Step 3: Add responsive legal styles**

Use CSS component classes backed only by current tokens:

```css
.legal-page { background: var(--color-canvas); }
.legal-layout { display: grid; gap: 3rem; }
.legal-document { min-width: 0; }
.legal-section { border-top: 1px solid var(--color-line); }

@media (min-width: 64rem) {
  .legal-layout { grid-template-columns: minmax(13rem, 0.32fr) minmax(0, 1fr); }
  .legal-toc { position: sticky; top: 2rem; align-self: start; }
}

@media print {
  .legal-print-hidden { display: none !important; }
  .legal-layout { display: block; }
  .legal-section { break-inside: avoid; }
}
```

Fill spacing, typography, colors and widths with existing Tailwind utilities in the component. Avoid gradients, glass effects, decorative blobs and new token definitions. Mark the table of contents, return controls and footer as `legal-print-hidden` where appropriate.

- [ ] **Step 4: Run style and regression tests**

Run: `npm test -- tests/legal-pages.test.ts tests/home-page.test.ts tests/foundation.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit styling**

```bash
git add app/globals.css components/legal/LegalDocumentPage.tsx tests/legal-pages.test.ts
git commit -m "style: match legal pages to Nyraflow"
```

---

### Task 5: Browser QA, regression and production build

**Files:**
- Create: `tests/e2e/legal.spec.ts`

**Interfaces:**
- Consumes: public routes `/`, `/terms`, `/privacy`.
- Produces: browser-level proof of responsive pages and working links.

- [ ] **Step 1: Add browser tests**

```ts
import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    test("renders and navigates legal documents", async ({ page }) => {
      await page.goto("/terms");
      await expect(page.getByRole("heading", { level: 1, name: "Договор-оферта" })).toBeVisible();
      await expect(page.locator("main section[id^='section-']")).toHaveCount(14);
      await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

      await page.getByRole("link", { name: "Политика обработки персональных данных" }).first().click();
      await expect(page).toHaveURL(/\/privacy$/);
      await expect(page.getByRole("heading", { level: 1, name: "Политика обработки персональных данных" })).toBeVisible();
    });
  });
}

test("footer exposes working contact protocols", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('a[href="mailto:nyraflow@yandex.ru"]')).toBeVisible();
  await expect(page.locator('a[href="tel:+79045246108"]')).toBeVisible();
  await expect(page.locator('a[href="https://t.me/nyraflow"]')).toBeVisible();
});
```

- [ ] **Step 2: Run the legal E2E suite**

Run: `npm run test:e2e -- tests/e2e/legal.spec.ts`

Expected: desktop, mobile and contact tests PASS.

- [ ] **Step 3: Run the complete verification matrix**

Run in order:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
git diff --check
```

Expected: all commands exit 0. Existing Spline wheel/navigation tests remain unchanged and pass.

- [ ] **Step 4: Inspect the untouched hero boundary**

Run:

```bash
git diff 8f897bb -- components/LockedSplineHero.tsx components/SplineWheelBridge.tsx lib/spline-navigation.ts
```

Expected: no output.

- [ ] **Step 5: Refresh the project knowledge graph**

Use `index_repository` with repository path `/Users/a1111/Documents/MyLand/.worktrees/hero-scroll-card-polish`, mode `fast`, persistence `true`, then verify `/terms`, `/privacy`, `LegalDocumentPage` and `SiteFooter` are discoverable with `search_graph`.

- [ ] **Step 6: Commit verification coverage**

```bash
git add tests/e2e/legal.spec.ts
git commit -m "test: verify legal pages and footer"
```

---

### Task 6: Preview deployment and smoke test

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: verified production build.
- Produces: Vercel preview URL for user review.

- [ ] **Step 1: Deploy the current branch**

Run: `npx vercel --yes`

Expected: command exits 0 and prints an HTTPS preview deployment URL.

- [ ] **Step 2: Smoke-test deployed routes**

Open `/`, `/terms`, and `/privacy` on the deployment URL. Verify HTTP success, visible H1, footer contacts, legal cross-links and the existing Spline hero scroll/click behavior.

- [ ] **Step 3: Report the preview**

Return the deployment link, verified routes, verification commands and the explicit note that the Spline files were untouched.

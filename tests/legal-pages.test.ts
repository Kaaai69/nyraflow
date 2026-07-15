import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyPage, { metadata as privacyMetadata } from "../app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "../app/terms/page";

const styles = readFileSync(
  resolve(import.meta.dirname, "../app/globals.css"),
  "utf8",
);

const getRuleBody = (source: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`(?:^|[{}])\\s*${escapedSelector}\\s*\\{([^}]*)\\}`),
  );

  expect(match, `Expected ${selector} rule`).not.toBeNull();
  return match?.[1] ?? "";
};

describe("legal pages", () => {
  it("renders the offer as fourteen addressable sections", () => {
    const markup = renderToStaticMarkup(createElement(TermsPage));

    expect(markup).toContain("Договор-оферта");
    expect(markup.match(/<section id="section-\d+"/g)).toHaveLength(14);
    expect(markup).toContain("Сведения и реквизиты Исполнителя");
    expect(markup).toContain("ИНН: 463309989306");
    expect(markup).toContain('href="/privacy"');

    const introductionIndex = markup.indexOf(
      "Физическое лицо Шевцов Федор Дмитриевич, ИНН 463309989306",
    );
    const contentsIndex = markup.indexOf('aria-label="Содержание документа"');
    const firstSectionIndex = markup.indexOf('<section id="section-1"');

    expect(introductionIndex).toBeGreaterThan(-1);
    expect(introductionIndex).toBeLessThan(contentsIndex);
    expect(introductionIndex).toBeLessThan(firstSectionIndex);
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

  it("defines the responsive and print-safe legal page style contract", () => {
    const desktopStart = styles.indexOf("@media (min-width: 64rem)");
    const printStart = styles.indexOf("@media print", desktopStart);
    const desktopStyles = styles.slice(desktopStart, printStart);
    const printStyles = styles.slice(printStart);

    expect(desktopStart).toBeGreaterThan(-1);
    expect(printStart).toBeGreaterThan(desktopStart);
    expect(getRuleBody(desktopStyles, ".legal-layout")).toContain(
      "grid-template-columns: minmax(13rem, 0.32fr) minmax(0, 1fr);",
    );

    const desktopToc = getRuleBody(desktopStyles, ".legal-toc");
    expect(desktopToc).toContain("position: sticky;");
    expect(desktopToc).toContain("top: 2rem;");
    expect(desktopToc).toContain("max-height: calc(100vh - 4rem);");
    expect(desktopToc).toContain("overflow-y: auto;");

    expect(getRuleBody(printStyles, ".legal-print-hidden")).toContain(
      "display: none !important;",
    );
    expect(getRuleBody(printStyles, ".legal-layout")).toContain(
      "display: block;",
    );
    expect(getRuleBody(printStyles, ".legal-section")).toContain(
      "break-inside: avoid;",
    );
    expect(styles).toContain("var(--color-canvas)");
    expect(styles).toContain("var(--color-blue)");
  });

  it("keeps supporting legal-page navigation and footer out of print", () => {
    const markup = renderToStaticMarkup(createElement(TermsPage));

    expect(markup).toMatch(
      /<nav(?=[^>]*aria-label="Навигация по сайту")(?=[^>]*legal-print-hidden)[^>]*>/,
    );
    expect(markup).toMatch(
      /<nav(?=[^>]*aria-label="Содержание документа")(?=[^>]*legal-print-hidden)[^>]*>/,
    );
    expect(markup).toMatch(
      /<div[^>]*class="[^"]*legal-print-hidden[^"]*"[^>]*><footer/,
    );
  });
});

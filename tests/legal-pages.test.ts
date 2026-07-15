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

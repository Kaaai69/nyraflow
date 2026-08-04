import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ContactSection from "../components/home/ContactSection";

describe("contact preview", () => {
  it("keeps the form visibly local without offering a network submission", () => {
    const markup = renderToStaticMarkup(createElement(ContactSection));

    expect(markup).toContain('data-preview="true"');
    expect(markup).toContain('type="button"');
    expect(markup).not.toContain('type="submit"');
    expect(markup).toContain(
      "Форма работает в режиме предпросмотра. Отправка будет подключена после согласования.",
    );
    expect(markup).not.toContain("Заявка отправлена");
  });
});

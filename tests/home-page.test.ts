import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

async function renderPageAfterHero() {
  const { default: HomeSections } = await import("../components/HomeSections");
  const { default: SiteFooter } = await import("../components/home/SiteFooter");

  return renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(HomeSections),
      createElement(SiteFooter),
    ),
  );
}

describe("home page sections", () => {
  it("preserves the current section order, including benefits", async () => {
    const markup = await renderPageAfterHero();
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
      "benefits",
      "contact",
    ];
    const positions = ids.map((id) => markup.indexOf(`id="${id}"`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(markup.indexOf("<footer")).toBeGreaterThan(positions.at(-1) ?? -1);
  });

  it("renders all current primary headings without rewriting copy", async () => {
    const markup = await renderPageAfterHero();
    const headings = [
      "Прямой контакт с командой",
      "Один процесс от идеи до запуска",
      "Основа для развития",
      "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
      "Концепты, которые можно посмотреть.",
      "Быстрый старт",
      "Форматы работы и стоимость",
      "Собираем продукт вокруг бизнес-задачи.",
      "Три человека. Одна ответственность за результат.",
      "Этапы разработки",
      "Почему с нами безопасно и выгодно работать",
      "Обсудим, какой продукт нужен вашему бизнесу.",
    ];

    headings.forEach((heading) => expect(markup).toContain(heading));
  });

  it("uses distinct editorial layout families instead of repeated equal cards", async () => {
    const markup = await renderPageAfterHero();

    for (const className of [
      "credibility-grid",
      "problem-layout",
      "metrics-grid",
      "work-grid",
      "starter-grid",
      "pricing-grid",
      "services-list",
      "team-layout",
      "process-grid",
      "benefits-grid",
      "contact-shell",
    ]) {
      expect(markup).toContain(className);
    }
  });

  it("keeps published work, current team roles, FAQ, and footer contacts", async () => {
    const markup = await renderPageAfterHero();
    const workMarkup = markup.slice(
      markup.indexOf('<section id="work"'),
      markup.indexOf('<section id="starter"'),
    );

    expect(workMarkup.match(/target="_blank"/g)).toHaveLength(10);
    expect(workMarkup.match(/>Открыть проект</g)).toHaveLength(10);
    expect(workMarkup).toContain("/images/work/atelier-kitchens.jpg".replaceAll("/", "%2F"));
    expect(markup).toContain("Федор, Founder");
    expect(markup).toContain("Арсений, Co-Founder &amp; CGO");
    expect(markup).toContain("Артём, CMO");
    expect(markup.match(/<details/g)).toHaveLength(6);
    expect(markup).toContain("С чего начать, если у нас нет подробного ТЗ?");
    expect(markup).toContain('href="mailto:nyraflow@yandex.ru"');
    expect(markup).toContain('href="tel:+79045246108"');
    expect(markup).toContain("ИНН 463309989306");
  });

  it("labels process steps by their real content instead of decorative numbering", async () => {
    const markup = await renderPageAfterHero();

    expect(markup).not.toContain("process-step-number");
    expect(markup).toContain("Диагностика задачи");
    expect(markup).toContain("Запуск и рост");
  });
});

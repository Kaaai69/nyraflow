import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

async function renderHomeSections() {
  if (!existsSync(resolve(projectRoot, "components/HomeSections.tsx"))) {
    return "";
  }

  const { default: HomeSections } = await import("../components/HomeSections");

  return renderToStaticMarkup(createElement(HomeSections));
}

describe("home page sections", () => {
  it("renders the approved Russian headings and credibility statements", async () => {
    const markup = await renderHomeSections();
    const expectedCopy = [
      "Прямой контакт с командой",
      "Один процесс от идеи до запуска",
      "Основа для развития",
      "Красивого интерфейса недостаточно.",
      "Ценность не считывается сразу",
      "Путь обрывается до действия",
      "Системы не связаны",
      "Работа, которую можно проверить.",
      "Собираем продукт вокруг бизнес-задачи.",
      "Конверсионные сайты",
      "Веб-сервисы",
      "AI-автоматизации",
      "Два человека. Одна ответственность за результат.",
      "Арсений",
      "Артём",
      "Сначала смысл. Потом система. Затем запуск.",
      "Разобраться",
      "Спроектировать",
      "Собрать",
      "Запустить и проверить",
      "С чего начать, если у нас нет подробного ТЗ?",
      "Как формируются сроки и бюджет?",
      "Что произойдёт, если визуальное направление не подойдёт?",
      "Сможем ли мы обновлять продукт после запуска?",
      "Вы подключаете аналитику и внешние сервисы?",
      "Что происходит после запуска?",
      "Обсудим, какой продукт нужен вашему бизнесу.",
    ];

    for (const copy of expectedCopy) {
      expect(markup).toContain(copy);
    }
  });

  it("keeps the conversion landmarks in the approved order", async () => {
    const markup = await renderHomeSections();
    const ids = [
      "credibility",
      "problem",
      "work",
      "services",
      "team",
      "process",
      "faq",
      "contact",
    ];
    const positions = ids.map((id) => markup.indexOf(`id="${id}"`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(markup.indexOf("<footer")).toBeGreaterThan(positions.at(-1) ?? -1);
  });

  it("uses native FAQ disclosure controls", async () => {
    const markup = await renderHomeSections();

    expect(markup.match(/<details/g)).toHaveLength(6);
    expect(markup.match(/<summary/g)).toHaveLength(6);
    expect(markup).toContain("С чего начать, если у нас нет подробного ТЗ?");
    expect(markup).toContain("Что происходит после запуска?");
  });

  it("renders an inert form foundation without transmitting data", async () => {
    const markup = await renderHomeSections();
    const form = markup.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? "";

    expect(form).not.toBe("");
    expect(form).not.toMatch(/\saction=|\smethod=/);
    expect(form).toContain('type="button"');
    expect(form).toMatch(/auto[Cc]omplete="name"/);
    expect(form).toMatch(/auto[Cc]omplete="email"/);
    expect(form).toContain("Коротко о задаче");
  });

  it("exposes portfolio truth labels, team images, and footer anchors", async () => {
    const markup = await renderHomeSections();

    expect(markup.match(/>Концепт</g)).toHaveLength(2);
    const decodedMarkup = decodeURIComponent(markup);

    expect(decodedMarkup).toContain("/images/work/aura-reference.jpg");
    expect(decodedMarkup).toContain("/images/team/arseniy.jpg");
    expect(decodedMarkup).toContain("/images/team/artem.jpg");
    expect(markup).toContain('href="https://aura-developer.vercel.app/"');
    expect(markup).toContain("Открыть опубликованный проект");

    for (const href of ["#work", "#services", "#team", "#faq", "#contact"]) {
      expect(markup).toContain(`href="${href}"`);
    }
  });

  it("keeps the team collage sequential below the 768px breakpoint", async () => {
    const markup = await renderHomeSections();

    expect(markup).toContain("md:grid-cols-2");
    expect(markup).not.toContain("sm:grid-cols-2");
    expect(markup).not.toContain("sm:mt-20");
  });
});

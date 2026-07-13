import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(path: string) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

async function renderPageAfterHero() {
  if (!existsSync(resolve(projectRoot, "components/HomeSections.tsx"))) {
    return "";
  }

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

function expectExactElement(markup: string, tag: "h2" | "h3" | "summary", copy: string) {
  const escapedCopy = copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  expect(markup).toMatch(new RegExp(`<${tag}[^>]*>${escapedCopy}</${tag}>`));
}

describe("home page sections", () => {
  it("renders every approved heading with its semantic heading level", async () => {
    const markup = await renderPageAfterHero();
    const expectedH2 = [
      "Прямой контакт с командой",
      "Один процесс от идеи до запуска",
      "Основа для развития",
      "Красивого интерфейса недостаточно.",
      "Работа, которую можно проверить.",
      "Собираем продукт вокруг бизнес-задачи.",
      "Два человека. Одна ответственность за результат.",
      "Сначала смысл. Потом система. Затем запуск.",
      "Обсудим, какой продукт нужен вашему бизнесу.",
    ];
    const expectedH3 = [
      "Ценность не считывается сразу",
      "Путь обрывается до действия",
      "Системы не связаны",
      "Конверсионные сайты",
      "Веб-сервисы",
      "AI-автоматизации",
      "Арсений",
      "Артём",
      "Разобраться",
      "Спроектировать",
      "Собрать",
      "Запустить и проверить",
    ];
    const expectedSummaries = [
      "С чего начать, если у нас нет подробного ТЗ?",
      "Как формируются сроки и бюджет?",
      "Что произойдёт, если визуальное направление не подойдёт?",
      "Сможем ли мы обновлять продукт после запуска?",
      "Вы подключаете аналитику и внешние сервисы?",
      "Что происходит после запуска?",
    ];

    expectedH2.forEach((copy) => expectExactElement(markup, "h2", copy));
    expectedH3.forEach((copy) => expectExactElement(markup, "h3", copy));
    expectedSummaries.forEach((copy) =>
      expectExactElement(markup, "summary", copy),
    );
  });

  it("keeps the conversion landmarks in the approved order", async () => {
    const markup = await renderPageAfterHero();
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
    const markup = await renderPageAfterHero();

    expect(markup.match(/<details/g)).toHaveLength(6);
    expect(markup.match(/<summary/g)).toHaveLength(6);
    expect(markup).toContain("С чего начать, если у нас нет подробного ТЗ?");
    expect(markup).toContain("Что происходит после запуска?");
  });

  it("renders an inert form foundation without transmitting data", async () => {
    const markup = await renderPageAfterHero();
    const form = markup.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? "";

    expect(form).not.toBe("");
    expect(form).not.toMatch(/\saction=|\smethod=/);
    expect(form).toContain('type="button"');
    expect(form).toMatch(/auto[Cc]omplete="name"/);
    expect(form).toMatch(/auto[Cc]omplete="email"/);
    expect(form).toContain("Коротко о задаче");
  });

  it("exposes portfolio truth labels, team images, and footer anchors", async () => {
    const markup = await renderPageAfterHero();
    const workSection = readProjectFile("components/home/WorkSection.tsx");

    expect(markup.match(/>Концепт</g)).toHaveLength(2);
    const decodedMarkup = decodeURIComponent(markup);

    expect(decodedMarkup).toContain("/images/work/aura-reference.jpg");
    expect(decodedMarkup).toContain("/images/team/arseniy.jpg");
    expect(decodedMarkup).toContain("/images/team/artem.jpg");
    expect(markup).toContain('href="https://aura-developer.vercel.app/"');
    expect(markup).toContain("Открыть опубликованный проект");
    expect(workSection).not.toContain("https://aura-developer.vercel.app/");
    expect(workSection).not.toContain("Открыть опубликованный проект");
    expect(workSection).toContain("published.href");
    expect(workSection).toContain("published.cta");

    for (const href of ["#work", "#services", "#team", "#faq", "#contact"]) {
      expect(markup).toContain(`href="${href}"`);
    }
  });

  it("keeps the team collage sequential below the 768px breakpoint", async () => {
    const markup = await renderPageAfterHero();

    expect(markup).toContain("md:grid-cols-2");
    expect(markup).not.toContain("sm:grid-cols-2");
    expect(markup).not.toContain("sm:mt-20");
  });

  it("keeps HomeSections inside main and SiteFooter after main in app/page", () => {
    const page = readProjectFile("app/page.tsx");
    const sourceFile = ts.createSourceFile(
      "app/page.tsx",
      page,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let main: ts.JsxElement | undefined;
    let footerNode: ts.JsxSelfClosingElement | undefined;

    function visit(node: ts.Node) {
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(sourceFile) === "main"
      ) {
        main = node;
      }

      if (
        ts.isJsxSelfClosingElement(node) &&
        node.tagName.getText(sourceFile) === "SiteFooter"
      ) {
        footerNode = node;
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    const mainChildren = main?.children
      .filter((child) => !ts.isJsxText(child) || child.getText(sourceFile).trim())
      .map((child) => child.getText(sourceFile));

    expect(page).toContain('import SiteFooter from "@/components/home/SiteFooter";');
    expect(mainChildren).toEqual(["<LockedSplineHero />", "<HomeSections />"]);
    expect(footerNode).toBeDefined();
    expect(main && footerNode && main.end < footerNode.pos).toBe(true);
    expect(readProjectFile("components/HomeSections.tsx")).not.toContain(
      "SiteFooter",
    );
  });

  it("uses one solid focus outline and pointer-qualified service hover", () => {
    const styles = readProjectFile("app/globals.css");
    const services = readProjectFile("components/home/ServicesSection.tsx");
    const interactiveSources = [
      services,
      readProjectFile("components/home/FaqSection.tsx"),
      readProjectFile("components/home/SiteFooter.tsx"),
      readProjectFile("components/home/WorkSection.tsx"),
    ].join("\n");

    expect(styles).toContain("outline: 3px solid var(--color-blue-deep);");
    expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
    expect(styles).toMatch(
      /\.button-primary:hover\s*{[^}]*background:\s*var\(--color-blue-deep\)/,
    );
    expect(styles).not.toMatch(/\.button-primary:hover\s*{[^}]*opacity:/);
    expect(interactiveSources).not.toMatch(/focus-visible:outline-none|ring-blue\//);
    expect(services).not.toContain("group-hover:");
  });
});

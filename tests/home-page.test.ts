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

function expectExactElement(markup: string, tag: "h2" | "h3", copy: string) {
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
      "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
      "Работа, которую можно проверить.",
      "Быстрый старт",
      "Форматы работы и стоимость",
      "Собираем продукт вокруг бизнес-задачи.",
      "Три человека. Одна ответственность за результат.",
      "Этапы разработки",
      "Почему с нами безопасно и выгодно работать",
      "Обсудим, какой продукт нужен вашему бизнесу.",
    ];
    const expectedH3 = [
      "Ценность не считывается сразу",
      "Путь обрывается до действия",
      "Системы не связаны",
      "Конверсионные сайты",
      "Веб-сервисы",
      "AI-автоматизации",
      "Диагностика задачи",
      "Структура и смыслы",
      "Дизайн-концепт",
      "Разработка и интеграции",
      "Запуск и рост",
      "Глубокий маркетинг",
      "Юридическая чистота",
      "Работа до результата",
      "Помощь в дальнейшем развитии проекта",
    ];
    expectedH2.forEach((copy) => expectExactElement(markup, "h2", copy));
    expectedH3.forEach((copy) => expectExactElement(markup, "h3", copy));
  });

  it("uses the credibility surface for metrics and starter cards", () => {
    const styles = readProjectFile("app/globals.css");
    const commercialCardRule =
      styles.match(/\.commercial-card\s*{[^}]*}/)?.[0] ?? "";

    expect(commercialCardRule).toContain(
      "border: 1px solid var(--color-line);",
    );
    expect(commercialCardRule).toContain("background: var(--color-surface);");
    expect(commercialCardRule).toContain("box-shadow: var(--shadow-card);");
    expect(commercialCardRule).not.toContain("linear-gradient");
    expect(commercialCardRule).not.toContain("inset");
  });

  it("keeps the conversion landmarks in the approved order", async () => {
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

  it("renders commercial cards and their contact actions", async () => {
    const markup = await renderPageAfterHero();
    const metrics = markup.slice(
      markup.indexOf('<section id="metrics"'),
      markup.indexOf('<section id="work"'),
    );
    const starter = markup.slice(
      markup.indexOf('<section id="starter"'),
      markup.indexOf('<section id="pricing"'),
    );
    const pricing = markup.slice(
      markup.indexOf('<section id="pricing"'),
      markup.indexOf('<section id="services"'),
    );

    expect(metrics.match(/<article/g)).toHaveLength(3);
    expect(metrics).toContain("2+");
    expect(metrics).toContain("20+");
    expect(metrics).toContain("100%");
    expect(starter.match(/<article/g)).toHaveLength(4);
    expect(starter).toContain("от 30 000 ₽");
    expect(starter).toMatch(/<h2[^>]*text-blue[^>]*>Быстрый старт<\/h2>/);
    expect(pricing.match(/<article/g)).toHaveLength(3);
    expect(pricing).toContain("от 120 000 ₽");
    expect(pricing.match(/href="#contact"/g)).toHaveLength(3);
    expect(pricing.match(/>Обсудить проект</g)).toHaveLength(3);
    expect(markup).not.toContain("Калькулятор стоимости проекта");
  });

  it("renders three visually separated service panels without changing service copy", async () => {
    const markup = await renderPageAfterHero();
    const services = markup.slice(
      markup.indexOf('<section id="services"'),
      markup.indexOf('<section id="team"'),
    );

    expect(services.match(/class="[^"]*service-panel[^"]*"/g)).toHaveLength(3);
    expect(services.match(/>Когда нужны</g)).toHaveLength(3);
    expect(services.match(/>Что делаем</g)).toHaveLength(3);
    expect(services.match(/>Что получает бизнес</g)).toHaveLength(3);
    expect(services).toContain('href="#contact"');
  });

  it("renders a native FAQ baseline without client state or duplicate fallback markup", async () => {
    const markup = await renderPageAfterHero();
    const faqMarkup = markup.slice(
      markup.indexOf('<section id="faq"'),
      markup.indexOf('<section id="benefits"'),
    );
    const faqSource = readProjectFile("components/home/FaqAccordion.tsx");

    expect(faqMarkup.match(/<details/g)).toHaveLength(6);
    expect(faqMarkup.match(/<details[^>]*aria-labelledby="faq-trigger-/g)).toHaveLength(6);
    expect(faqMarkup.match(/<summary/g)).toHaveLength(6);
    expect(faqMarkup.match(/role="region"/g)).toHaveLength(6);
    expect(faqMarkup).not.toContain("<noscript>");
    expect(faqMarkup).not.toContain("faq-no-js");
    expect(faqSource).not.toContain('"use client"');
    expect(faqSource).not.toContain("useState");
    expect(faqSource).toContain('@phosphor-icons/react/ssr');
    expect(faqMarkup).toContain("С чего начать, если у нас нет подробного ТЗ?");
    expect(faqMarkup).toContain("Что происходит после запуска?");
  });

  it("renders an inert form foundation without transmitting data", async () => {
    const markup = await renderPageAfterHero();
    const form = markup.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? "";

    expect(form).not.toBe("");
    expect(form).not.toMatch(/\saction=|\smethod=/);
    expect(form).toContain('type="submit"');
    expect(form).toMatch(/auto[Cc]omplete="name"/);
    expect(form).toMatch(/auto[Cc]omplete="email"/);
    expect(form).toContain("Коротко о задаче");
    expect(form).toContain('href="/terms"');
    expect(form).toContain('href="/privacy"');
    expect(form).toContain("персональных данных");
  });

  it("presents a working contact form wired for submission", async () => {
    const markup = await renderPageAfterHero();
    const form = markup.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? "";

    // The submit button is enabled — the form posts to the contact API.
    expect(form).toMatch(
      /<button[^>]*type="submit"[^>]*aria-describedby="contact-form-status"[^>]*>/,
    );
    expect(form).not.toContain('disabled=""');
    expect(form).toContain('id="contact-form-status"');
    expect(form).toContain("Обычно отвечаем в течение рабочего дня.");
    expect(form).toContain("Обсудить проект");
  });

  it("renders ten secure published project links, team images, and footer anchors", async () => {
    const markup = await renderPageAfterHero();
    const workSection = readProjectFile("components/home/WorkSection.tsx");
    const styles = readProjectFile("app/globals.css");
    const workMarkup = markup.slice(
      markup.indexOf('<section id="work"'),
      markup.indexOf('<section id="services"'),
    );
    const workClassNames = [...workMarkup.matchAll(/class="([^"]*)"/g)].map(
      ([, className]) => className,
    );

    expect(markup).not.toContain("Концепт");
    expect(markup.match(/target="_blank"/g)).toHaveLength(11);
    expect(markup.match(/rel="noreferrer noopener"/g)).toHaveLength(11);
    expect(
      workMarkup.match(
        /<a\b[^>]*target="_blank"[^>]*rel="noreferrer noopener"[^>]*><figure(?:\s|>)/g,
      ) ?? [],
    ).toHaveLength(10);
    expect(workMarkup.match(/<\/figcaption><\/figure><\/a>/g) ?? []).toHaveLength(10);
    expect(workMarkup).not.toMatch(/<figure[^>]*><a\b/);
    expect(
      workClassNames.filter((className) =>
        className.split(/\s+/).includes("project-card"),
      ),
    ).toHaveLength(10);
    expect(
      workClassNames.filter((className) =>
        className.split(/\s+/).includes("project-card-image"),
      ),
    ).toHaveLength(10);
    expect(styles).toMatch(/\.project-card\s*{/);
    expect(styles).toMatch(/\.project-card:hover\s*{/);
    expect(styles).toMatch(/\.project-card:hover \.project-card-image\s*{/);
    const markupWithReadableImagePaths = markup.replaceAll("%2F", "/");

    expect(markupWithReadableImagePaths).toContain(
      "/images/work/atelier-kitchens.jpg",
    );
    expect(markupWithReadableImagePaths).toContain("/images/work/groom.jpg");
    expect(markupWithReadableImagePaths).toContain("/images/team/fedor.webp");
    expect(markupWithReadableImagePaths).toContain("/images/team/arseniy.jpg");
    expect(markupWithReadableImagePaths).toContain("/images/team/artem.jpg");
    expect(markup).toContain('href="https://atelier-kitchens.vercel.app"');
    expect(markup).toContain('href="https://groom-woad.vercel.app"');
    expect(markup.match(/>Открыть проект</g)).toHaveLength(10);
    expect(workSection).not.toContain("atelier-kitchens.vercel.app");
    expect(workSection).not.toContain("groom-woad.vercel.app");
    expect(workSection).toContain("project.href");
    expect(workSection).toContain("project.cta");
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
  });

  it("renders three verified team members in approved responsive cards", async () => {
    const markup = await renderPageAfterHero();
    const teamMarkup = markup.slice(
      markup.indexOf('<section id="team"'),
      markup.indexOf('<section id="process"'),
    );
    const teamSection = readProjectFile("components/home/TeamSection.tsx");

    expect(markup).toContain("Три человека. Одна ответственность за результат.");
    expect(teamMarkup).toContain("Федор, Founder");
    expect(teamMarkup).toContain("Арсений, Co-Founder &amp; CGO");
    expect(teamMarkup).toContain("Артём, CMO");
    expect(teamMarkup.indexOf("Федор")).toBeLessThan(teamMarkup.indexOf("Арсений"));
    expect(teamMarkup).not.toContain("Место для третьего фото");
    expect(teamMarkup.match(/aspect-\[4\/5\]/g)).toHaveLength(3);
    expect(teamMarkup).toContain("md:grid-cols-2");
    expect(teamMarkup).toContain("xl:grid-cols-3");
    expect(teamMarkup).not.toContain("sm:grid-cols-2");
    expect(teamMarkup).not.toContain("sm:mt-20");
    expect(teamMarkup).not.toContain("md:mt-20");
    expect(teamSection).toContain(
      "grid min-w-0 gap-8 md:grid-cols-2 lg:col-span-7 xl:grid-cols-3 xl:gap-5",
    );
    expect(teamMarkup.match(/<article class="min-w-0"/g)).toHaveLength(3);
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
    expect(page).toContain('import ResponsiveHero from "@/components/ResponsiveHero";');
    expect(mainChildren).toEqual(["<ResponsiveHero />", "<HomeSections />"]);
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
      /\.button-primary:not\(:disabled\):hover\s*{[^}]*background:\s*var\(--color-blue-deep\)/,
    );
    expect(styles).not.toMatch(
      /\.button-primary:not\(:disabled\):hover\s*{[^}]*opacity:/,
    );
    const pointerHoverStyles = styles.slice(
      styles.indexOf("@media (hover: hover) and (pointer: fine)"),
      styles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );

    expect(pointerHoverStyles).toMatch(/\.service-panel:hover\s*{/);
    expect(styles.match(/\.service-panel:hover\s*{/g)).toHaveLength(1);
    expect(interactiveSources).not.toMatch(/focus-visible:outline-none|ring-blue\//);
    expect(services).not.toContain("group-hover:");
  });

  it("defines smooth anchors and a reduced-motion fallback", () => {
    const styles = readProjectFile("app/globals.css");

    expect(styles).toMatch(/html\s*{[^}]*scroll-behavior:\s*smooth/);
    expect(styles).toMatch(
      /:where\(\s*a,\s*button,\s*summary\s*\)[^{]*{[^}]*transition:/,
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*html\s*{[^}]*scroll-behavior:\s*auto/,
    );
  });

  it("defines and uses semantic layout, type, shape, elevation, and motion tokens", () => {
    const styles = readProjectFile("app/globals.css");
    const sources = [
      readProjectFile("components/home/Layout.tsx"),
      readProjectFile("components/home/CredibilitySection.tsx"),
      readProjectFile("components/home/ProblemSection.tsx"),
      readProjectFile("components/home/WorkSection.tsx"),
      readProjectFile("components/home/ServicesSection.tsx"),
      readProjectFile("components/home/TeamSection.tsx"),
      readProjectFile("components/home/ProcessSection.tsx"),
      readProjectFile("components/home/FaqSection.tsx"),
      readProjectFile("components/home/ContactSection.tsx"),
      readProjectFile("components/home/SiteFooter.tsx"),
    ].join("\n");

    for (const token of [
      "--container-site:",
      "--spacing-gutter-mobile:",
      "--spacing-gutter-tablet:",
      "--spacing-gutter-desktop:",
      "--spacing-section-mobile:",
      "--spacing-section-desktop:",
      "--spacing-section-wide:",
      "--radius-card:",
      "--radius-media:",
      "--shadow-card:",
      "--text-display:",
      "--text-title:",
      "--text-team:",
      "--duration-fast:",
      "--duration-base:",
      "--duration-slow:",
      "--ease-premium:",
    ]) {
      expect(styles, `${token} should be declared in @theme`).toContain(token);
    }

    for (const utility of [
      "max-w-site",
      "px-gutter-mobile",
      "md:px-gutter-tablet",
      "xl:px-gutter-desktop",
      "py-section-mobile",
      "md:py-section-desktop",
      "xl:py-section-wide",
      "rounded-card",
      "rounded-media",
      "shadow-card",
      "text-display",
      "text-title",
      "text-team",
      "duration-slow",
      "ease-premium",
    ]) {
      expect(sources, `${utility} should consume a semantic token`).toContain(
        utility,
      );
    }

    expect(sources).not.toMatch(/text-\[clamp\(/);
    expect(sources).not.toMatch(/rounded-\[(20|28)px\]/);
    expect(sources).not.toContain(
      "shadow-[0_18px_50px_rgba(36,87,255,0.08)]",
    );
  });
});

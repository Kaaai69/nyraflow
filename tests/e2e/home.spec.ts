import { expect, test } from "@playwright/test";

const approvedHeadings = [
  "Прямой контакт с командой",
  "Один процесс от идеи до запуска",
  "Основа для развития",
  "Разрабатываем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
  "Работа, которую можно проверить.",
  "Собираем продукт вокруг бизнес-задачи.",
  "Три человека. Одна ответственность за результат.",
  "Сначала смысл. Потом система. Затем запуск.",
  "Обсудим, какой продукт нужен вашему бизнесу.",
] as const;

test.use({ viewport: { width: 1440, height: 900 } });

test("wheel bridge restores document scrolling when a canvas captures wheel", async ({
  page,
}) => {
  const severeBrowserErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      severeBrowserErrors.push(`console.error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    severeBrowserErrors.push(`pageerror: ${error.message}`);
  });

  await page.goto("/", { waitUntil: "load" });
  await page.waitForFunction(() => {
    const splineCanvas = document.querySelector("main > div > canvas");

    return (
      splineCanvas instanceof HTMLCanvasElement &&
      Object.keys(splineCanvas).some((key) => key.startsWith("__reactFiber$"))
    );
  });

  await page.evaluate(async () => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) throw new Error("main is missing");

    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "wheel-capturing-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
      pointerEvents: "auto",
    });
    canvas.addEventListener(
      "wheel",
      (event) => {
        canvas.dataset.wheelCaptured = "true";
        event.preventDefault();
      },
      { passive: false },
    );
    main.prepend(canvas);
    window.scrollTo(0, 0);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  });

  const canvas = page.getByTestId("wheel-capturing-canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator("main canvas").first()).toHaveAttribute(
    "data-testid",
    "wheel-capturing-canvas",
  );
  await page.mouse.move(720, 450);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.mouse.wheel(0, 700);

  await expect(canvas).toHaveAttribute("data-wheel-captured", "true");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  expect(severeBrowserErrors).toEqual([]);
});

test.describe("Spline hero navigation", () => {
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  test("routes every visible layer of the hero controls", async ({ page }) => {
    test.setTimeout(90_000);
    const severeBrowserErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        severeBrowserErrors.push(`console.error: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      severeBrowserErrors.push(`pageerror: ${error.message}`);
    });

    const controls: ReadonlyArray<{
      name: string;
      x: number;
      y: number;
      hash: string;
      staleHash?: string;
    }> = [
      { name: "Главная", x: 536, y: 24, hash: "", staleHash: "#contact" },
      { name: "О нас", x: 621, y: 24, hash: "#team" },
      { name: "Контакты", x: 725, y: 24, hash: "#contact" },
      { name: "Обсудить проект: фон", x: 100, y: 440, hash: "#contact" },
      { name: "Обсудить проект: текст", x: 215, y: 440, hash: "#contact" },
      { name: "Обсудить проект: стрелка", x: 318, y: 440, hash: "#contact" },
      { name: "Узнать больше: фон", x: 375, y: 440, hash: "#work" },
      { name: "Узнать больше: текст", x: 455, y: 440, hash: "#work" },
      { name: "Узнать больше: стрелка", x: 523, y: 440, hash: "#work" },
    ];

    for (const control of controls) {
      const response = await page.goto("/", { waitUntil: "load" });

      expect(response?.ok()).toBe(true);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => {
        const canvas = document.querySelector("main > div > canvas");

        return (
          canvas instanceof HTMLCanvasElement &&
          canvas.width > 0 &&
          canvas.height > 0 &&
          Object.keys(canvas).some((key) => key.startsWith("__reactFiber$"))
        );
      });
      await page.waitForTimeout(2_500);

      if (control.staleHash) {
        await page.evaluate((staleHash) => {
          window.history.replaceState(null, "", staleHash);
        }, control.staleHash);
      }

      await page.mouse.move(1_270, 710);
      await page.waitForTimeout(100);
      await page.mouse.move(control.x, control.y);
      await page.waitForTimeout(150);
      await page.mouse.click(control.x, control.y);

      await expect
        .poll(
          () => page.evaluate(() => window.location.hash),
          { message: `${control.name} should navigate to ${control.hash || "home"}` },
        )
        .toBe(control.hash);
    }

    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(0);
    expect(severeBrowserErrors).toEqual([]);
  });
});

test("FAQ supports Space, multiple-open state, and hides closed answers from assistive technology", async ({
  page,
}) => {
  await page.goto("/#faq", { waitUntil: "load" });
  await expect(page.locator("#faq .faq-enhanced")).toBeVisible();
  await expect(page.locator("#faq .faq-no-js")).toHaveCount(0);
  const firstQuestion = "С чего начать, если у нас нет подробного ТЗ?";
  const secondQuestion = "Как формируются сроки и бюджет?";
  const firstTrigger = page.getByRole("button", {
    name: firstQuestion,
  });
  const secondTrigger = page.getByRole("button", {
    name: secondQuestion,
  });
  const firstPanel = page.locator("#faq-panel-no-specification");
  const secondPanel = page.locator("#faq-panel-time-and-budget");
  const firstAccessiblePanel = page.getByRole("region", {
    name: firstQuestion,
  });
  const secondAccessiblePanel = page.getByRole("region", {
    name: secondQuestion,
  });

  await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(firstPanel).toHaveAttribute("aria-hidden", "true");
  await expect(firstAccessiblePanel).toHaveCount(0);

  await firstTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(firstPanel).toHaveAttribute("aria-hidden", "false");
  await expect(firstAccessiblePanel).toHaveCount(1);
  await expect(firstPanel).toContainText("Достаточно описать задачу");
  await expect(firstPanel).toHaveCSS("grid-template-rows", /.+/);

  await secondTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(secondPanel).toHaveAttribute("aria-hidden", "false");
  await expect(firstAccessiblePanel).toHaveCount(1);
  await expect(secondAccessiblePanel).toHaveCount(1);

  await firstTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(firstPanel).toHaveAttribute("aria-hidden", "true");
  await expect(firstAccessiblePanel).toHaveCount(0);
  await expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(secondPanel).toHaveAttribute("aria-hidden", "false");
  await expect(secondAccessiblePanel).toHaveCount(1);
});

test("FAQ answers remain readable and accessible when JavaScript is disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    const response = await page.goto("/#faq", { waitUntil: "load" });

    expect(response?.ok()).toBe(true);
    await expect(page.locator("#faq .faq-enhanced")).toBeHidden();
    const fallback = page.locator("#faq .faq-no-js");
    await expect(fallback).toBeVisible();
    const answers = fallback.locator("article");
    await expect(answers).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) {
      await expect(answers.nth(index)).toBeVisible();
      expect((await answers.nth(index).innerText()).trim().length).toBeGreaterThan(20);
    }
  } finally {
    await context.close();
  }
});

test("ordinary contact actions preserve the contact anchor", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.locator('#pricing a[href="#contact"]').first().click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("component motion contracts survive the global interaction defaults", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const transitionProperties = await page.evaluate(() => {
    const readTransitionProperty = (selector: string) => {
      const element = document.querySelector(selector);

      if (!(element instanceof HTMLElement)) {
        throw new Error(`${selector} is missing`);
      }

      return window.getComputedStyle(element).transitionProperty;
    };

    return {
      button: readTransitionProperty(".button-primary"),
      project: readTransitionProperty(".project-card"),
      faq: readTransitionProperty(".faq-trigger"),
    };
  });

  expect(transitionProperties).toEqual({
    button: "transform, background-color",
    project: "transform, border-color, box-shadow",
    faq: "color",
  });
});

test("project card active state overrides hover on a fine pointer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work", { waitUntil: "domcontentloaded" });
  const card = page.locator(".project-card").first();

  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).transform))
    .toContain("-4");

  const box = await card.boundingBox();
  if (!box) throw new Error("project card has no bounding box");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  try {
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element).transform))
      .toMatch(/^matrix\(0\.995, 0, 0, 0\.995, 0, 0\)$/);
  } finally {
    await page.mouse.up();
  }
});

test("mobile layout stays single-column, overflow-free, and touch accessible", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    for (const selector of [
      "#metrics article",
      "#starter article",
      "#pricing article",
      "#work .project-card",
      "#team article",
    ]) {
      const items = page.locator(selector);
      expect(await items.count()).toBeGreaterThan(1);
      const first = await items.nth(0).boundingBox();
      const second = await items.nth(1).boundingBox();

      expect(first, `${selector}: first item`).not.toBeNull();
      expect(second, `${selector}: second item`).not.toBeNull();
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
    }

    const pricingActions = page.locator("#pricing .button-primary");
    await expect(pricingActions).toHaveCount(3);
    expect(
      await pricingActions.evaluateAll((actions) =>
        actions.every((action) => {
          const element = action as HTMLElement;
          return (
            getComputedStyle(element).whiteSpace === "nowrap" &&
            element.scrollWidth <= element.clientWidth
          );
        }),
      ),
    ).toBe(true);

    const faqTrigger = page.getByRole("button", {
      name: "С чего начать, если у нас нет подробного ТЗ?",
    });
    await faqTrigger.scrollIntoViewIfNeeded();
    await expect(faqTrigger).toHaveAttribute("aria-expanded", "false");
    await faqTrigger.tap();
    await expect(faqTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#faq-panel-no-specification")).toHaveAttribute(
      "aria-hidden",
      "false",
    );

    expect(
      await page.evaluate(() => ({
        body: document.body.scrollWidth - document.body.clientWidth,
        document:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      })),
    ).toEqual({ body: 0, document: 0 });
  } finally {
    await context.close();
  }
});

test("desktop home page keeps its published content and interactions intact", async ({
  page,
}) => {
  const severeBrowserErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      severeBrowserErrors.push(`console.error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    severeBrowserErrors.push(`pageerror: ${error.message}`);
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  const expectedSectionOrder = [
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
    "contact",
  ];
  await expect(page.locator("main section[id]")).toHaveCount(
    expectedSectionOrder.length,
  );
  expect(
    await page.locator("main section[id]").evaluateAll((sections) =>
      sections.map((section) => section.id),
    ),
  ).toEqual(expectedSectionOrder);

  for (const heading of approvedHeadings) {
    const locator = page.getByRole("heading", { name: heading, exact: true });
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  for (const member of ["Арсений", "Артём"] as const) {
    const image = page.getByRole("img", { name: member, exact: true });
    const source = `/images/team/${member === "Арсений" ? "arseniy" : "artem"}.jpg`;
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    expect(decodeURIComponent((await image.getAttribute("src")) ?? "")).toContain(
      source,
    );
    await expect
      .poll(() =>
        image.evaluate(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0 &&
            element.naturalHeight > 0,
        ),
      )
      .toBe(true);
  }

  const teamHeading = page.getByRole("heading", {
    name: "Три человека. Одна ответственность за результат.",
    exact: true,
  });
  await teamHeading.scrollIntoViewIfNeeded();
  expect(
    await teamHeading.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);

  const projectLinks = page.locator(
    '#work a[target="_blank"][rel="noreferrer noopener"]',
  );
  await expect(projectLinks).toHaveCount(10);
  await expect(projectLinks.first()).toHaveAttribute(
    "href",
    "https://atelier-kitchens.vercel.app",
  );
  await expect(projectLinks.last()).toHaveAttribute(
    "href",
    "https://groom-woad.vercel.app",
  );
  await expect(page.getByText("Концепт", { exact: true })).toHaveCount(0);

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow).toEqual({ body: 0, document: 0 });

  expect(severeBrowserErrors).toEqual([]);
});

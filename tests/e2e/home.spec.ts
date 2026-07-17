import { expect, test } from "@playwright/test";

const approvedHeadings = [
  "Прямой контакт с командой",
  "Один процесс от идеи до запуска",
  "Основа для развития",
  "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
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

  const realCanvas = page.locator("main > div > canvas");
  await expect(realCanvas).toBeVisible();
  const realCanvasBox = await realCanvas.boundingBox();
  if (!realCanvasBox) throw new Error("Spline canvas box is missing");

  await page.evaluate(() =>
    window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
  );
  await page.mouse.move(
    realCanvasBox.x + realCanvasBox.width / 2,
    realCanvasBox.y + Math.min(realCanvasBox.height / 2, 700),
  );
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

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
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

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

test("trackpad bursts scroll immediately over a wheel-capturing canvas", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "load" });
  await page.waitForFunction(() => {
    const splineCanvas = document.querySelector("main > div > canvas");

    return (
      splineCanvas instanceof HTMLCanvasElement &&
      Object.keys(splineCanvas).some((key) => key.startsWith("__reactFiber$"))
    );
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      }),
  );

  const result = await page.evaluate(async () => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) throw new Error("main is missing");

    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
    });
    main.prepend(canvas);
    window.scrollTo({ top: 0, behavior: "instant" });

    let defaultPrevented = false;

    for (let index = 0; index < 10; index += 1) {
      const wheelEvent = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        composed: true,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        deltaY: 12,
      });
      canvas.dispatchEvent(wheelEvent);
      defaultPrevented ||= wheelEvent.defaultPrevented;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });

    return { defaultPrevented, scrollY: window.scrollY };
  });

  expect(result.defaultPrevented).toBe(true);
  expect(result.scrollY).toBe(120);
});

test.describe("Spline hero navigation", () => {
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  test("routes every visible layer of the hero controls", async ({ page }) => {
    test.setTimeout(180_000);
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

test("native FAQ supports Space, multiple-open state, and accessible regions with JavaScript", async ({
  page,
}) => {
  await page.goto("/#faq", { waitUntil: "load" });
  const firstQuestion = "С чего начать, если у нас нет подробного ТЗ?";
  const secondQuestion = "Как формируются сроки и бюджет?";
  const firstTrigger = page.locator("#faq summary").filter({ hasText: firstQuestion });
  const secondTrigger = page.locator("#faq summary").filter({ hasText: secondQuestion });
  const firstPanel = page.locator("#faq-panel-no-specification");
  const secondPanel = page.locator("#faq-panel-time-and-budget");
  const firstAccessiblePanel = page.getByRole("region", {
    name: firstQuestion,
  });
  const secondAccessiblePanel = page.getByRole("region", {
    name: secondQuestion,
  });
  const firstDetails = firstTrigger.locator("xpath=ancestor::details");
  const secondDetails = secondTrigger.locator("xpath=ancestor::details");

  await expect(page.locator("#faq details")).toHaveCount(6);
  await expect(page.getByRole("group", { name: firstQuestion })).toHaveCount(1);
  await expect(firstDetails).not.toHaveAttribute("open", "");
  await expect(firstAccessiblePanel).toHaveCount(0);

  await firstTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstDetails).toHaveAttribute("open", "");
  await expect(firstAccessiblePanel).toHaveCount(1);
  await expect(firstPanel).toContainText("Достаточно описать задачу");
  await expect(firstPanel).toBeVisible();

  await secondTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstDetails).toHaveAttribute("open", "");
  await expect(secondDetails).toHaveAttribute("open", "");
  await expect(firstAccessiblePanel).toHaveCount(1);
  await expect(secondAccessiblePanel).toHaveCount(1);

  await firstTrigger.focus();
  await page.keyboard.press("Space");
  await expect(firstDetails).not.toHaveAttribute("open", "");
  await expect(firstAccessiblePanel).toHaveCount(0);
  await expect(secondDetails).toHaveAttribute("open", "");
  await expect(secondAccessiblePanel).toHaveCount(1);
});

test("native FAQ remains interactive and multiple-open when JavaScript is disabled", async ({
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
    const details = page.locator("#faq details");
    const summaries = details.locator("summary");
    await expect(details).toHaveCount(6);
    await summaries.nth(0).focus();
    await page.keyboard.press("Space");
    await summaries.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(details.nth(0)).toHaveAttribute("open", "");
    await expect(details.nth(1)).toHaveAttribute("open", "");
    await expect(details.nth(0).locator('[role="region"]')).toBeVisible();
    await expect(details.nth(1).locator('[role="region"]')).toBeVisible();
  } finally {
    await context.close();
  }
});

test("native FAQ remains interactive when client JavaScript chunks are blocked", async ({
  page,
}) => {
  let blockedChunks = 0;
  await page.route(/\/_next\/static\/chunks\/.*\.js(?:\?.*)?$/, async (route) => {
    blockedChunks += 1;
    await route.abort();
  });

  const response = await page.goto("/#faq", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect.poll(() => blockedChunks).toBeGreaterThan(0);

  const details = page.locator("#faq details");
  const summaries = details.locator("summary");
  await expect(details).toHaveCount(6);
  await summaries.nth(0).click();
  await summaries.nth(1).click();
  await expect(details.nth(0)).toHaveAttribute("open", "");
  await expect(details.nth(1)).toHaveAttribute("open", "");
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

test("reduced motion shortens the native FAQ details-content transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#faq", { waitUntil: "domcontentloaded" });

  const transitionDurations = await page.locator(".faq-details").first().evaluate(
    (details) =>
      getComputedStyle(details, "::details-content")
        .transitionDuration.split(",")
        .map((duration) => {
          const value = Number.parseFloat(duration);
          return duration.trim().endsWith("ms") ? value : value * 1_000;
        }),
  );

  expect(transitionDurations.length).toBeGreaterThan(0);
  expect(transitionDurations.every((duration) => duration <= 0.01)).toBe(true);
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
  const splineRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("prod.spline.design")) {
      splineRequests.push(request.url());
    }
  });

  try {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    const hero = page.getByTestId("mobile-hero");
    await expect(hero).toBeVisible();
    await expect(page.locator("main canvas")).toHaveCount(0);
    await expect(hero.locator("img")).toHaveCount(0);
    expect(splineRequests).toEqual([]);
    await expect(page.getByRole("heading", {
      name: "Создаём digital-продукты, которые двигают бизнес вперёд",
      exact: true,
    })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Обсудить проект" })).toHaveAttribute(
      "href",
      "#contact",
    );
    await expect(hero.getByRole("link", { name: "Узнать больше" })).toHaveAttribute(
      "href",
      "#work",
    );

    const heroMetrics = await hero.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        height: rect.height,
        viewportHeight: window.visualViewport?.height ?? window.innerHeight,
        nextSectionTop:
          document
            .querySelector("main section[id]:not(#top)")
            ?.getBoundingClientRect().top ?? Infinity,
        backgroundImage: style.backgroundImage,
        overflowX: element.scrollWidth - element.clientWidth,
      };
    });
    expect(heroMetrics.height).toBeLessThan(heroMetrics.viewportHeight);
    expect(heroMetrics.nextSectionTop).toBeLessThan(heroMetrics.viewportHeight);
    expect(heroMetrics.backgroundImage).not.toBe("none");
    expect(heroMetrics.overflowX).toBe(0);

    for (const selector of [
      "#metrics article",
      "#starter article",
      "#pricing article",
      "#work .project-card",
      "#services article",
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

    const faqTrigger = page.locator("#faq summary").filter({
      hasText: "С чего начать, если у нас нет подробного ТЗ?",
    });
    const faqDetails = faqTrigger.locator("xpath=ancestor::details");
    await faqTrigger.scrollIntoViewIfNeeded();
    await expect(faqDetails).not.toHaveAttribute("open", "");
    await faqTrigger.tap();
    await expect(faqDetails).toHaveAttribute("open", "");
    await expect(page.locator("#faq-panel-no-specification")).toBeVisible();

    expect(
      await page.evaluate(() => ({
        body: document.body.scrollWidth - document.body.clientWidth,
        document:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      })),
    ).toEqual({ body: 0, document: 0 });

    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 195, y: 650, radiusX: 2, radiusY: 2, force: 1 }],
    });
    for (const y of [600, 550, 500, 450, 400, 350]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 195, y, radiusX: 2, radiusY: 2, force: 1 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(splineRequests).toEqual([]);
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

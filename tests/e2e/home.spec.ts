import { expect, test } from "@playwright/test";

const sectionOrder = [
  "top",
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
] as const;

test.describe("desktop redesign", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders an edge-to-edge scroll sequence and advances its frames", async ({
    page,
  }) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    const response = await page.goto("/", { waitUntil: "load" });
    expect(response?.ok()).toBe(true);

    const canvas = page.locator("#top canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("data-frame-count", "90");
    await expect(canvas).toHaveAttribute("data-fit", "responsive");

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeCloseTo(1440, 0);
    expect(box!.height).toBeCloseTo(900, 0);

    await page.mouse.move(1200, 700);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-frame")))
      .toBeGreaterThan(0);

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    expect(browserErrors).toEqual([]);
  });

  test("preserves the published content while keeping the preview local", async ({
    page,
  }) => {
    const contactRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/contact")) {
        contactRequests.push(request.url());
      }
    });

    await page.goto("/", { waitUntil: "load" });

    expect(
      await page.locator("main section[id]").evaluateAll((sections) =>
        sections.map((section) => section.id),
      ),
    ).toEqual(sectionOrder);

    await expect(
      page.getByRole("heading", {
        name: "Создаём digital-продукты, которые двигают бизнес вперёд",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Почему с нами безопасно и выгодно работать",
        exact: true,
      }),
    ).toHaveCount(1);

    const projects = page.locator(
      '#work a[target="_blank"][rel="noreferrer noopener"]',
    );
    await expect(projects).toHaveCount(10);

    const firstProjectImage = page.locator("#work img").first();
    await firstProjectImage.scrollIntoViewIfNeeded();
    await expect
      .poll(() => firstProjectImage.evaluate((image) => image.currentSrc))
      .toContain("q=92");

    const preview = page.locator('#contact [role="form"][data-preview="true"]');
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toBeVisible();
    const button = preview.getByRole("button", { name: "Обсудить проект" });
    await expect(button).toHaveAttribute("type", "button");
    await button.click();
    expect(contactRequests).toEqual([]);
  });
});

test("mobile keeps the same scroll animation, sharp canvas, and single-column layout", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    const response = await page.goto("/", { waitUntil: "load" });
    expect(response?.ok()).toBe(true);

    const canvas = page.locator("#top canvas");
    await expect(canvas).toBeVisible();
    const canvasMetrics = await canvas.evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      return {
        cssWidth: rect.width,
        cssHeight: rect.height,
        backingWidth: canvas.width,
        backingHeight: canvas.height,
      };
    });
    expect(canvasMetrics.cssWidth).toBeCloseTo(390, 0);
    expect(canvasMetrics.cssHeight).toBeCloseTo(844, 0);
    expect(canvasMetrics.backingWidth).toBeGreaterThanOrEqual(390);
    expect(canvasMetrics.backingHeight).toBeGreaterThanOrEqual(844);

    await page.touchscreen.tap(360, 760);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-frame")))
      .toBeGreaterThan(0);

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
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
    }

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

test("native FAQ remains accessible with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#faq", { waitUntil: "domcontentloaded" });
    const details = page.locator("#faq details");
    await expect(details).toHaveCount(6);
    await details.nth(0).locator("summary").click();
    await expect(details.nth(0)).toHaveAttribute("open", "");
  } finally {
    await context.close();
  }
});

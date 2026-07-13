import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

const approvedHeadings = [
  "Прямой контакт с командой",
  "Один процесс от идеи до запуска",
  "Основа для развития",
  "Красивого интерфейса недостаточно.",
  "Работа, которую можно проверить.",
  "Собираем продукт вокруг бизнес-задачи.",
  "Два человека. Одна ответственность за результат.",
  "Сначала смысл. Потом система. Затем запуск.",
  "Обсудим, какой продукт нужен вашему бизнесу.",
] as const;

test.use({ viewport: { width: 1440, height: 900 } });

test("desktop home page keeps its published content and interactions intact", async ({
  page,
}, testInfo) => {
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
    "work",
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

  const faqDetails = page.locator("#faq details");
  await expect(faqDetails).toHaveCount(6);
  const firstQuestion = page.getByText(
    "С чего начать, если у нас нет подробного ТЗ?",
    { exact: true },
  );
  await firstQuestion.scrollIntoViewIfNeeded();
  await firstQuestion.click();
  await expect(faqDetails.first()).toHaveAttribute("open", "");
  await expect(
    page.getByText(
      "Достаточно описать задачу, текущую ситуацию и желаемый результат. На первой встрече мы соберём недостающий контекст и предложим следующий шаг.",
      { exact: true },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Открыть опубликованный проект" }),
  ).toHaveAttribute("href", "https://aura-developer.vercel.app/");
  const conceptLabels = page.getByText("Концепт", { exact: true });
  await expect(conceptLabels).toHaveCount(2);
  await expect(conceptLabels.nth(0)).toBeVisible();
  await expect(conceptLabels.nth(1)).toBeVisible();

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow).toEqual({ body: 0, document: 0 });

  const screenshotDirectory = resolve(process.cwd(), "artifacts/ignored");
  const screenshotPath = resolve(
    screenshotDirectory,
    "home-desktop-full-page.png",
  );
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach("home-desktop-full-page", {
    path: screenshotPath,
    contentType: "image/png",
  });

  expect(severeBrowserErrors).toEqual([]);
});

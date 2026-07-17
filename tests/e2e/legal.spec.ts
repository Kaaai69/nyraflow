import { expect, test, type Page } from "@playwright/test";

const expectNoHorizontalOverflow = async (
  page: Page,
  viewport: { width: number },
) => {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual(
      expect.objectContaining({
        clientWidth: viewport.width,
        scrollWidth: viewport.width,
      }),
    );
};

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    test("renders and navigates legal documents", async ({ page }) => {
      await page.goto("/terms");
      await expect(
        page.getByRole("heading", { level: 1, name: "Договор-оферта" }),
      ).toBeVisible();
      await expect(page.locator("main section[id^='section-']")).toHaveCount(14);
      await expectNoHorizontalOverflow(page, viewport);

      await page
        .getByRole("link", {
          name: "Политика обработки персональных данных",
        })
        .first()
        .click();
      await expect(page).toHaveURL(/\/privacy$/);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Политика обработки персональных данных",
        }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport);
    });
  });
}

test("footer exposes working contact protocols", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.locator('a[href="mailto:nyraflow@yandex.ru"]'),
  ).toBeVisible();
  await expect(page.locator('a[href="tel:+79045246108"]')).toBeVisible();
  await expect(page.locator('a[href="https://t.me/nyraflow"]')).toBeVisible();
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("mobile hero", () => {
  it("renders approved semantic content and links", async () => {
    const { default: MobileHero } = await import("../components/MobileHero");
    const markup = renderToStaticMarkup(createElement(MobileHero));

    expect(markup).toContain('id="top"');
    expect(markup).toContain('data-testid="mobile-hero"');
    expect(markup).toContain("Создаём digital-продукты, которые двигают бизнес вперёд");
    expect(markup).toContain(
      "Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы в понятную систему.",
    );
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="Навигация первого экрана"');
    expect(markup).toContain('href="#top"');
    expect(markup).toContain('href="#team"');
    expect(markup).toContain('href="#contact"');
    expect(markup).toContain('href="#work"');
    expect(markup).toContain("Обсудить проект");
    expect(markup).toContain("Узнать больше");
  });

  it("keeps the mobile first screen free of the cube artwork", async () => {
    const { default: MobileHero } = await import("../components/MobileHero");
    const markup = renderToStaticMarkup(createElement(MobileHero));

    expect(markup).not.toContain("mobile-cubes.webp");
    expect(markup).not.toContain("mobile-hero-art");
    // The only image in the mobile hero is the brand logo.
    expect(markup).toContain('alt="nyraflow"');
  });

  it("uses the approved editorial hierarchy", async () => {
    const { default: MobileHero } = await import("../components/MobileHero");
    const markup = renderToStaticMarkup(createElement(MobileHero));
    const source = readFileSync(
      resolve(projectRoot, "components/MobileHero.tsx"),
      "utf8",
    );
    const styles = readFileSync(resolve(projectRoot, "app/globals.css"), "utf8");

    expect(markup).toContain("nyraflow");
    expect(markup).toContain("mobile-hero-wordmark");
    expect(markup).toContain("mobile-hero-title");
    expect(markup).toContain("mobile-hero-secondary-action");
    expect(markup).not.toContain("button-secondary");
    expect(source).not.toContain("CaretDown");
    expect(source).not.toContain("grid-cols-2");
    expect(styles).not.toContain(".mobile-hero-art");
    expect(styles).not.toMatch(/\.mobile-hero\s*\{[\s\S]*min-height:\s*100svh/);
    expect(styles).not.toContain("width: calc(120%");
  });

  it("keeps the desktop Spline implementation lazy and unchanged", () => {
    const responsive = readFileSync(
      resolve(projectRoot, "components/ResponsiveHero.tsx"),
      "utf8",
    );
    const locked = readFileSync(
      resolve(projectRoot, "components/LockedSplineHero.tsx"),
      "utf8",
    );

    expect(responsive).toContain('matchMedia("(min-width: 768px)")');
    expect(responsive).toContain('dynamic(() => import("./LockedSplineHero")');
    expect(responsive).toContain("<MobileHero />");
    expect(responsive).toContain("<DesktopSplineHero />");
    expect(locked).toContain(
      'scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"',
    );
  });

  it("reserves the desktop hero height while the mobile branch hydrates", () => {
    const responsive = readFileSync(
      resolve(projectRoot, "components/ResponsiveHero.tsx"),
      "utf8",
    );
    const styles = readFileSync(resolve(projectRoot, "app/globals.css"), "utf8");

    expect(responsive).toContain("<>\n      <MobileHero />");
    expect(responsive).toContain('className="desktop-hero-reservation"');
    expect(responsive).toContain("aria-hidden");
    expect(responsive).toContain(
      'loading: () => <div className="desktop-hero-reservation" aria-hidden />',
    );
    expect(styles).toMatch(
      /\.desktop-hero-reservation\s*\{\s*display:\s*none;/,
    );
    expect(styles).toMatch(
      /@media \(min-width: 768px\)[\s\S]*?\.desktop-hero-reservation\s*\{[\s\S]*?display:\s*block;[\s\S]*?height:\s*100dvh;[\s\S]*?min-height:\s*100dvh;/,
    );
  });
});

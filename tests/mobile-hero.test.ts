import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { mobileHeroContent } from "../content/mobile-hero";

describe("scroll hero", () => {
  it("preserves approved hero content and navigation", async () => {
    const { default: ScrollHero } = await import("../components/ScrollHero");
    const markup = renderToStaticMarkup(createElement(ScrollHero));

    expect(markup).toContain('id="top"');
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain(mobileHeroContent.title);
    expect(markup).toContain(mobileHeroContent.description);
    expect(markup).toContain('aria-label="Навигация первого экрана"');

    for (const link of [
      mobileHeroContent.brand,
      ...mobileHeroContent.navigation,
      mobileHeroContent.primaryAction,
      mobileHeroContent.secondaryAction,
    ]) {
      expect(markup).toContain(`href="${link.href}"`);
      expect(markup).toContain(link.label);
    }
  });

  it("renders the same 90-frame scroll animation for desktop and mobile", async () => {
    const { default: ScrollHero } = await import("../components/ScrollHero");
    const markup = renderToStaticMarkup(createElement(ScrollHero));

    expect(markup).toContain('data-testid="scroll-hero"');
    expect(markup).toContain('data-frame-count="90"');
    expect(markup).toContain("--sequence-scroll-distance:1900px");
    expect(markup).toContain("--sequence-mobile-scroll-distance:1300px");
    expect(markup).toContain("<canvas");
    expect(markup).not.toContain("scene.splinecode");
  });
});

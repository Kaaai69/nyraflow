import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScrollImageSequence } from "../components/ScrollImageSequence";

describe("ScrollImageSequence", () => {
  it("renders an accessible, reusable sequence stage with reserved scroll space", () => {
    const markup = renderToStaticMarkup(
      createElement(ScrollImageSequence, {
        basePath: "/animation/tunnel",
        frameCount: 90,
        scrollDistance: 1900,
        ariaLabel: "Абстрактная пространственная форма",
        posterFrame: 0,
      }),
    );

    expect(markup).toContain("<canvas");
    expect(markup).toContain(
      'aria-label="Абстрактная пространственная форма"',
    );
    expect(markup).toContain('data-frame="0"');
    expect(markup).toContain('data-frame-count="90"');
    expect(markup).toContain("--sequence-scroll-distance:1900px");
  });
});

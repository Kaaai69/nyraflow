"use client";

import { useEffect, useState } from "react";

import { homeContent } from "../content/home";

/**
 * Horizontal band of words tracking endlessly sideways, as on the reference
 * landing.
 *
 * The list is rendered twice and the track slides exactly half its width, so
 * the second copy lands where the first began and the loop has no seam.
 *
 * The animation is held until fonts are ready. Starting earlier means the web
 * font swaps in mid-cycle, the run changes width underneath a translation
 * expressed as a percentage of that width, and the loop visibly jumps.
 *
 * Words come from the real service and starter copy rather than a hardcoded
 * list, so the band cannot drift out of sync with what the site sells.
 */
export default function Marquee() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) setReady(true);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    // Never leave the band frozen if font loading stalls.
    const fallback = window.setTimeout(start, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  const words = [
    ...homeContent.services.items.map((item) => item.title),
    ...homeContent.starter.items.map((item) => item.title),
  ];

  const run = (key: string) => (
    <div key={key} className="marquee-run" aria-hidden="true">
      {words.map((word, index) => (
        <span key={`${key}-${index}`} className="marquee-word">
          {word}
          {/* Drawn in CSS, not typed. The glyph that was here (U+2733) has an
              emoji presentation on iOS, so the system painted it as a green
              colour image. A separator must not depend on a font. */}
          <i className="marquee-sep" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" role="presentation" aria-label={words.join(", ")}>
      <div className={`marquee-track ${ready ? "is-running" : ""}`}>
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}

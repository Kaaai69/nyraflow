import { homeContent } from "../content/home";

/**
 * Horizontal band of words tracking endlessly sideways, as on the reference
 * landing.
 *
 * The list is rendered twice and the track slides exactly half its width, so
 * the second copy lands where the first began and the loop has no seam. Pure
 * CSS animation — no scroll listener, no JS per frame.
 *
 * Words come from the real service and starter copy rather than a hardcoded
 * list, so the band cannot drift out of sync with what the site sells.
 */
export default function Marquee() {
  const words = [
    ...homeContent.services.items.map((item) => item.title),
    ...homeContent.starter.items.map((item) => item.title),
  ];

  const run = (key: string) => (
    <div key={key} className="marquee-run" aria-hidden="true">
      {words.map((word, index) => (
        <span key={`${key}-${index}`} className="marquee-word">
          {word}
          <i className="marquee-sep">✳</i>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="marquee"
      role="presentation"
      aria-label={words.join(", ")}
    >
      <div className="marquee-track">
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}

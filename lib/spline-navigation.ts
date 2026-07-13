export type HeroSectionId = "work" | "contact";

const splineTargets: Readonly<Record<string, HeroSectionId>> = {
  "Rectangle 4": "contact",
  get: "work",
};

export function resolveSplineTarget(name: string) {
  return splineTargets[name] ?? null;
}

export function scrollToSection(id: HeroSectionId) {
  const section = document.getElementById(id);

  if (!section) return false;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  section.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  window.history.replaceState(null, "", `#${id}`);

  return true;
}

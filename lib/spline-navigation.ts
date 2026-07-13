export type HeroNavigationTarget = "home" | "team" | "work" | "contact";

const splineTargets: ReadonlyMap<string, HeroNavigationTarget> = new Map([
  ["Text 5", "home"],
  ["Text 6", "team"],
  ["Text 7", "contact"],
  ["Rectangle 3", "contact"],
  ["Text 4", "contact"],
  ["get", "contact"],
  ["Rectangle 4", "work"],
  ["Text 3", "work"],
  ["dis", "work"],
]);

export function resolveSplineTarget(name: string) {
  return splineTargets.get(name) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getCurrentSplineTarget(application: unknown): string | null {
  if (!isRecord(application)) return null;

  const eventManager = application.eventManager;

  if (!isRecord(eventManager)) return null;

  const handlers = eventManager.handlers;

  if (!isRecord(handlers)) return null;

  const mouseHover = handlers.MouseHover;

  if (!isRecord(mouseHover) || !Array.isArray(mouseHover._prevObjects)) {
    return null;
  }

  for (const object of mouseHover._prevObjects) {
    if (!isRecord(object) || typeof object.name !== "string") continue;

    if (resolveSplineTarget(object.name)) return object.name;
  }

  return null;
}

export function navigateToHeroTarget(target: HeroNavigationTarget) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const behavior = reduceMotion ? "auto" : "smooth";

  if (target === "home") {
    window.scrollTo({ top: 0, behavior });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    return true;
  }

  const section = document.getElementById(target);

  if (!section) return false;

  section.scrollIntoView({
    behavior,
    block: "start",
  });
  window.history.replaceState(null, "", `#${target}`);

  return true;
}

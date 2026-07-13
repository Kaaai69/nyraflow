export type HeroSectionId = "work" | "contact";

const splineTargets: ReadonlyMap<string, HeroSectionId> = new Map([
  ["Rectangle 4", "contact"],
  ["get", "work"],
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

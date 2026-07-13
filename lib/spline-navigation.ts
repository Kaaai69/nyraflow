export type HeroNavigationTarget = "home" | "team" | "work" | "contact";

const splineTargets: ReadonlyMap<string, HeroNavigationTarget> = new Map([
  ["Text 5", "home"],
  ["Text 6", "team"],
  ["Text 7", "contact"],
  ["Rectangle 2", "contact"],
  ["Text 4", "contact"],
  ["get", "contact"],
  ["Rectangle 3", "work"],
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

export function getCurrentSplineTarget(
  application: unknown,
  pointerEvent?: unknown,
): string | null {
  if (!isRecord(application)) return null;

  const eventManager = application.eventManager;

  if (!isRecord(eventManager)) return null;

  const handlers = eventManager.handlers;

  if (isRecord(handlers)) {
    const mouseHover = handlers.MouseHover;

    if (isRecord(mouseHover) && Array.isArray(mouseHover._prevObjects)) {
      for (const object of mouseHover._prevObjects) {
        if (!isRecord(object) || typeof object.name !== "string") continue;

        if (resolveSplineTarget(object.name)) return object.name;
      }
    }
  }

  const eventContext = eventManager.eventContext;

  if (!isRecord(eventContext)) return null;

  const page = eventContext.page;
  const raycaster = eventContext.raycaster;

  if (
    !isRecord(page) ||
    !Array.isArray(page.children) ||
    !isRecord(raycaster) ||
    typeof raycaster.intersectObjects !== "function"
  ) {
    return null;
  }

  let intersections: unknown;

  try {
    if (
      pointerEvent !== undefined &&
      typeof eventContext.updateRaycaster === "function"
    ) {
      eventContext.updateRaycaster.call(eventContext, pointerEvent);
    }

    intersections = raycaster.intersectObjects.call(
      raycaster,
      page.children,
      true,
    );
  } catch {
    return null;
  }

  if (!Array.isArray(intersections)) return null;

  for (const intersection of intersections) {
    if (!isRecord(intersection) || !isRecord(intersection.object)) continue;

    const name = intersection.object.name;

    if (typeof name === "string" && resolveSplineTarget(name)) return name;
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

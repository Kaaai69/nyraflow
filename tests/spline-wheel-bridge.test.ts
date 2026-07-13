import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const bridgePath = resolve(projectRoot, "components/SplineWheelBridge.tsx");

function readProjectFile(path: string) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

describe("Spline wheel bridge", () => {
  it("normalizes pixel, line, and page wheel deltas", async () => {
    expect(existsSync(bridgePath), "wheel bridge should exist").toBe(true);
    const { normalizeWheelDelta } = await import(
      "../components/SplineWheelBridge"
    );

    expect(normalizeWheelDelta(7, 0, 900)).toBe(7);
    expect(normalizeWheelDelta(7, 1, 900)).toBe(112);
    expect(normalizeWheelDelta(2, 2, 900)).toBe(1800);
  });

  it("mounts the bridge outside main without changing main children", () => {
    const page = readProjectFile("app/page.tsx");
    const mainStart = page.indexOf("<main");
    const mainEnd = page.indexOf("</main>");
    const hero = page.indexOf("<LockedSplineHero />");
    const sections = page.indexOf("<HomeSections />");
    const bridge = page.indexOf("<SplineWheelBridge />");
    const footer = page.indexOf("<SiteFooter />");

    expect(page).toContain(
      'import SplineWheelBridge from "@/components/SplineWheelBridge";',
    );
    expect(mainStart).toBeGreaterThan(-1);
    expect(hero).toBeGreaterThan(mainStart);
    expect(sections).toBeGreaterThan(hero);
    expect(mainEnd).toBeGreaterThan(sections);
    expect(bridge).toBeGreaterThan(mainEnd);
    expect(footer).toBeGreaterThan(bridge);
    expect(page.slice(mainStart, mainEnd)).not.toContain("SplineWheelBridge");
  });

  it("uses only a passive capture wheel listener and preserves the locked hero", () => {
    expect(existsSync(bridgePath), "wheel bridge should exist").toBe(true);
    const bridge = readFileSync(bridgePath, "utf8");
    const lockedHero = readProjectFile("components/LockedSplineHero.tsx");
    const lockedHeroHash = createHash("sha256")
      .update(lockedHero)
      .digest("hex");

    expect(bridge).toContain('window.addEventListener("wheel"');
    expect(bridge).toContain("capture: true");
    expect(bridge).toContain("passive: true");
    expect(bridge).toContain('window.removeEventListener("wheel"');
    expect(bridge).not.toContain('addEventListener("scroll"');
    expect(bridge).toContain("event.composedPath()");
    expect(bridge).toContain("requestAnimationFrame");
    expect(bridge).toContain("cancelAnimationFrame");
    expect(lockedHeroHash).toBe(
      "d9cac33cee550ebfa7382a0f7ba0ea69a020af16fee7704382624a33a6fa1208",
    );
  });
});

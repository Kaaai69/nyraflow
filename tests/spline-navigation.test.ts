import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const navigationModule = resolve(projectRoot, "lib/spline-navigation.ts");

async function loadNavigationAdapter() {
  expect(
    existsSync(navigationModule),
    "lib/spline-navigation.ts should exist",
  ).toBe(true);

  return import("../lib/spline-navigation");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Spline hero navigation", () => {
  it("routes the confirmed Spline object names to their sections", async () => {
    const { resolveSplineTarget } = await loadNavigationAdapter();

    expect(resolveSplineTarget("Rectangle 4")).toBe("contact");
    expect(resolveSplineTarget("get")).toBe("work");
  });

  it("ignores unknown and differently-cased object names", async () => {
    const { resolveSplineTarget } = await loadNavigationAdapter();

    expect(resolveSplineTarget("Camera")).toBeNull();
    expect(resolveSplineTarget("rectangle 4")).toBeNull();
    expect(resolveSplineTarget("Get")).toBeNull();
  });

  it("smoothly scrolls to an existing section and updates the hash", async () => {
    const { scrollToSection } = await loadNavigationAdapter();
    const scrollIntoView = vi.fn();
    const replaceState = vi.fn();

    vi.stubGlobal("document", {
      getElementById: vi.fn(() => ({ scrollIntoView })),
    });
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
      history: { replaceState },
    });

    expect(scrollToSection("work")).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(replaceState).toHaveBeenCalledWith(null, "", "#work");
  });

  it("uses immediate scrolling when reduced motion is requested", async () => {
    const { scrollToSection } = await loadNavigationAdapter();
    const scrollIntoView = vi.fn();
    const replaceState = vi.fn();

    vi.stubGlobal("document", {
      getElementById: vi.fn(() => ({ scrollIntoView })),
    });
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: true })),
      history: { replaceState },
    });

    expect(scrollToSection("contact")).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(replaceState).toHaveBeenCalledWith(null, "", "#contact");
  });

  it("does nothing when the requested section is absent", async () => {
    const { scrollToSection } = await loadNavigationAdapter();
    const replaceState = vi.fn();

    vi.stubGlobal("document", {
      getElementById: vi.fn(() => null),
    });
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
      history: { replaceState },
    });

    expect(scrollToSection("work")).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("keeps the locked scene URL and adds no HTML controls", () => {
    const heroSource = readFileSync(
      resolve(projectRoot, "components/LockedSplineHero.tsx"),
      "utf8",
    );

    expect(heroSource).toContain("xOl5brZcGdsZ7KV4/scene.splinecode");
    expect(heroSource).not.toMatch(/<button|<a\b/);
  });
});

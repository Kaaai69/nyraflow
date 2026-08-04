import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(path: string) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

describe("application foundation", () => {
  it("contains the scroll hero and complete App Router shell", () => {
    const requiredFiles = [
      "app/layout.tsx",
      "app/page.tsx",
      "app/globals.css",
      "components/ScrollHero.tsx",
      "components/ScrollImageSequence.tsx",
      "components/HomeSections.tsx",
      "components/home/SiteFooter.tsx",
    ];

    expect(
      requiredFiles.filter((path) => !existsSync(resolve(projectRoot, path))),
    ).toEqual([]);
  });

  it("locks the page to the approved premium dark palette", () => {
    const styles = readProjectFile("app/globals.css").toLowerCase();

    expect(styles).toContain("--color-canvas: #0b0c0e");
    expect(styles).toContain("--color-surface: #16181d");
    expect(styles).toContain("--color-text-primary: #f1f5f9");
    expect(styles).toContain("--color-text-secondary: #94a3b8");
    expect(styles).toContain("color-scheme: dark");
  });

  it("makes the scroll animation a full-viewport visual layer", () => {
    const styles = readProjectFile("app/globals.css")
      .toLowerCase()
      .replace(/\s+/g, " ");

    expect(styles).toContain(".scroll-sequence__canvas {");
    expect(styles).toContain("width: 100vw;");
    expect(styles).toContain("height: 100dvh;");
  });

  it("does not ship the obsolete Spline runtime", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty(
      "@splinetool/react-spline",
    );
    expect(existsSync(resolve(projectRoot, "components/LockedSplineHero.tsx"))).toBe(
      false,
    );
  });
});

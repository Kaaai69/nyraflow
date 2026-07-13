import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

function projectFile(path: string) {
  return resolve(projectRoot, path);
}

function readProjectFile(path: string) {
  const absolutePath = projectFile(path);

  expect(existsSync(absolutePath), `${path} should exist`).toBe(true);

  return readFileSync(absolutePath, "utf8");
}

describe("application foundation", () => {
  it("provides the required App Router shell", () => {
    const requiredFiles = [
      "app/layout.tsx",
      "app/globals.css",
      "app/page.tsx",
      "components/LockedSplineHero.tsx",
    ];
    const missingFiles = requiredFiles.filter(
      (path) => !existsSync(projectFile(path)),
    );

    expect(missingFiles).toEqual([]);
  });

  it("loads Tailwind CSS v4 through the global stylesheet", () => {
    const globalStyles = readProjectFile("app/globals.css");

    expect(globalStyles).toContain('@import "tailwindcss";');
  });

  it("keeps the unconfirmed working brand out of public metadata", () => {
    const layout = readProjectFile("app/layout.tsx");

    expect(layout).not.toMatch(/title:\s*["']MyLand["']/);
    expect(layout).toContain('title: "Digital-продукты для бизнеса"');
  });
});

describe("locked Spline hero", () => {
  it("uses only the protected Next.js Spline entry and exact scene URL", () => {
    const hero = readProjectFile("components/LockedSplineHero.tsx");

    expect(hero).toContain(
      'import Spline from "@splinetool/react-spline/next";',
    );
    expect(hero).toContain(
      'scene="https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode"',
    );
    expect(hero.match(/prod\.spline\.design/g)).toHaveLength(1);
  });

  it("keeps the hero isolated without an HTML or CSS overlay", () => {
    const hero = readProjectFile("components/LockedSplineHero.tsx");
    const jsxTags = [...hero.matchAll(/<\/?([A-Za-z][\w.]*)\b/g)].map(
      ([, tag]) => tag,
    );

    expect([...new Set(jsxTags)]).toEqual(["Spline"]);
    expect(hero).not.toMatch(/className=|style=|position\s*:|z-index|animation/);
  });

  it("renders the locked hero first through its isolated component", () => {
    const page = readProjectFile("app/page.tsx");
    const sourceFile = ts.createSourceFile(
      "app/page.tsx",
      page,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let main: ts.JsxElement | undefined;

    function visit(node: ts.Node) {
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(sourceFile) === "main"
      ) {
        main = node;
        return;
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    const meaningfulChildren = main?.children.filter(
      (child) => !ts.isJsxText(child) || child.getText(sourceFile).trim() !== "",
    );
    const firstChild = meaningfulChildren?.[0];

    expect(page).toContain(
      'import LockedSplineHero from "@/components/LockedSplineHero";',
    );
    expect(page).not.toContain("@splinetool/react-spline");
    expect(main).toBeDefined();
    expect(firstChild && ts.isJsxSelfClosingElement(firstChild)).toBe(true);
    expect(firstChild?.getText(sourceFile)).toBe("<LockedSplineHero />");
  });
});

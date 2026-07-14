import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";
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

  it("uses a non-passive capture wheel listener and preserves the locked hero", () => {
    expect(existsSync(bridgePath), "wheel bridge should exist").toBe(true);
    const bridge = readFileSync(bridgePath, "utf8");
    const lockedHero = readProjectFile("components/LockedSplineHero.tsx");
    const sourceFile = ts.createSourceFile(
      "components/LockedSplineHero.tsx",
      lockedHero,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const defaultExport = sourceFile.statements.find(
      (statement): statement is ts.FunctionDeclaration =>
        ts.isFunctionDeclaration(statement) &&
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
        ) === true,
    );
    const returnStatement = defaultExport?.body?.statements.find(
      ts.isReturnStatement,
    );
    let renderedExpression = returnStatement?.expression;

    while (
      renderedExpression &&
      ts.isParenthesizedExpression(renderedExpression)
    ) {
      renderedExpression = renderedExpression.expression;
    }

    expect(bridge).toContain('window.addEventListener("wheel"');
    expect(bridge).toContain("capture: true");
    expect(bridge).toContain("passive: false");
    expect(bridge).toContain("event.preventDefault()");
    expect(bridge).not.toContain("scrollYBeforeWheel");
    expect(bridge).toContain("pendingDelta += normalizeWheelDelta");
    expect(bridge).toContain(
      'window.scrollBy({ top: delta, left: 0, behavior: "instant" })',
    );
    expect(bridge).toContain('window.removeEventListener("wheel"');
    expect(bridge).not.toContain('addEventListener("scroll"');
    expect(bridge).toContain("event.composedPath()");
    expect(bridge).toContain("requestAnimationFrame");
    expect(bridge).toContain("cancelAnimationFrame");

    if (
      !renderedExpression ||
      !ts.isJsxSelfClosingElement(renderedExpression)
    ) {
      expect.fail("locked hero must directly return Spline without a wrapper");
    }

    expect(renderedExpression.tagName.getText(sourceFile)).toBe("Spline");

    const sceneAttribute = renderedExpression.attributes.properties.find(
      (property): property is ts.JsxAttribute =>
        ts.isJsxAttribute(property) &&
        property.name.getText(sourceFile) === "scene",
    );
    const attributeNames = renderedExpression.attributes.properties.map(
      (property) =>
        ts.isJsxAttribute(property)
          ? property.name.getText(sourceFile)
          : `...${property.expression.getText(sourceFile)}`,
    );

    if (
      !sceneAttribute?.initializer ||
      !ts.isStringLiteral(sceneAttribute.initializer)
    ) {
      expect.fail("locked hero scene must be an exact string literal");
    }

    expect(sceneAttribute.initializer.text).toBe(
      "https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode",
    );
    expect(attributeNames.sort()).toEqual([
      "onLoad",
      "onPointerUp",
      "scene",
    ]);
    expect(lockedHero).not.toMatch(
      /<button|<a\b|className=|style=|position\s*:|z-index|animation/,
    );
  });
});

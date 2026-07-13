import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
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

  it("ignores names inherited by ordinary JavaScript objects", async () => {
    const { resolveSplineTarget } = await loadNavigationAdapter();

    expect(resolveSplineTarget("constructor")).toBeNull();
    expect(resolveSplineTarget("toString")).toBeNull();
    expect(resolveSplineTarget("__proto__")).toBeNull();
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

  it("clears stale hover state before raycasting and when the pointer leaves", () => {
    const heroSource = readFileSync(
      resolve(projectRoot, "components/LockedSplineHero.tsx"),
      "utf8",
    );
    const sourceFile = ts.createSourceFile(
      "components/LockedSplineHero.tsx",
      heroSource,
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
    const declarations = defaultExport?.body?.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations);
    const clearTarget = declarations?.find(
      (declaration) =>
        declaration.name.getText(sourceFile) === "clearActiveTarget",
    );
    const hoverTarget = declarations?.find(
      (declaration) =>
        declaration.name.getText(sourceFile) === "handleSplineHover",
    );
    let splineElement: ts.JsxSelfClosingElement | undefined;

    function visit(node: ts.Node) {
      if (
        ts.isJsxSelfClosingElement(node) &&
        node.tagName.getText(sourceFile) === "Spline"
      ) {
        splineElement = node;
        return;
      }

      ts.forEachChild(node, visit);
    }

    if (defaultExport) visit(defaultExport);

    function eventHandler(propName: string) {
      const attribute = splineElement?.attributes.properties.find(
        (property): property is ts.JsxAttribute =>
          ts.isJsxAttribute(property) &&
          property.name.getText(sourceFile) === propName,
      );

      if (
        !attribute?.initializer ||
        !ts.isJsxExpression(attribute.initializer) ||
        !attribute.initializer.expression
      ) {
        expect.fail(`${propName} must reference a handler`);
      }

      return attribute.initializer.expression.getText(sourceFile);
    }

    if (!clearTarget?.initializer) {
      expect.fail("clearActiveTarget handler must exist");
    }

    if (!hoverTarget?.initializer) {
      expect.fail("handleSplineHover handler must exist");
    }

    expect(clearTarget.initializer.getText(sourceFile)).toContain(
      "activeTarget.current = null",
    );
    expect(hoverTarget.initializer.getText(sourceFile)).toContain(
      "activeTarget.current = event.target.name",
    );
    expect(eventHandler("onPointerMoveCapture")).toBe("clearActiveTarget");
    expect(eventHandler("onPointerLeave")).toBe("clearActiveTarget");
    expect(eventHandler("onSplineMouseHover")).toBe("handleSplineHover");
  });
});

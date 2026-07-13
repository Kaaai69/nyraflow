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
    expect(resolveSplineTarget("Text 3")).toBe("contact");
    expect(resolveSplineTarget("get")).toBe("work");
  });

  it("ignores unknown and differently-cased object names", async () => {
    const { resolveSplineTarget } = await loadNavigationAdapter();

    expect(resolveSplineTarget("Camera")).toBeNull();
    expect(resolveSplineTarget("rectangle 4")).toBeNull();
    expect(resolveSplineTarget("text 3")).toBeNull();
    expect(resolveSplineTarget("Text 4")).toBeNull();
    expect(resolveSplineTarget("Get")).toBeNull();
  });

  it("ignores names inherited by ordinary JavaScript objects", async () => {
    const { resolveSplineTarget } = await loadNavigationAdapter();

    expect(resolveSplineTarget("constructor")).toBeNull();
    expect(resolveSplineTarget("toString")).toBeNull();
    expect(resolveSplineTarget("__proto__")).toBeNull();
  });

  it("reads the current confirmed target from the runtime snapshot", async () => {
    const { getCurrentSplineTarget } = await loadNavigationAdapter();

    expect(getCurrentSplineTarget).toBeTypeOf("function");
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: {
            MouseHover: { _prevObjects: [{ name: "Rectangle 4" }] },
          },
        },
      }),
    ).toBe("Rectangle 4");
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: {
            MouseHover: { _prevObjects: [{ name: "Text 3" }] },
          },
        },
      }),
    ).toBe("Text 3");
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: {
            MouseHover: { _prevObjects: [{ name: "get" }] },
          },
        },
      }),
    ).toBe("get");
  });

  it("returns the first routable name in the current snapshot", async () => {
    const { getCurrentSplineTarget } = await loadNavigationAdapter();

    expect(getCurrentSplineTarget).toBeTypeOf("function");
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: {
            MouseHover: {
              _prevObjects: [
                { name: "Camera" },
                null,
                { name: 42 },
                { name: "get" },
                { name: "Rectangle 4" },
              ],
            },
          },
        },
      }),
    ).toBe("get");
  });

  it("returns null for empty and unknown current snapshots", async () => {
    const { getCurrentSplineTarget } = await loadNavigationAdapter();

    expect(getCurrentSplineTarget).toBeTypeOf("function");
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: { MouseHover: { _prevObjects: [] } },
        },
      }),
    ).toBeNull();
    expect(
      getCurrentSplineTarget({
        eventManager: {
          handlers: {
            MouseHover: {
              _prevObjects: [{ name: "" }, { name: "Camera" }],
            },
          },
        },
      }),
    ).toBeNull();
  });

  it("fails closed for malformed runtime snapshots", async () => {
    const { getCurrentSplineTarget } = await loadNavigationAdapter();

    expect(getCurrentSplineTarget).toBeTypeOf("function");

    const malformedSnapshots = [
      null,
      undefined,
      "runtime",
      42,
      {},
      { eventManager: null },
      { eventManager: { handlers: null } },
      { eventManager: { handlers: { MouseHover: null } } },
      {
        eventManager: {
          handlers: { MouseHover: { _prevObjects: { name: "get" } } },
        },
      },
      {
        eventManager: {
          handlers: { MouseHover: { _prevObjects: [null, {}, { name: 42 }] } },
        },
      },
    ];

    for (const snapshot of malformedSnapshots) {
      expect(getCurrentSplineTarget(snapshot)).toBeNull();
    }
  });

  it("does not persist a target after the runtime snapshot is cleared", async () => {
    const { getCurrentSplineTarget } = await loadNavigationAdapter();

    expect(getCurrentSplineTarget).toBeTypeOf("function");

    const application = {
      eventManager: {
        handlers: {
          MouseHover: { _prevObjects: [{ name: "Rectangle 4" }] },
        },
      },
    };

    expect(getCurrentSplineTarget(application)).toBe("Rectangle 4");

    application.eventManager.handlers.MouseHover._prevObjects = [];

    expect(getCurrentSplineTarget(application)).toBeNull();
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

  it("stores the loaded application and reads its current snapshot on pointer-up", () => {
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
    const appRef = declarations?.find(
      (declaration) =>
        declaration.name.getText(sourceFile) === "appRef",
    );
    const loadHandler = declarations?.find(
      (declaration) =>
        declaration.name.getText(sourceFile) === "handleLoad",
    );
    const pointerUpHandler = declarations?.find(
      (declaration) =>
        declaration.name.getText(sourceFile) === "handlePointerUp",
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

    if (!appRef?.initializer) {
      expect.fail("appRef must exist");
    }

    if (!loadHandler?.initializer) {
      expect.fail("handleLoad handler must exist");
    }

    if (!pointerUpHandler?.initializer) {
      expect.fail("handlePointerUp handler must exist");
    }

    expect(appRef.initializer.getText(sourceFile)).toContain("useRef");
    expect(loadHandler.initializer.getText(sourceFile)).toContain(
      "appRef.current = application",
    );
    const pointerUpSource = pointerUpHandler.initializer
      .getText(sourceFile)
      .replace(/\s+/g, " ");

    expect(pointerUpSource).toMatch(
      /getCurrentSplineTarget\(\s*appRef\.current\s*\)/,
    );
    expect(eventHandler("onLoad")).toBe("handleLoad");
    expect(eventHandler("onPointerUp")).toBe("handlePointerUp");
    expect(heroSource).not.toMatch(
      /nextSplineHoverTarget|onSplineMouseHover|onPointerMoveCapture/,
    );
  });
});

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

  it("generates Next.js types before a clean-checkout typecheck", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const gitignore = readProjectFile(".gitignore");

    expect(packageJson.scripts?.typecheck).toBe(
      "next typegen && tsc --noEmit",
    );
    expect(gitignore.split("\n")).toContain("next-env.d.ts");
  });
});

describe("locked Spline hero", () => {
  it("renders the exact scene through the protected default import", () => {
    const hero = readProjectFile("components/LockedSplineHero.tsx");
    const sourceFile = ts.createSourceFile(
      "components/LockedSplineHero.tsx",
      hero,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const splineImport = sourceFile.statements.find(
      (statement): statement is ts.ImportDeclaration =>
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === "@splinetool/react-spline/next",
    );
    const importedName = splineImport?.importClause?.name?.text;
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
    const shadowingDeclarations: string[] = [];

    function collectShadowingDeclarations(node: ts.Node) {
      if (ts.isIdentifier(node) && node.text === importedName) {
        const { parent } = node;
        const isBinding =
          ((ts.isParameter(parent) ||
            ts.isVariableDeclaration(parent) ||
            ts.isBindingElement(parent)) &&
            parent.name === node) ||
          (ts.isCatchClause(parent) &&
            parent.variableDeclaration?.name === node) ||
          ((ts.isFunctionDeclaration(parent) ||
            ts.isFunctionExpression(parent) ||
            ts.isClassDeclaration(parent) ||
            ts.isClassExpression(parent) ||
            ts.isEnumDeclaration(parent) ||
            ts.isModuleDeclaration(parent)) &&
            parent.name === node);

        if (isBinding) {
          shadowingDeclarations.push(node.getText(sourceFile));
        }
      }

      ts.forEachChild(node, collectShadowingDeclarations);
    }

    if (defaultExport) {
      defaultExport.parameters.forEach(collectShadowingDeclarations);
      defaultExport.body?.statements.forEach(collectShadowingDeclarations);
    }

    while (
      renderedExpression &&
      ts.isParenthesizedExpression(renderedExpression)
    ) {
      renderedExpression = renderedExpression.expression;
    }

    expect(importedName).toBe("Spline");
    expect(defaultExport).toBeDefined();
    expect(shadowingDeclarations).toEqual([]);

    if (
      !renderedExpression ||
      !ts.isJsxSelfClosingElement(renderedExpression)
    ) {
      expect.fail("default export must directly return the protected Spline");
    }

    expect(renderedExpression.tagName.getText(sourceFile)).toBe(importedName);

    const splineAttributes = renderedExpression.attributes.properties;
    const sceneAttribute = splineAttributes.find(
      (property): property is ts.JsxAttribute =>
        ts.isJsxAttribute(property) &&
        property.name.getText(sourceFile) === "scene",
    );
    const attributeNames = splineAttributes.map((property) =>
      ts.isJsxAttribute(property)
        ? property.name.getText(sourceFile)
        : `...${property.expression.getText(sourceFile)}`,
    );

    expect(attributeNames.sort()).toEqual([
      "onPointerUp",
      "onSplineMouseHover",
      "scene",
    ]);
    expect(sceneAttribute).toBeDefined();

    if (
      !sceneAttribute?.initializer ||
      !ts.isStringLiteral(sceneAttribute.initializer)
    ) {
      expect.fail("scene must be an exact string literal");
    }

    expect(sceneAttribute.initializer.text).toBe(
      "https://prod.spline.design/xOl5brZcGdsZ7KV4/scene.splinecode",
    );
  });

  it("keeps the hero isolated without an HTML or CSS overlay", () => {
    const hero = readProjectFile("components/LockedSplineHero.tsx");
    const sourceFile = ts.createSourceFile(
      "components/LockedSplineHero.tsx",
      hero,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const jsxTags: string[] = [];

    function visit(node: ts.Node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        jsxTags.push(node.tagName.getText(sourceFile));
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    expect([...new Set(jsxTags)]).toEqual(["Spline"]);
    expect(hero).not.toMatch(/<button|<a\b/);
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

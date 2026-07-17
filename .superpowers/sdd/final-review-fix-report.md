# Final review fix report

## Status

Implemented every item in `.superpowers/sdd/final-review-fix-brief.md` as one TDD package. The offer introduction is a typed, separately rendered document field; the 81 numbered offer clauses and 14 sections are unchanged. Privacy content now covers the factual technical/infrastructure scope and conditional transfers. Legal CSS and unit/E2E contracts are hardened.

## Files

- `.superpowers/sdd/final-review-fix-report.md`
- `app/globals.css`
- `components/legal/LegalDocumentPage.tsx`
- `content/legal.ts`
- `tests/e2e/legal.spec.ts`
- `tests/legal-content.test.ts`
- `tests/legal-pages.test.ts`

Explicitly excluded from the commit: pre-existing modified `.superpowers/sdd/task-1-report.md`, `.superpowers/sdd/task-2-report.md`, `.superpowers/sdd/task-3-report.md`, and untracked `.codebase-memory/`.

## TDD evidence

### RED — tests added before production changes

Command:

```bash
npm test -- tests/legal-content.test.ts tests/legal-pages.test.ts
```

Exit: `1`

Captured output:

```text
> myland@0.1.0 test
> vitest run tests/legal-content.test.ts tests/legal-pages.test.ts

 RUN  v4.1.10 /Users/a1111/Documents/MyLand/.worktrees/hero-scroll-card-polish

 ❯ tests/legal-content.test.ts (3 tests | 2 failed) 8ms
     × keeps exactly fourteen offer sections and separate requisites 4ms
     × limits the privacy policy to the approved data and purposes 3ms
 ❯ tests/legal-pages.test.ts (5 tests | 2 failed) 21ms
     × renders the offer as fourteen addressable sections 10ms
     × defines the responsive and print-safe legal page style contract 2ms

 Failed Tests 4

 FAIL  tests/legal-content.test.ts > legal content > keeps exactly fourteen offer sections and separate requisites
AssertionError: expected undefined to deeply equal [ Array(1) ]
Expected: [<exact approved offer introduction>]
Received: undefined

 FAIL  tests/legal-content.test.ts > legal content > limits the privacy policy to the approved data and purposes
AssertionError: expected policy to contain 'IP-адрес'

 FAIL  tests/legal-pages.test.ts > legal pages > renders the offer as fourteen addressable sections
AssertionError: expected -1 to be greater than -1

 FAIL  tests/legal-pages.test.ts > legal pages > defines the responsive and print-safe legal page style contract
AssertionError: expected desktop .legal-toc rule to contain 'max-height: calc(100vh - 4rem);'

 Test Files  2 failed (2)
      Tests  4 failed | 4 passed (8)
   Duration  253ms
```

The failures matched the missing production behavior: no typed/rendered introduction, no technical privacy scope, and no short-viewport TOC constraint. The already-passing assertions confirmed the existing exact offer IDs, total 81 clauses, exact requisites, and privacy IDs before any production edit.

### First post-fix run — test-helper correction

Command:

```bash
npm test -- tests/legal-content.test.ts tests/legal-pages.test.ts
```

Exit: `1`

Captured output:

```text
 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 7 passed (8)

 FAIL  tests/legal-pages.test.ts > legal pages > defines the responsive and print-safe legal page style contract
AssertionError: expected grouped print-rule body to contain 'display: block;'
```

Root cause: the new helper selected the grouped `.legal-hero, .legal-layout` print rule instead of the standalone `.legal-layout` rule. The matcher was narrowed to standalone selectors; production CSS was not changed for this failure.

### GREEN — focused unit tests

Command:

```bash
npm test -- tests/legal-content.test.ts tests/legal-pages.test.ts
```

Exit: `0`

Captured output:

```text
> myland@0.1.0 test
> vitest run tests/legal-content.test.ts tests/legal-pages.test.ts

 RUN  v4.1.10 /Users/a1111/Documents/MyLand/.worktrees/hero-scroll-card-polish

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Duration  303ms
```

### GREEN — focused E2E

Final command after correcting the helper's TypeScript annotation:

```bash
npm run test:e2e -- tests/e2e/legal.spec.ts
```

Exit: `0`

Captured output:

```text
> myland@0.1.0 test:e2e
> playwright test tests/e2e/legal.spec.ts

Running 3 tests using 1 worker

  ✓  1 [chromium] › tests/e2e/legal.spec.ts:29:9 › desktop › renders and navigates legal documents (1.3s)
  ✓  2 [chromium] › tests/e2e/legal.spec.ts:29:9 › mobile › renders and navigates legal documents (455ms)
  ✓  3 [chromium] › tests/e2e/legal.spec.ts:55:5 › footer exposes working contact protocols (398ms)

  3 passed (6.1s)
```

The desktop and mobile cases each assert exact `scrollWidth === clientWidth` on both `/terms` and `/privacy`.

## Full verification matrix

### Unit suite

Command:

```bash
npm test
```

Exit: `0`

Captured output:

```text
> myland@0.1.0 test
> vitest run

 RUN  v4.1.10 /Users/a1111/Documents/MyLand/.worktrees/hero-scroll-card-polish

 Test Files  7 passed (7)
      Tests  58 passed (58)
   Duration  1.55s
```

### Typecheck

The first typecheck correctly rejected the initial test-only inferred `Page` type:

```bash
npm run typecheck
```

Exit: `2`

```text
tests/e2e/legal.spec.ts(4,20): error TS2344: Type 'TestDetails' does not satisfy the constraint '(...args: any) => any'.
tests/e2e/legal.spec.ts(9,12): error TS2339: Property 'evaluate' does not exist on type 'never'.
tests/e2e/legal.spec.ts(35,40): error TS2345: Argument of type 'Page' is not assignable to parameter of type 'never'.
tests/e2e/legal.spec.ts(50,40): error TS2345: Argument of type 'Page' is not assignable to parameter of type 'never'.
```

After importing Playwright's official `Page` type, the exact command was rerun.

Exit: `0`

```text
> myland@0.1.0 typecheck
> next typegen && tsc --noEmit

Generating route types...
✓ Types generated successfully
```

### Production build

Command:

```bash
npm run build
```

Exit: `0`

Captured output:

```text
> myland@0.1.0 build
> next build

▲ Next.js 16.2.10 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 3.3s
  Running TypeScript ...
  Finished TypeScript in 2.5s ...
  Collecting page data using 6 workers ...
✓ Generating static pages using 6 workers (5/5) in 316ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /privacy
└ ○ /terms

○  (Static)  prerendered as static content
```

### Diff checks

Commands:

```bash
git diff --check
git diff 8f897bb -- components/LockedSplineHero.tsx components/SplineWheelBridge.tsx lib/spline-navigation.ts
```

Both exited `0` with no output. The required hero/Spline files are untouched relative to `8f897bb`.

## Self-review

- The exact approved introduction is stored as `LegalDocument.introduction`, rendered before the TOC and before `section-1`, and does not participate in section numbering.
- `termsDocument.sections` remains 14 exact IDs (`section-1` through `section-14`) and 81 total paragraph entries; the diff adds no edits within existing numbered clause arrays.
- The six requisites remain exact and separately rendered.
- Privacy additions stay inside existing sections and describe only technical request data, Vercel, `prod.spline.design`, required-law government disclosure, conditional cross-border processing, and the inactive-form recheck.
- No claims were added about cookies, analytics, advertising pixels, marketing newsletters, a working submission backend, or a Roskomnadzor registry entry.
- Desktop TOC scrolling is constrained inside the desktop media rule; print properties are asserted inside their standalone print rules.
- E2E overflow equality covers `/terms` and `/privacy` at 1440×900 and 390×844.
- No hero, Spline URL, dependency, commercial-section, or unrelated-copy change is present.

## Commit

Single scoped commit: `fix: address final legal review findings`. The final hash is reported in the handoff; a commit cannot embed its own final hash because changing this report would change that hash.

## Concerns

- Non-blocking environment warning: Next.js detects the repository and worktree lockfiles and infers `/Users/a1111/Documents/MyLand/package-lock.json` as the workspace root. This warning pre-existed the scoped legal fix; build and E2E complete successfully. Dependencies/configuration were intentionally left unchanged.
- Playwright also reports the environment-level `NO_COLOR`/`FORCE_COLOR` warning; it does not affect test results.

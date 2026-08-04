# Dark Scroll Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Spline hero with a crisp, responsive scroll-driven image sequence and restyle the complete existing site into a premium dark interface without changing its text, content order, or connecting the preview to a server.

**Architecture:** A reusable client-side `ScrollImageSequence` owns canvas rendering, progressive frame loading, GSAP ScrollTrigger progress, resize handling, reduced-motion behavior, and graceful frame failures. `ScrollHero` composes that engine with the existing brand and hero copy. Existing sections keep their content imports and order while receiving a shared dark visual system through CSS tokens and small structural class changes. The contact section remains present but is explicitly preview-only and never calls `/api/contact`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, GSAP + ScrollTrigger, Canvas 2D, Vitest, Playwright, WebP assets.

## Global Constraints

- Work only in `/Users/a1111/Documents/MyLand/.worktrees/dark-scroll-redesign` on `codex/dark-scroll-redesign`.
- Preserve every current user-facing text string, data value, section, and section order from `content/home.ts` and `HomeSections.tsx`.
- Do not call, modify, deploy, or otherwise depend on the production server during this redesign.
- Do not wire the preview contact form to `/api/contact` or any replacement backend.
- Use the 90 upscaled 1080×1080 PNG frames from `/Users/a1111/Documents/MyLand/upscayl_png_upscayl-standard-4x_2x` as the source of truth.
- Maintain source dimensions during conversion. Prefer near-lossless WebP; never resize the source frames downward.
- Render the canvas at device-pixel-ratio-aware backing resolution, cap DPR at 2, and cap the visible sequence size so 1080px source images are not excessively enlarged.
- Support desktop, tablet, and mobile scrolling. Provide a static representative frame when `prefers-reduced-motion: reduce` is active.
- Build the sequence component as a reusable primitive so a second future animation requires configuration and assets, not a rewrite.
- Keep Vercel deployment as Preview only. Do not promote to production or change DNS.

---

## Task 1: Establish regression tests for image-sequence math

**Files:**

- Create: `lib/image-sequence.ts`
- Create: `tests/image-sequence.test.ts`

### Step 1: Write the failing tests

Create `tests/image-sequence.test.ts` with exact boundary, clamping, path, and contain-fit expectations:

```ts
import { describe, expect, it } from "vitest";
import {
  frameIndexForProgress,
  frameUrl,
  getContainRect,
} from "@/lib/image-sequence";

describe("image sequence helpers", () => {
  it("maps clamped scroll progress to all available frames", () => {
    expect(frameIndexForProgress(-1, 90)).toBe(0);
    expect(frameIndexForProgress(0, 90)).toBe(0);
    expect(frameIndexForProgress(0.5, 90)).toBe(45);
    expect(frameIndexForProgress(1, 90)).toBe(89);
    expect(frameIndexForProgress(2, 90)).toBe(89);
  });

  it("builds one-based, zero-padded public frame URLs", () => {
    expect(frameUrl("/animation/tunnel", 0)).toBe(
      "/animation/tunnel/ezgif-frame-001.webp",
    );
    expect(frameUrl("/animation/tunnel/", 89)).toBe(
      "/animation/tunnel/ezgif-frame-090.webp",
    );
  });

  it("centers an image without cropping or distortion", () => {
    expect(getContainRect(1200, 800, 1080, 1080)).toEqual({
      x: 200,
      y: 0,
      width: 800,
      height: 800,
    });
  });
});
```

### Step 2: Run the test and verify it fails

Run: `npm test -- tests/image-sequence.test.ts`

Expected: FAIL because `@/lib/image-sequence` does not exist.

### Step 3: Implement the pure helpers

Create `lib/image-sequence.ts` with:

```ts
export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function frameIndexForProgress(progress: number, frameCount: number) {
  if (frameCount < 1) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(frameCount - 1, Math.floor(clamped * frameCount));
}

export function frameUrl(basePath: string, zeroBasedIndex: number) {
  const cleanBase = basePath.replace(/\/$/, "");
  const frameNumber = String(zeroBasedIndex + 1).padStart(3, "0");
  return `${cleanBase}/ezgif-frame-${frameNumber}.webp`;
}

export function getContainRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): DrawRect {
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}
```

### Step 4: Run the focused test

Run: `npm test -- tests/image-sequence.test.ts`

Expected: PASS.

### Step 5: Commit

```bash
git add lib/image-sequence.ts tests/image-sequence.test.ts
git commit -m "test: define image sequence behavior"
```

---

## Task 2: Build and visually verify the frame asset pipeline

**Files:**

- Create: `public/animation/tunnel/ezgif-frame-001.webp` through `ezgif-frame-090.webp`
- Create: `scripts/encode-scroll-frames.sh`

### Step 1: Create a deterministic encoder script

Add a script that:

- Resolves the source directory explicitly.
- Verifies exactly 90 readable PNG files.
- Creates `public/animation/tunnel`.
- Runs `cwebp -near_lossless 92 -q 94 -sharp_yuv -metadata none` for each source.
- Names outputs `ezgif-frame-001.webp` through `ezgif-frame-090.webp`.
- Fails if any output is missing or not 1080×1080.

Use `apply_patch` to create the script, then make it executable with `chmod +x scripts/encode-scroll-frames.sh`.

### Step 2: Encode all frames

Run: `./scripts/encode-scroll-frames.sh`

Expected: 90 WebP files, each 1080×1080, with no gaps.

### Step 3: Compare representative source and output frames

Run:

```bash
du -sh public/animation/tunnel
sips -g pixelWidth -g pixelHeight public/animation/tunnel/ezgif-frame-{001,045,090}.webp
```

Open source and WebP frames 001, 045, and 090 with the image viewer at original detail. Inspect the tunnel edge, grain, bright highlights, black gradients, and small colored specks. If any frame shows blur, ringing, or banding, raise near-lossless quality to 96 and re-run before proceeding.

### Step 4: Commit

```bash
git add scripts/encode-scroll-frames.sh public/animation/tunnel
git commit -m "feat: add high quality scroll sequence frames"
```

---

## Task 3: Implement the reusable canvas scroll engine

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `components/ScrollImageSequence.tsx`
- Create: `tests/scroll-image-sequence.test.ts`

### Step 1: Install the animation dependency

Run: `npm install gsap`

Expected: `gsap` appears in dependencies and the lockfile updates.

### Step 2: Write the source-contract test first

Create `tests/scroll-image-sequence.test.ts` that reads the component source and verifies the essential reusable contract:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/ScrollImageSequence.tsx", "utf8");

describe("ScrollImageSequence", () => {
  it("exposes reusable sequence configuration", () => {
    expect(source).toContain("basePath: string");
    expect(source).toContain("frameCount: number");
    expect(source).toContain("scrollDistance?: number");
  });

  it("supports crisp responsive canvas and reduced motion", () => {
    expect(source).toContain("devicePixelRatio");
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain("ScrollTrigger");
  });
});
```

### Step 3: Verify the test fails

Run: `npm test -- tests/scroll-image-sequence.test.ts`

Expected: FAIL because the component does not exist.

### Step 4: Implement `ScrollImageSequence`

Use a typed props contract:

```ts
interface ScrollImageSequenceProps {
  basePath: string;
  frameCount: number;
  scrollDistance?: number;
  className?: string;
  ariaLabel: string;
  posterFrame?: number;
}
```

Implementation requirements:

- Register `ScrollTrigger` only in the browser.
- Render a wrapper, sticky visual stage, semantic canvas label, and a small loading indicator that disappears after the priority frames are ready.
- Load poster, first, last, and nearby frames first; fill remaining frames progressively during idle time.
- Keep an array of decoded `HTMLImageElement` instances and retain the last successfully rendered frame if the requested frame has not loaded.
- Set canvas backing width/height from CSS size × `Math.min(devicePixelRatio, 2)` and draw using `getContainRect`.
- Re-render on `ResizeObserver` notifications without recreating all images.
- Use GSAP/ScrollTrigger to map pinned scroll progress to `frameIndexForProgress`.
- Use `matchMedia("(prefers-reduced-motion: reduce)")` to render only the poster frame and skip pinning.
- Clean up ScrollTrigger, GSAP context, resize observer, idle callbacks, and image callbacks on unmount.
- Do not include blur placeholders or CSS filters on the canvas.

### Step 5: Run focused tests and typecheck

Run:

```bash
npm test -- tests/image-sequence.test.ts tests/scroll-image-sequence.test.ts
npm run typecheck
```

Expected: PASS.

### Step 6: Commit

```bash
git add package.json package-lock.json components/ScrollImageSequence.tsx tests/scroll-image-sequence.test.ts
git commit -m "feat: build reusable scroll image sequence"
```

---

## Task 4: Replace the Spline hero with the cinematic scroll hero

**Files:**

- Create: `components/ScrollHero.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-hero.test.ts`
- Modify: `tests/home-page.test.ts`

### Step 1: Replace stale hero expectations with failing scroll-hero expectations

Update the hero tests to require:

- `app/page.tsx` renders `ScrollHero`.
- `ScrollHero` configures `/animation/tunnel`, 90 frames, a desktop scroll distance near 1900px, and a shorter mobile distance.
- The existing hero headline, supporting copy, navigation anchors, and contact CTA remain present.
- The source has no Spline model URL.

### Step 2: Run the focused tests and verify failure

Run: `npm test -- tests/mobile-hero.test.ts tests/home-page.test.ts`

Expected: FAIL on missing `ScrollHero` and old Spline composition.

### Step 3: Create `ScrollHero`

Compose:

- A fixed-height scroll scene with a sticky full-viewport stage.
- A restrained brand/navigation bar.
- Existing hero text positioned in the left visual zone on desktop and above/below the square animation on mobile.
- `ScrollImageSequence` as the visual focus, capped near 860 CSS pixels desktop and within the mobile viewport width.
- A subtle progress/scroll affordance and thin technical grid/ring treatment using CSS only.
- Responsive configuration determined without hydration mismatches; CSS controls layout, while a small media-query hook may choose scroll distance after mount.

The animation must remain legible behind copy without making the copy low-contrast. Do not apply blur, glow fog, or large text over the image focal point.

### Step 4: Wire the page and base hero styles

Replace `ResponsiveHero` and `SplineWheelBridge` usage in `app/page.tsx`. Add only the global variables and hero classes needed for the focused tests; the full section design system arrives in Task 6.

### Step 5: Verify

Run:

```bash
npm test -- tests/mobile-hero.test.ts tests/home-page.test.ts tests/scroll-image-sequence.test.ts
npm run typecheck
```

Expected: PASS.

### Step 6: Commit

```bash
git add components/ScrollHero.tsx app/page.tsx app/globals.css tests/mobile-hero.test.ts tests/home-page.test.ts
git commit -m "feat: replace spline with cinematic scroll hero"
```

---

## Task 5: Remove the obsolete Spline implementation

**Files:**

- Delete: `components/LockedSplineHero.tsx`
- Delete: `components/MobileHero.tsx`
- Delete: `components/ResponsiveHero.tsx`
- Delete: `components/SplineWheelBridge.tsx`
- Delete: `lib/spline-navigation.ts`
- Delete: `tests/spline-navigation.test.ts`
- Delete: `tests/spline-wheel-bridge.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

### Step 1: Confirm there are no remaining consumers

Run: `rg -n "Spline|spline-navigation|@splinetool" app components lib tests package.json`

Expected: only the obsolete files/dependency and intentional negative test assertions remain.

### Step 2: Remove files and dependency

Delete the obsolete files with `apply_patch`. Run: `npm uninstall @splinetool/react-spline`.

### Step 3: Verify dependency and source cleanup

Run:

```bash
rg -n "Spline|@splinetool" app components lib package.json || true
npm run typecheck
npm run build
```

Expected: no active Spline references; typecheck and build PASS.

### Step 4: Commit

```bash
git add -A
git commit -m "refactor: remove obsolete spline hero"
```

---

## Task 6: Apply the dark visual system across every section

**Files:**

- Modify: `app/globals.css`
- Modify: `components/home/Layout.tsx`
- Modify: `components/HomeSections.tsx`
- Modify: `components/home/CredibilitySection.tsx`
- Modify: `components/home/ProblemSection.tsx`
- Modify: `components/home/MetricsSection.tsx`
- Modify: `components/home/WorkSection.tsx`
- Modify: `components/home/StarterSection.tsx`
- Modify: `components/home/PricingSection.tsx`
- Modify: `components/home/ServicesSection.tsx`
- Modify: `components/home/TeamSection.tsx`
- Modify: `components/home/ProcessSection.tsx`
- Modify: `components/home/FaqAccordion.tsx`
- Modify: `components/home/FaqSection.tsx`
- Modify: `components/home/BenefitsSection.tsx`
- Modify: `components/home/ContactSection.tsx`
- Modify: `components/home/SiteFooter.tsx`
- Modify: `components/legal/LegalDocumentPage.tsx`
- Modify: `tests/foundation.test.ts`
- Modify: `tests/home-content.test.ts`
- Modify: `tests/home-page.test.ts`
- Modify: `tests/legal-pages.test.ts`

### Step 1: Update content-preservation and design-token tests first

Keep test expectations aligned to the current `content/home.ts`, not historic copy. Add assertions for:

- Page background `#0B0C0E`, primary text `#F1F5F9`, muted text `#94A3B8`, and surface `#16181D`.
- Every existing section heading and section ID in the current order.
- Existing prices, project count, team names/roles, FAQ copy, benefits, contact details, and legal text.
- No text mutations in `content/home.ts` or `content/legal.ts`.

Run: `npm test -- tests/foundation.test.ts tests/home-content.test.ts tests/home-page.test.ts tests/legal-pages.test.ts`

Expected: FAIL on old visual/source expectations before styling changes.

### Step 2: Implement the token layer and layout primitives

In `app/globals.css`:

- Set dark semantic variables using the approved palette.
- Keep Onest and establish a tight display scale, readable body line-height, 8px spacing rhythm, and visible focus rings.
- Add shared classes for bordered panels, editorial section labels, compact action links, responsive grids, and subtle reveal motion.
- Add fine 1px borders and gradients only for depth; avoid glassmorphism blur and stacked rounded cards.
- Add `prefers-reduced-motion` overrides for all non-essential transitions.

In `Layout.tsx`, make the section container and heading system responsive and consistent without changing semantic heading levels.

### Step 3: Restyle editorial and proof sections

Update `CredibilitySection`, `ProblemSection`, and `MetricsSection` into high-contrast editorial layouts with asymmetry, strong numeric typography, and fine dividers.

### Step 4: Restyle portfolio and commercial sections

Update `WorkSection`, `StarterSection`, `PricingSection`, and `ServicesSection` so screenshots remain crisp, packages remain scannable, and pricing/content values are unchanged. Use image `sizes`, `quality`, and aspect-ratio rules that avoid browser stretching.

### Step 5: Restyle trust and conversion sections

Update `TeamSection`, `ProcessSection`, `FaqAccordion`, `FaqSection`, `BenefitsSection`, `ContactSection`, and `SiteFooter` with consistent dark surfaces, intentional spacing, accessible controls, and a strong final composition.

### Step 6: Keep legal pages coherent

Apply the same dark tokens, typography, navigation, and footer treatment to `LegalDocumentPage` without changing legal content.

### Step 7: Verify focused tests

Run:

```bash
npm test -- tests/foundation.test.ts tests/home-content.test.ts tests/home-page.test.ts tests/legal-content.test.ts tests/legal-pages.test.ts
npm run typecheck
```

Expected: PASS.

### Step 8: Commit

```bash
git add app/globals.css components tests
git commit -m "feat: apply premium dark visual system"
```

---

## Task 7: Make the preview contact form explicitly local-only

**Files:**

- Modify: `components/home/ContactSection.tsx`
- Create: `tests/contact-preview.test.ts`

### Step 1: Write a failing safety test

Create a source-contract test that asserts:

```ts
expect(source).not.toContain('fetch("/api/contact"');
expect(source).not.toContain("Сообщение отправлено");
expect(source).toContain("preview");
```

Also assert the form keeps its inputs, labels, contact information, and CTA copy from the content source.

### Step 2: Verify failure

Run: `npm test -- tests/contact-preview.test.ts`

Expected: FAIL because the current component calls `/api/contact`.

### Step 3: Disable network submission without false success

Keep the form visually complete and interactive. On submit, prevent default, validate locally, and show a calm preview-only notice. Do not send a request and do not imply the message was delivered. Use `data-preview="true"` for an explicit testable marker.

### Step 4: Verify

Run:

```bash
npm test -- tests/contact-preview.test.ts tests/home-page.test.ts
npm run typecheck
```

Expected: PASS.

### Step 5: Commit

```bash
git add components/home/ContactSection.tsx tests/contact-preview.test.ts
git commit -m "fix: keep contact form local in preview"
```

---

## Task 8: Run complete automated verification

**Files:**

- Modify as needed only when failures reveal a regression in the approved scope.

### Step 1: Run unit/source tests

Run: `npm test`

Expected: all Vitest tests PASS; historic Spline and stale-content failures have been replaced with current behavior tests.

### Step 2: Run static checks and production build

Run:

```bash
npm run typecheck
npm run build
```

Expected: both PASS with no missing-frame, hydration, or Spline dependency errors.

### Step 3: Run Playwright

Run: `npm run test:e2e`

Expected: homepage and legal-page flows PASS at configured desktop/mobile projects. Update selectors only when the old selector targets deleted Spline markup; do not weaken content assertions.

### Step 4: Commit verification-driven corrections

```bash
git add -A
git commit -m "test: align coverage with dark scroll redesign"
```

Skip the commit if no files changed.

---

## Task 9: Perform responsive visual and sharpness QA

**Files:**

- Modify: `tests/e2e/home.spec.ts` only if a stable scroll-animation smoke test is missing.
- Create: `artifacts/visual-qa/` screenshots locally; do not commit them unless they are intentionally useful documentation.

### Step 1: Start the production-equivalent local server

Run: `npm run build && npm run start`

Expected: local site responds successfully.

### Step 2: Inspect required viewport sizes

Use the in-app browser at:

- 390×844 mobile
- 768×1024 tablet
- 1440×900 desktop
- 1728×1117 large Retina-style desktop

At each width inspect initial hero, 25%, 50%, 75%, and 100% hero scroll, then the full page and footer.

### Step 3: Check explicit quality criteria

Confirm:

- Canvas backing resolution is CSS size × capped DPR.
- Frames change smoothly and do not flash white/empty.
- The tunnel edge and center texture are sharp without block artifacts or banding.
- The image is not stretched or cropped unexpectedly.
- Mobile animation remains usable, does not trap scrolling, and keeps copy readable.
- No horizontal overflow exists.
- All focus states, FAQ buttons, links, and form controls are keyboard-visible.
- Reduced-motion mode displays a stable poster frame and normal page scrolling.

If blur appears only on oversized desktop, reduce the CSS max size rather than inventing pixels with filters. If compression artifacts appear, re-encode at near-lossless 96.

### Step 4: Add an animation smoke test

In Playwright, scroll to two hero progress positions, read a `data-frame` marker exposed by the canvas component, and assert the later value is greater. Also assert the canvas bounding box is within the viewport on mobile.

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`

Expected: PASS.

### Step 5: Commit final QA corrections

```bash
git add -A
git commit -m "fix: polish responsive scroll experience"
```

Skip the commit if no files changed.

---

## Task 10: Publish the branch and create a Vercel Preview

**Files:**

- No source changes expected unless Vercel reports a build-only issue.

### Step 1: Re-run completion verification

Run:

```bash
git status --short
npm test
npm run typecheck
npm run build
```

Expected: clean or intentionally documented worktree; all checks PASS.

### Step 2: Push the redesign branch

Run: `git push -u origin codex/dark-scroll-redesign`

Expected: branch is available on GitHub without changing the default branch.

### Step 3: Create or update a draft pull request

Open a draft PR from `codex/dark-scroll-redesign` toward the repository default branch. Summarize the server-baseline dependency, visual redesign, reusable animation architecture, local-only form behavior, and verification results.

### Step 4: Deploy Preview only

Use the Vercel project linked to the repository if available. Otherwise run `npx vercel` from the clean redesign clone and accept only a Preview deployment. Do not run `vercel --prod`.

Expected: a unique `*.vercel.app` preview URL with a successful build.

### Step 5: Smoke-test the remote preview

Open the preview at mobile and desktop widths and verify hero frames load, scrolling advances, all content is present, legal links work, and contact submission remains local-only.

### Step 6: Report handoff

Provide:

- Branch name.
- Draft PR URL.
- Vercel Preview URL.
- Test/build results.
- Asset dimensions and encoding choice.
- Confirmation that production server, production deployment, DNS, and backend were untouched.
- Note that the reusable sequence component is ready for the second animation once its frames arrive.

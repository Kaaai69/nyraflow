# Fedor Team Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Fedor as the first real member of the team section using an optimized WebP conversion of the supplied high-resolution HEIC portrait.

**Architecture:** Keep the existing data-driven team rendering intact. Extend `homeContent.team.items` with one `TeamMember`, remove the now-obsolete hard-coded placeholder, and update the existing content and static-render tests to cover member order, copy, image format, and three-card layout.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest 4, Sharp image conversion, Tailwind CSS utilities.

## Global Constraints

- The public label must be exactly `Федор, Founder & Creative director`.
- Fedor must be the first member in the rendered team order.
- The source must be `/Users/a1111/Downloads/федор.heic`.
- The browser asset must be `public/images/team/fedor.webp`.
- Preserve the existing 4:5 card ratio, centered `object-cover` crop, typography, grid, and responsive behavior.
- Do not add a new component, rendering branch, image abstraction, or unrelated refactor.

---

## File Structure

- Create `public/images/team/fedor.webp`: optimized full-resolution team portrait generated from the approved HEIC source.
- Modify `content/home.ts`: add Fedor as the first `TeamMember` data item.
- Modify `components/home/TeamSection.tsx`: remove only the obsolete hard-coded placeholder.
- Modify `tests/home-content.test.ts`: assert the three-person data order and validate the new WebP asset contract without weakening existing JPEG dimension checks.
- Modify `tests/home-page.test.ts`: assert the rendered Fedor card, first position, WebP path, and absence of placeholder copy.

---

### Task 1: Add Fedor through the existing team data flow

**Files:**
- Create: `public/images/team/fedor.webp`
- Modify: `content/home.ts:513-542`
- Modify: `components/home/TeamSection.tsx:22-44`
- Test: `tests/home-content.test.ts:8-126,201-235`
- Test: `tests/home-page.test.ts:193-271`

**Interfaces:**
- Consumes: `homeContent.team.items: readonly TeamMember[]` and the existing `Image` spread contract `{ src, alt, width, height }`.
- Produces: first item `{ id: "fedor", name: "Федор", role: "Founder & Creative director", photo: { src: "/images/team/fedor.webp", alt: "Федор", width: 2316, height: 3088 } }`.

- [ ] **Step 1: Update the data contract test to require Fedor first**

Change the team item shape in `HomeModule` so the test can assert stable IDs:

```ts
items: readonly {
  id: string;
  name: string;
  role: string;
  photo: ImageAsset;
}[];
```

Rename the team test to `defines the approved team heading and three verified members`, and replace its expected array with:

```ts
expect(
  homeContent.team.items.map(({ id, name, role }) => ({ id, name, role })),
).toEqual([
  { id: "fedor", name: "Федор", role: "Founder & Creative director" },
  { id: "arseniy", name: "Арсений", role: "Backend & Automation Engineer" },
  { id: "artem", name: "Артём", role: "Frontend & Product Developer" },
]);
```

In the asset test, require three team items and preserve JPEG dimension validation while checking the WebP container explicitly:

```ts
expect(homeContent.team.items).toHaveLength(3);

for (const media of assets) {
  const assetPath = resolve(projectRoot, `public${media.src}`);

  expect(existsSync(assetPath), `${media.src} should exist`).toBe(true);

  if (media.src.endsWith(".webp")) {
    const image = readFileSync(assetPath);

    expect(image.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(image.subarray(8, 12).toString("ascii")).toBe("WEBP");
    continue;
  }

  expect(readJpegDimensions(assetPath)).toEqual({
    width: media.width,
    height: media.height,
  });
}
```

- [ ] **Step 2: Update the rendered-page regression test**

Add the new image path to the existing asset assertions:

```ts
expect(markupWithReadableImagePaths).toContain("/images/team/fedor.webp");
```

Rename the team rendering test to `renders three verified team members in approved responsive cards` and use these assertions:

```ts
expect(teamMarkup).toContain("Федор, Founder &amp; Creative director");
expect(teamMarkup).toContain("Арсений, Backend &amp; Automation Engineer");
expect(teamMarkup).toContain("Артём, Frontend &amp; Product Developer");
expect(teamMarkup.indexOf("Федор")).toBeLessThan(teamMarkup.indexOf("Арсений"));
expect(teamMarkup).not.toContain("Место для третьего фото");
expect(teamMarkup.match(/aspect-\[4\/5\]/g)).toHaveLength(3);
expect(teamMarkup.match(/<article class="min-w-0"/g)).toHaveLength(3);
```

Keep the existing responsive-grid and spacing assertions unchanged.

- [ ] **Step 3: Run the focused tests and verify the new contract fails**

Run:

```bash
npm test -- tests/home-content.test.ts tests/home-page.test.ts
```

Expected: FAIL because Fedor is absent, `public/images/team/fedor.webp` does not exist, and the placeholder still renders.

- [ ] **Step 4: Convert the approved HEIC portrait to WebP**

Run the installed Sharp library directly, preserving the source resolution and applying EXIF orientation before encoding:

```bash
node -e 'const sharp = require("sharp"); sharp("/Users/a1111/Downloads/федор.heic").rotate().webp({ quality: 90, effort: 6 }).toFile("public/images/team/fedor.webp").then(({ width, height, size }) => console.log({ width, height, size }))'
```

Expected: the command prints `width: 2316`, `height: 3088`, a positive `size`, and creates `public/images/team/fedor.webp`.

Confirm the generated asset independently:

```bash
sips -g pixelWidth -g pixelHeight -g format public/images/team/fedor.webp
```

Expected: `pixelWidth: 2316`, `pixelHeight: 3088`, `format: webp`.

- [ ] **Step 5: Add Fedor as the first data item**

Insert this object at the beginning of `homeContent.team.items` in `content/home.ts`:

```ts
{
  id: "fedor",
  name: "Федор",
  role: "Founder & Creative director",
  photo: {
    src: "/images/team/fedor.webp",
    alt: "Федор",
    width: 2316,
    height: 3088,
  },
},
```

Do not change the two existing member objects or the team heading and description.

- [ ] **Step 6: Remove the obsolete placeholder**

Delete only this block from `components/home/TeamSection.tsx`:

```tsx
<article className="min-w-0" aria-label="Место для третьего фото">
  <div className="flex aspect-[4/5] items-end rounded-media border border-line bg-surface-blue p-6">
    <p className="text-sm font-semibold text-blue-deep">
      Место для третьего фото
    </p>
  </div>
</article>
```

Leave the existing `content.items.map`, `Image` props, 4:5 wrapper, and grid classes unchanged.

- [ ] **Step 7: Run focused tests and verify they pass**

Run:

```bash
npm test -- tests/home-content.test.ts tests/home-page.test.ts
```

Expected: both test files PASS with no failing assertions.

- [ ] **Step 8: Run repository verification**

Run:

```bash
npm run typecheck
npm run build
git diff --check
```

Expected: typecheck and production build exit successfully; `git diff --check` prints no output.

- [ ] **Step 9: Visually verify the team section**

Start the site with `npm run dev`, inspect the `#team` section at approximately 390 px and 1440 px viewport widths, and confirm:

- Fedor is the first card.
- The face remains centered within the existing 4:5 crop.
- All three names and roles are readable.
- Mobile uses one column, medium width uses two columns, and wide desktop uses three columns.
- No neutral placeholder remains.

- [ ] **Step 10: Commit the implementation**

```bash
git add public/images/team/fedor.webp content/home.ts components/home/TeamSection.tsx tests/home-content.test.ts tests/home-page.test.ts
git commit -m "feat: add Fedor to team section"
```

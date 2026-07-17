# Mobile HTML Hero Design

## Goal

Replace the broken mobile presentation of the Spline hero with a dedicated responsive HTML hero while preserving the existing desktop Spline scene unchanged.

The mobile hero must:

- contain the same message and calls to action as the current Spline scene;
- fit portrait screens without white bands or clipped text;
- allow native vertical touch scrolling from any point in the hero;
- avoid downloading or mounting the Spline runtime on mobile;
- retain Nyraflow's light-blue visual language.

## Confirmed root cause

Production was reproduced with an iPhone 13 viewport (`390 × 664`). The Spline canvas filled the viewport, but its fixed desktop composition rendered with large white regions above and below the blue scene and clipped the left-side text. A real touch swipe over the canvas left `window.scrollY` at `0` because the Spline canvas consumed the gesture. The existing wheel bridge only handles desktop `wheel` events and cannot repair touch scrolling.

This is a scene/layout mismatch rather than a page-height bug. CSS scaling of the existing canvas would trade the white bands for more clipping and would remain fragile across phones.

## Chosen approach

Introduce a responsive hero boundary with two mutually exclusive implementations:

- Below `768px`: render `MobileHero`, an HTML/CSS section.
- At `768px` and above: render the existing `LockedSplineHero` with its current scene, pointer navigation, and wheel bridge behavior.

The mobile branch must not mount `LockedSplineHero`, so the Spline runtime and scene are not requested on small screens. The desktop branch must use the current scene URL and implementation without visual or interaction changes.

## Mobile composition

The mobile first screen uses normal document content rather than canvas-rendered text.

Content, in order:

1. A compact header with the existing lowercase `nyraflow` wordmark on the left and the essential navigation on the right. The header must read as a deliberate brand element rather than a centered row floating in empty space.
2. Heading: `Создаём digital-продукты, которые двигают бизнес вперёд`.
3. Description: `Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы в понятную систему.`
4. Primary link: `Обсудить проект` → `#contact`.
5. Secondary text link: `Узнать больше` → `#work`.
6. A restrained, decorative static WebP crop of the existing blue cube composition. It sits behind the lower part of the composition and fades into the hero background instead of starting in a separate rectangular image band.

The static visual is derived from the current Nyraflow Spline scene and optimized for mobile. It contains no text or controls. The HTML heading, copy, navigation, and links remain readable, selectable, accessible, and independent of the image.

## Visual refinement approved after mobile review

The initial HTML hero fixed scrolling and Spline loading, but the production screenshot exposed a composition problem:

- the `11vw` heading scale produces a four-line block that dominates the viewport;
- the two-column action grid begins at `390px`, forcing the secondary label to wrap;
- the visual is rendered at `120%` width and begins immediately below the actions, creating a hard horizontal seam;
- the centered navigation has no branded anchor;
- the text, actions, and image compete at the same visual intensity.

The approved direction is a targeted premium editorial-tech recomposition. It preserves the desktop Spline hero, the mobile HTML architecture, all anchor targets, and the blue brand accent.

Design dials for this refinement:

- `DESIGN_VARIANCE: 6` - asymmetric but controlled;
- `MOTION_INTENSITY: 3` - static composition with tactile interaction states only;
- `VISUAL_DENSITY: 3` - generous spacing and one clear focal point.

## Layout and responsive rules

- Use `min-height: 100svh` rather than a fixed `100vh`/`100dvh` height.
- Let the section height grow naturally if content needs more room.
- Respect top and bottom safe-area insets.
- Fill the entire section with the existing light-blue/white gradient so no unstyled body background can appear inside the hero.
- Keep all text within the mobile gutter and prevent horizontal overflow.
- Keep the heading between `34px` and `40px` across the supported phone widths, with a line height near `1.02`. The image and type scale are tuned together so the long approved headline remains visually controlled rather than oversized.
- Render the primary action as the only filled pill. Render the secondary action as a single-line text link, not as a second outlined pill.
- Never allow either action label to wrap.
- Keep both actions in a compact vertical group on phone widths. Do not switch to a two-column action grid at `390px`.
- Scale the decorative visual to approximately `72-86%` of the available width. Position it lower in the hero and blend its upper edge with a CSS mask or gradient so no rectangular seam is visible.
- The decorative image uses `object-fit: contain` inside a bounded region and cannot intercept pointer or touch events.
- Remove the decorative down indicator. It adds density without explaining an interaction.
- Do not add touch listeners or simulated scrolling. Mobile scrolling stays native.

## Component boundaries

- `ResponsiveHero`: owns the media-query decision and ensures only one implementation is mounted.
- `MobileHero`: owns semantic mobile markup and styling.
- `LockedSplineHero`: remains the desktop Spline implementation.
- `SplineWheelBridge`: remains desktop-only in effect; its current behavior is not changed.

Mobile content may be stored in the existing home content module so tests can verify the approved copy and links without duplicating strings.

## Accessibility

- Use a semantic `<section>` with one `<h1>`.
- Navigation receives an accessible label.
- Both calls to action are normal links with at least a 44px touch target.
- The decorative visual is ignored by assistive technology.
- Preserve visible keyboard focus and reduced-motion behavior.

## Verification and acceptance criteria

Automated checks must prove:

- a mobile viewport renders the HTML hero and does not mount a Spline canvas;
- a touch swipe beginning inside the mobile hero increases `window.scrollY`;
- heading, description, navigation, and both links are visible without horizontal overflow;
- the primary action is visually dominant and neither action label wraps;
- the cube visual has no hard rectangular seam and does not overpower the heading;
- no blank bands exist between the hero background and its bounds;
- `375 × 667`, `390 × 844`, and `430 × 932` layouts remain usable;
- desktop renders the current Spline canvas and retains wheel/trackpad scrolling;
- existing homepage, footer, team, legal-page, type, and build tests remain green.

Visual QA is performed first on a preview deployment. Production is updated only after the mobile and desktop screenshots and scroll checks pass.

## Rollback

The change is isolated behind `ResponsiveHero`. Rollback consists of restoring the direct `LockedSplineHero` render and removing the mobile component/asset. The Spline scene itself is never edited.

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

1. Compact navigation: `Главная` → `#top`, `О нас` → `#team`, `Контакты` → `#contact`.
2. Heading: `Создаём digital-продукты, которые двигают бизнес вперёд`.
3. Description: `Сайты, веб-сервисы и AI-автоматизация, которые превращают трафик в заявки, а сложные процессы — в понятную систему.`
4. Primary link: `Обсудить проект` → `#contact`.
5. Secondary link: `Узнать больше` → `#work`.
6. A decorative, non-interactive static WebP crop of the existing blue cube composition.
7. A small downward indicator, hidden from assistive technology.

The static visual is derived from the current Nyraflow Spline scene and optimized for mobile. It contains no text or controls. The HTML heading, copy, navigation, and links remain readable, selectable, accessible, and independent of the image.

## Layout and responsive rules

- Use `min-height: 100svh` rather than a fixed `100vh`/`100dvh` height.
- Let the section height grow naturally if content needs more room.
- Respect top and bottom safe-area insets.
- Fill the entire section with the existing light-blue/white gradient so no unstyled body background can appear inside the hero.
- Keep all text within the mobile gutter and prevent horizontal overflow.
- Stack calls to action on narrow screens; allow a two-column row when there is enough width.
- The decorative image uses `object-fit: contain` inside a bounded region and cannot intercept pointer or touch events.
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
- Decorative visual and down indicator are ignored by assistive technology.
- Preserve visible keyboard focus and reduced-motion behavior.

## Verification and acceptance criteria

Automated checks must prove:

- a mobile viewport renders the HTML hero and does not mount a Spline canvas;
- a touch swipe beginning inside the mobile hero increases `window.scrollY`;
- heading, description, navigation, and both links are visible without horizontal overflow;
- no blank bands exist between the hero background and its bounds;
- `375 × 667`, `390 × 844`, and `430 × 932` layouts remain usable;
- desktop renders the current Spline canvas and retains wheel/trackpad scrolling;
- existing homepage, footer, team, legal-page, type, and build tests remain green.

Visual QA is performed first on a preview deployment. Production is updated only after the mobile and desktop screenshots and scroll checks pass.

## Rollback

The change is isolated behind `ResponsiveHero`. Rollback consists of restoring the direct `LockedSplineHero` render and removing the mobile component/asset. The Spline scene itself is never edited.

# Fedor Team Profile Design

## Goal

Add Fedor as the first person in the existing team section, using the supplied high-resolution HEIC portrait and the label `Федор, Founder & Creative director`.

## Scope

- Convert `/Users/a1111/Downloads/федор.heic` to a high-quality browser-compatible WebP image.
- Store the optimized image at `public/images/team/fedor.webp`.
- Add Fedor as the first entry in `homeContent.team.items`.
- Remove the separate third-person placeholder from `TeamSection` because the data-driven list will contain all three team members.
- Preserve the existing team layout, typography, card ratio, and responsive behavior.

## Implementation Design

The team section already renders `homeContent.team.items`, so Fedor will be represented by the existing `TeamMember` data shape. No new component or rendering branch is needed.

The source portrait has a 3:4 aspect ratio. The existing card uses a 4:5 frame with centered `object-cover` rendering, which will apply a small vertical crop while keeping the face centered. The WebP conversion will retain enough resolution for high-density desktop displays while reducing transfer size compared with a high-quality JPEG.

The current placeholder is outside the data mapping. It will be deleted after adding the third data entry so the grid contains exactly three real cards.

## Content

- ID: `fedor`
- Name: `Федор`
- Role: `Founder & Creative director`
- Image path: `/images/team/fedor.webp`
- Alt text: `Федор`

## Verification

- Confirm the converted image dimensions and file format.
- Run the repository's relevant automated checks and production build.
- Inspect the team section at representative mobile and desktop viewport widths.
- Confirm Fedor appears first, all three cards render, and no placeholder remains.

## Non-goals

- Redesigning the team section.
- Changing existing team-member content.
- Introducing new image or card abstractions.

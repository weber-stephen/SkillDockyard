# Skill Dockyard brand system

## Status

Operational Cobalt is the approved visual direction for Skill Dockyard. It is the default for the product interface, public website, product screenshots, and future design work.

This document translates the positioning in [brand-strategy.md](brand-strategy.md) into visual rules. The strategy defines who the product is for and what the brand should communicate; this document defines how that intent should look. Product terminology in [AGENTS.md](../AGENTS.md) remains authoritative for interface copy.

## Design intent

Skill Dockyard serves engineering, platform, security, operations, and AI enablement leaders while remaining approachable to capable workplace users. The visual system should therefore feel:

- Operational, not experimental
- Trustworthy, not restrictive
- Technical, not exclusionary
- Deliberate, not bureaucratic
- Distinctive, not decorative

Operational Cobalt supports those goals with a precise cobalt core, cool neutral surfaces, dark graphite text, and a restrained tangerine accent for review attention.

## Core palette

The implemented OKLCH values are the source of truth. Keep them as shared tokens rather than introducing close one-off colors.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Canvas | `--background` | `oklch(0.97 0.012 258)` | Page backgrounds and quiet application space |
| Primary text | `--foreground` | `oklch(0.20 0.045 264)` | Body text, headings, and high-emphasis information |
| Panel | `--panel` | `oklch(0.995 0.004 258)` | Cards, forms, dialogs, and elevated working surfaces |
| Cobalt | `--primary` | `oklch(0.48 0.20 264)` | Primary actions, active navigation, major metrics, and brand emphasis |
| On cobalt | `--primary-foreground` | `oklch(0.985 0.006 258)` | Text and icons on primary surfaces |
| Pale periwinkle | `--secondary` | `oklch(0.90 0.04 256)` | Selected states and low-emphasis supporting surfaces |
| Secondary text | `--secondary-foreground` | `oklch(0.27 0.09 264)` | Text on secondary surfaces |
| Cool muted surface | `--muted` | `oklch(0.935 0.018 258)` | Table headers, grouped controls, and quiet information areas |
| Muted text | `--muted-foreground` | `oklch(0.44 0.05 264)` | Supporting copy and metadata |
| Border | `--border` | `oklch(0.80 0.04 258)` | Hairlines, section boundaries, and component outlines |
| Input border | `--input` | `oklch(0.73 0.06 258)` | Form control boundaries |
| Focus ring | `--ring` | `oklch(0.55 0.21 264)` | Keyboard focus indication |
| Tangerine attention | `--attention` | `oklch(0.72 0.17 48)` | Items awaiting review and other attention states |
| Destructive | `--destructive` | `oklch(0.55 0.17 28)` | Destructive actions and confirmed errors only |

The corresponding implementation lives in `src/app/globals.css`.

## Color usage

Use color with restraint so information hierarchy remains clear:

- Approximately 75–80% neutral canvas and panel surfaces
- Approximately 15–20% cobalt structure and primary actions
- No more than 5% attention or semantic color on a typical screen
- Reserve filled cobalt for the most important action or structural element in a region
- Reserve tangerine for information that genuinely needs review or attention
- Reserve destructive red for destructive actions and confirmed errors
- Never rely on color alone to communicate a status; pair it with text and, where useful, an icon
- Do not introduce green as a primary brand or action color
- Do not use gradients as a substitute for hierarchy

## Typography

- Use a compact neo-grotesk hierarchy that feels precise and operational.
- The current interface stack uses `Avenir Next Condensed` for prominent display headings where available and `Avenir Next` for interface and body copy.
- Keep body copy highly legible and avoid condensed faces for paragraphs, form help, or dense tables.
- Use tabular figures for metrics and table data.
- Marketing pages may use greater scale, but the application should remain compact and task-focused.
- Avoid futuristic display faces, code typography as decoration, and playful type treatments.

## Surfaces and geometry

- Prefer flat or nearly flat panels with visible hairline borders.
- Use 2–4px radii for controls and working surfaces.
- Avoid excessive shadows, glass effects, and fields of floating rounded cards.
- Use cool neutral separation, spacing, and borders before adding elevation.
- Dense information areas should remain easy to scan, with restrained row striping and clear column alignment.

## Navigation and composition

- On desktop, use the compact horizontal command rail established by Precision Yard.
- Preserve the mobile drawer pattern on smaller screens.
- Make the current destination and primary action immediately recognizable.
- Favor broad page gutters, compact component interiors, and clear sectional breaks.
- Keep major headings concise, left aligned, and visually connected to the task that follows.
- Allow data tables to become labeled records on narrow screens instead of forcing unreadable horizontal layouts.

## Interaction and accessibility

- Use short, restrained transitions around 160ms for color, border, shadow, and pressed feedback.
- Respect `prefers-reduced-motion`.
- Use a high-contrast two-pixel focus outline with visible offset.
- Maintain WCAG AA contrast for text and controls.
- Keep interactive targets usable on touch screens even when the visual density is compact.
- Loading, empty, success, and error states must use the same hierarchy and semantic-color rules as populated screens.

## Brand expression

- Use the full name **Skill Dockyard** in public-facing contexts.
- Keep the maritime idea strategic and restrained; do not use ships, anchors, waves, or nautical product language as decoration.
- The current version-convergence symbol is preferred over a literal anchor.
- Favor real product evidence, version comparisons, workflow diagrams, and status views over abstract AI imagery.
- Avoid generic AI gradients, sparkles, robot imagery, and decorative futuristic effects.

## Alternative palette research

The following systems were considered viable but are not the current default:

| Direction | Palette character | Primary tradeoff |
| --- | --- | --- |
| Midnight and Amber | Executive, mature, security-oriented | Can feel conservative or heavy |
| Graphite and Signal Orange | Industrial, operational, memorable | Can feel severe during sustained use |
| Aubergine and Coral | Sophisticated, human, differentiated | Less conventional for infrastructure buyers |
| Indigo and Parchment | Approachable, editorial, expressive | Can become too playful for review workflows |
| Oxblood and Parchment | Deliberate, archival, highly distinctive | Can suggest legal or document-management software |

These are research references, not interchangeable themes. Do not introduce one without an explicit decision to revise the approved identity.

## Change rule

When changing visual identity, tokens, navigation composition, typography, or public brand expression:

1. Read this document and `docs/brand-strategy.md` first.
2. Preserve the operational, trustworthy, deliberate personality.
3. Implement changes through shared tokens and components.
4. Verify product workflows, responsive behavior, keyboard focus, and contrast.
5. Update this document when an intentional brand-system decision changes.


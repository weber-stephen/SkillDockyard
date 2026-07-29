# Skill Dockyard Brand Guidelines

## Brand Tone

Skill Dockyard should feel operational, deliberate, and trustworthy. The product is for engineering leaders and platform teams who need clear governance over AI instructions, prompts, skills, agents, and MCP usage.

Use direct language. Favor concrete outcomes over marketing claims: visibility, review, risk, approval, export, and Git-backed evidence.

## Color System

Use the app color tokens from `src/app/globals.css`. Do not introduce one-off brand colors in components unless a new token is added first.

Primary green is reserved for primary actions, brand marks, and small emphasis icons. It must always use white text:

```css
background: var(--primary);
color: #ffffff;
```

Never place black, default foreground, muted foreground, or secondary foreground text on primary green surfaces. Green buttons, brand tiles, and filled primary badges must use `text-white`.

## Buttons

Primary buttons:

- Use `bg-primary text-white`.
- Icons inside primary buttons must also use `text-white`.
- Use primary buttons for the main next action on a page.
- Do not use primary styling for secondary navigation or low-priority actions.

Secondary and outline buttons:

- Use `variant="outline"` for navigation, configuration, and alternate actions.
- Use `variant="secondary"` for non-destructive supporting actions that need more emphasis than outline.
- Keep button labels short and action-oriented.

## Layout

Skill Dockyard is an operational product, not a marketing site. Prefer compact headers, readable tables, restrained panels, and direct task flows.

Use cards only for repeated items, settings panels, review panels, and framed tools. Do not nest cards inside cards.

## Typography

Use strong, compact headings for page titles and panel labels. Body copy should be short, practical, and easy to scan.

Avoid decorative typography, oversized explanatory text inside dashboards, and visible instructions that repeat what the UI already shows.

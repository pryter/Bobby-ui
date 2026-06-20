# Bobby · Corporate Identity

Source of truth for the Bobby brand — colours, typography, logo, and visual language.

## Index

| File | Purpose |
|---|---|
| [design-system.md](design-system.md) | Full written guideline — voice, colour, type, components, motion. |
| [visual-guidelines.svg](visual-guidelines.svg) | Single-page visual poster of the system (open in a browser). |
| [tokens.json](tokens.json) | Machine-readable design tokens (W3C Design Tokens format). |
| [assets/](assets/) | Logo marks, lockups, favicon source, and colour swatches. |

## Assets

```
assets/
├── logo-mark-light.svg     White mark · for dark surfaces
├── logo-mark-dark.svg      Black mark · for light surfaces
├── logo-mark-yellow.svg    Yellow mark · monochrome accent
├── logo-lockup-light.svg   Mark + wordmark · dark backgrounds
├── logo-lockup-dark.svg    Mark + wordmark · light backgrounds
├── favicon-source.svg      128 × 128 master for favicon/PWA
└── color-swatches.svg      Palette strip · decks & specs
```

## How to use

- **In Figma / decks** — drag any `assets/*.svg` onto the canvas.
- **In code** — import from `/ci/assets/` or (for the running app) keep using the inline mark in [components/Navbar.tsx](../components/Navbar.tsx). Colour tokens live in [tailwind.config.js](../tailwind.config.js); keep them in sync with [tokens.json](tokens.json).
- **When updating the brand** — edit [design-system.md](design-system.md) + [tokens.json](tokens.json) *together*, then refresh [visual-guidelines.svg](visual-guidelines.svg) and any affected assets.

## Contact

Brand owner: **peterphongpak@gmail.com**

_Last updated: 2026-04-19_

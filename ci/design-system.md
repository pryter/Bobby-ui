# Bobby — Corporate Identity & Design System

> **Bobby** is a single workspace that turns ideas into shipped code, without forcing context-switches between half a dozen tools. The visual language is modern, dark-first, and playful — built around a signature yellow accent, glass-morphic surfaces, and a colourful tile palette that signals energy and motion.

---

## 1. Brand Foundation

### 1.1 Product name & tagline
- **Name**: Bobby
- **Tagline**: *Your personal project builder.*
- **Lead line**: *Build with Bobby.*
- **Short description**: A workspace, a runtime, and a live stream — in one.

### 1.2 Voice
| Trait | In practice |
|---|---|
| **Direct** | Say what it does. No jargon padding. |
| **Empowering** | Focus on what *the user* ships, not the platform. |
| **Humble** | Start free. Scale when ready. |
| **Technical without gatekeeping** | Developer-native, but explains the why. |

### 1.3 Do / Don't
| ✅ Do | ❌ Don't |
|---|---|
| "Turn ideas into shipped code." | "Revolutionary AI-powered synergy." |
| "Your infrastructure, your data." | "Enterprise-grade blockchain." |
| Sentence case in UI. | Title Case Everywhere. |

---

## 2. Logo System

### 2.1 Primary mark
The Bobby mark is a rounded glyph with two stylised "eyes" — a friendly, approachable face inside a soft shield. Source: [ci/assets/logo-mark-light.svg](assets/logo-mark-light.svg).

| Variant | Use on | File |
|---|---|---|
| Mark — Light | Dark surfaces (primary) | `assets/logo-mark-light.svg` |
| Mark — Dark | Light surfaces | `assets/logo-mark-dark.svg` |
| Mark — Yellow | Monochrome accent / merch | `assets/logo-mark-yellow.svg` |
| Lockup — Light | Header / footer on dark | `assets/logo-lockup-light.svg` |
| Lockup — Dark | Header / footer on light | `assets/logo-lockup-dark.svg` |
| Favicon source | App icon / PWA | `assets/favicon-source.svg` |

### 2.2 Clear space & minimum size
- **Clear space**: ≥ 25 % of the mark's width on all sides.
- **Minimum size**: 20 px mark on screen, 8 mm on print.
- The mark's native viewBox is `0 0 106 102` — preserve aspect ratio.

### 2.3 Misuse
Do not: recolour outside the approved palette, stretch, rotate, drop-shadow, outline, or place on a busy photograph without a scrim.

---

## 3. Colour System

All hex values come from [tailwind.config.js](../tailwind.config.js) and component styles. Semantic names are suggested below for cross-platform reuse.

### 3.1 Core brand
| Token | Hex | Role |
|---|---|---|
| `brand/yellow` | `#facc15` | **Primary CTA** — "Get started", key actions, focus accents |
| `brand/bg` | `#080808` | Page background (dark mode default) |
| `brand/surface` | `#111111` | Elevated surfaces — nav pill, sidebar, cards |

### 3.2 Tile palette (feature iconography)
Used on the landing hero and feature tiles. Each hue maps to a product capability.
| Token | Hex | Maps to |
|---|---|---|
| `tile/green` | `#1db954` | Code / build |
| `tile/orange` | `#f5a623` | Bobby / workspace |
| `tile/blue` | `#2563eb` | Rocket / ship |
| `tile/red` | `#f04e30` | Bolt / speed |
| `tile/purple` | `#7c3aed` | Shield / security |

### 3.3 Soft accents (pastel / decorative)
| Token | Hex |
|---|---|
| `soft/blue` | `#a2d2ff` |
| `soft/blue-2` | `#bde0fe` |
| `soft/pink` | `#ffafcc` |
| `soft/pink-2` | `#ffc8dd` |
| `soft/purple` | `#cdb4db` |

### 3.4 Neutrals
| Token | Hex | Use |
|---|---|---|
| `neutral/000` | `#ffffff` | Light-mode page |
| `neutral/050` | `#fcfcfc` | Light-mode surface |
| `neutral/100` | `#f9f9f9` | Light card |
| `neutral/200` | `#e5e7eb` | Light border |
| `neutral/300` | `#d1d5db` | Dark-mode body text |
| `neutral/400` | `#9ca3af` | Secondary text |
| `neutral/500` | `#6b7280` | Tertiary text |
| `neutral/600` | `#4b5563` | Disabled |
| `neutral/800` | `#1f2937` | Light-mode body text |
| `neutral/900` | `#111111` | Dark surface |
| `neutral/950` | `#080808` | Dark page |

### 3.5 Semantic roles
| Role | Light | Dark |
|---|---|---|
| Text / primary | `#1f2937` | `#ffffff` |
| Text / secondary | `#6b7280` | `#9ca3af` |
| Text / link | `#a16207` | `#facc15` |
| Text / code (error) | `#be185d` | `#f9a8d4` |
| Border | `#e5e7eb` | `rgba(255,255,255,0.08)` |
| Hover overlay | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` |
| Selection | `rgba(99,102,241,0.25)` | `rgba(99,102,241,0.25)` |

### 3.6 Accessibility
Always verify contrast with WCAG AA (4.5 : 1 for body, 3 : 1 for large text).
- `brand/yellow` on `brand/bg` — AA for large text only; **do not** use yellow on dark for body copy. Yellow on black button: black text, never white.
- Neutral pairings in §3.5 are pre-validated for AA.

---

## 4. Typography

### 4.1 Families
| Role | Family | Fallback |
|---|---|---|
| UI / body | **Nunito** | `system-ui, -apple-system, sans-serif` |
| Code | **UI Monospace** | `SFMono-Regular, Menlo, Monaco, Consolas, monospace` |

Loaded via `next/font/google` on `latin` subset — see [app/layout.tsx](../app/layout.tsx).

### 4.2 Type scale
| Token | Size | Use |
|---|---|---|
| `text/xs` | 0.75 rem (12 px) | Labels, badges |
| `text/sm` | 0.875 rem (14 px) | Buttons, nav, body small |
| `text/base` | 1 rem (16 px) | Body |
| `text/lg` | 1.125 rem (18 px) | Lead paragraph |
| `text/xl` | 1.25 rem (20 px) | H4 |
| `text/2xl` | 1.5 rem (24 px) | H3 |
| `text/3xl` | 1.875 rem (30 px) | H2 |
| `text/hero` | `clamp(2rem, 4vw, 2.75rem)` | Hero H1 |

### 4.3 Weights & metrics
| Weight | Use |
|---|---|
| 400 Regular | Body |
| 500 Medium | Nav links, subtle emphasis |
| 600 Semibold | Wordmark, sidebar items |
| 700 Bold | Buttons, H2 / H3 |
| 800 Extrabold | Hero H1 |

| Metric | Value |
|---|---|
| Line-height — tight | 1.1 *(H1)* |
| Line-height — UI | 1.2 – 1.3 |
| Line-height — prose | 1.7 |
| Tracking — H1 | `-0.02em` |
| Tracking — H2 | `-0.01em` |
| Tracking — uppercase labels | `0.18em` |

---

## 5. Layout & Spacing

### 5.1 Scale (4 px base grid)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64` px.

### 5.2 Radius
| Token | Value | Use |
|---|---|---|
| `radius/sm` | 8 px | Inputs, tight pills |
| `radius/md` | 12 px | Inline cards |
| `radius/lg` | 16 px | Tiles |
| `radius/xl` | 24 px | Major cards (pricing, features) |
| `radius/full` | 9999 px | Buttons, nav pill, avatars |

### 5.3 Shadows
| Token | Value |
|---|---|
| `shadow/nav` | `0 20px 25px -5px rgba(0,0,0,0.30)` |
| `shadow/nav-mobile` | `0 20px 25px -5px rgba(0,0,0,0.40)` |
| `shadow/card` | `0 10px 15px -3px rgba(0,0,0,0.10)` |
| `shadow/tile` | `0 8px 24px 2px {tile-color}55` *(55 = 33 % alpha)* |

### 5.4 Breakpoints (Tailwind default)
`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`. Mobile-first.

---

## 6. Components

### 6.1 Button
| Variant | Background | Text | Radius |
|---|---|---|---|
| Primary | `#facc15` | `#000000` | `radius/full` |
| Secondary (dark) | `rgba(255,255,255,0.06)` + border `rgba(255,255,255,0.12)` | `#ffffff` | `radius/full` |
| Secondary (light) | `#ffffff` + border `#d1d5db` | `#1f2937` | `radius/full` |
| Ghost | transparent → `rgba(255,255,255,0.06)` on hover | inherit | `radius/full` |

Interaction: `hover:scale-[1.02]`, `active:scale-[0.98]`, `transition-all` — ~200 ms.

### 6.2 Card
- Background: `bg-gray-50/60 dark:bg-white/[0.02]`
- Border: `border-gray-200/80 dark:border-white/[0.07]`
- Padding: 32 px (`p-8`)
- Radius: `radius/xl` (24 px)
- Optional radial glow for emphasis.

### 6.3 Input
- Background: `#f3f4f6` / `rgba(255,255,255,0.04)`
- Border: `#d1d5db` / `rgba(255,255,255,0.10)`
- Focus border: `#111827` / `rgba(250,204,21,0.60)`
- Radius: 8 – 12 px.

### 6.4 Navigation pill (desktop)
- Background: `rgba(17,17,17,0.90)` + `backdrop-blur(24px)`
- Border: `rgba(255,255,255,0.08)`
- Shadow: `shadow/nav`
- Radius: `radius/full`
- Gap between items: 4 px.

### 6.5 Iconography
- Library: `@heroicons/react@2.1` (24 px solid + outline).
- Default stroke: 2.3 – 2.5 px.
- Sizes: 18 / 20 / 24 px depending on context.

---

## 7. Motion

| Pattern | Value |
|---|---|
| Ease — natural | `cubic-bezier(0.22, 0.10, 0.35, 1)` |
| Ease — overshoot | `cubic-bezier(0.22, 1.00, 0.36, 1)` |
| Spring | `stiffness 500 · damping 40` |
| Micro | 150 – 300 ms (hovers, pills) |
| Macro | 500 – 700 ms (page / section) |
| Ambient | 10 – 14 s loop (`orbFloat`, `orbFloat2`) |
| Stagger | `staggerChildren 0.12 · delayChildren 0.05` |

Respect `prefers-reduced-motion` wherever orbit / float animations run.

---

## 8. Gradients & Glows

### 8.1 Hero text gradient
```css
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%);
-webkit-background-clip: text;
color: transparent;
```

### 8.2 Ambient glows
| Name | Recipe |
|---|---|
| Yellow glow | `radial-gradient(circle, rgba(250,204,21,0.25) 0%, rgba(250,204,21,0.11) 25%, rgba(250,204,21,0.04) 50%, transparent 70%)` |
| Indigo glow | `radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(124,77,255,0.05) 45%, transparent 70%)` |
| Tile halo | `radial-gradient(circle, {tile-color}B3 0%, transparent 70%)` |

---

## 9. Dark Mode

- **Strategy**: class-based (`class="dark"` on `<html>`) via [lib/useTheme.ts](../lib/useTheme.ts).
- **Storage**: `localStorage['bobby-theme'] ∈ {'dark','light'}`.
- **Fallback**: `prefers-color-scheme`.
- **FOUC guard**: synchronous inline script sets the class before first paint.
- **Default**: dark.

---

## 10. Files in this folder

```
ci/
├── README.md                  ← quick index
├── design-system.md           ← this document
├── bobby-visual.svg           ← single-page poster of the system
├── tokens.json                ← design tokens (JSON, framework-agnostic)
└── assets/
    ├── logo-mark-light.svg    ← primary mark, white fill
    ├── logo-mark-dark.svg     ← mark, black fill
    ├── logo-mark-yellow.svg   ← mark, yellow fill
    ├── logo-lockup-light.svg  ← mark + wordmark, light
    ├── logo-lockup-dark.svg   ← mark + wordmark, dark
    ├── favicon-source.svg     ← favicon master
    └── color-swatches.svg     ← palette strip for specs & decks
```

---

*Last updated: 2026-04-19. Source of truth for colour / typography tokens is [tailwind.config.js](../tailwind.config.js); update this doc alongside any change there.*

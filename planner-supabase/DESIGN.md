# Life OS — Warm Violet

> Category: Productivity
> A serene, native-feeling personal OS for life management — finance, academics, habits, schedules, and growth. Designed for a Thai university student who also works as a food delivery rider. Calm clarity over dense information, with a subtle gamification undercurrent (Solo Leveling theme) that surfaces only in its own subsystem.

---

## 1. Visual Theme & Atmosphere

**Calm, native, quietly capable.** The main app reads like a first-party OS utility — Safari's sidebar, Calendar's serenity, Reminders' clarity. Whitespace is the primary layout tool; chrome is secondary. The interface whispers so the data speaks.

The Solo Leveling gamification subsystem (hunter ranks, EXP bars, level-up overlays) lives in a *delimited dark-themed pocket* — it never leaks into the main productivity chrome. Two visual modes coexist without conflict: a light, airy productivity surface and a dark, atmospheric gaming underlayer.

**Key characteristics:**
- Native OS-caliber polish: smooth transitions, system typography, platform-consistent gestures
- Flat by default; 1px borders define structure; shadows only for elevation (modals, dropdowns)
- One accent color with surgical precision — ≤2 visible accent uses per screen
- Thai-first: the typography stack prioritises Sarabun for Thai, Geist for Latin, ensuring both scripts look equally intentional at every size
- Mobile-first responsive: bottom tab nav on phone, sidebar on desktop

---

## 2. Color Palette & Roles

### Light mode

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#f8f7fc` | Page canvas — soft violet-tinted off-white, reduces glare |
| `--surface` | `#ffffff` | Cards, modals, elevated panels |
| `--surface-warm` | `#faf9fe` | Subtle card alt, hover states on cards |
| `--fg` | `#1a1a2e` | Primary text — deep navy-black, softer than pure #000 |
| `--fg-2` | `#3d3d5c` | Secondary text, metadata |
| `--muted` | `#6b6b80` | Helper text, captions, placeholder |
| `--meta` | `#9494a8` | Timestamps, secondary metadata, fine print |
| `--border` | `#e2e0ee` | Card borders, dividers — soft violet-gray |
| `--border-soft` | `#eceaf4` | Inner row separators, light dividers |
| `--accent` | `#7c3aed` | Violet-600 — primary CTAs, links, active states, one hero element per screen |
| `--accent-on` | `#ffffff` | Text on accent background (button labels) |
| `--accent-hover` | `#6d28d9` | Violet-700 — hover state |
| `--accent-active` | `#5b21b6` | Violet-800 — press state |
| `--accent-soft` | `#ede9fe` | Violet-100 — soft tint for active nav, selected rows |
| `--success` | `#059669` | Emerald-600 — positive confirmation, budget surplus |
| `--warn` | `#d97706` | Amber-600 — pending states, warnings |
| `--danger` | `#dc2626` | Red-600 — destructive actions, budget deficits |

### Dark mode

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#0f0f1a` | Deep navy-black canvas |
| `--surface` | `#1a1a2e` | Cards, elevated panels |
| `--surface-warm` | `#1e1e35` | Card alt, hover |
| `--fg` | `#e8e6f0` | Primary text — warm off-white |
| `--fg-2` | `#b8b6cc` | Secondary text |
| `--muted` | `#8886a0` | Helper text, captions |
| `--meta` | `#666480` | Fine print, timestamps |
| `--border` | `#2d2b42` | Card borders |
| `--border-soft` | `#26243a` | Inner row separators |
| `--accent` | `#a78bfa` | Violet-400 — CTAs, links |
| `--accent-on` | `#1a1a2e` | Text on accent background |
| `--accent-hover` | `#c4b5fd` | Violet-300 |
| `--accent-active` | `#ddd6fe` | Violet-200 |
| `--accent-soft` | `#2e2a4a` | Soft tint for active states |
| `--success` | `#34d399` | Emerald-400 |
| `--warn` | `#fbbf24` | Amber-400 |
| `--danger` | `#f87171` | Red-400 |

### Named rules

**The Whispering Accent Rule.** Violet is used sparingly (≤2 visible accent elements per screen). If everything is violet, nothing is. The accent directs—it does not decorate.

**The Gamification Boundary Rule.** Solo Leveling subsystem (hunter stats, EXP bars, level-up effects) uses its own palette: `--hunter-bg: #0a0a14`, `--hunter-purple: #a855f7`, `--hunter-gold: #f59e0b`, `--hunter-glow: 0 0 20px rgba(168,85,247,0.4)`. These tokens never appear in the main productivity UI.

### Anti-patterns (must-fix lint rules)

- ❌ **Default Tailwind indigo (#6366f1, #4f46e5)** — the textbook AI tell. Our accent is violet-600 (#7c3aed), which sits at hue 270 vs indigo's 239. A difference of 31° on the hue wheel is intentional and deliberate.
- ❌ **Two-stop "trust" gradients** — purple→blue, indigo→pink. Flat surfaces + intentional type beats gradients every time.
- ❌ **Emoji as feature icons** — `✨`, `🚀`, `⚡`, `🔥` inside headings, buttons, or icon slots. Use lucide-react with `currentColor`.
- ❌ **Rounded card with colored left-border** — the canonical AI dashboard tile. Drop either the radius or the left border.
- ❌ **Pure black (#000) or pure white (#fff) backgrounds** — always use the tinted equivalents.

---

## 3. Typography Rules

### Font stack

| Role | Stack |
|------|-------|
| Display / headings | `'Geist', 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif` |
| Body | `'Geist', 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif` |
| Mono | `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` |

Geist leads for Latin; Sarabun leads for Thai. The stack ensures both scripts render with equal intentionality at every size.

### Type scale (px)

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 11px | Caption, fine print, metadata |
| `--text-sm` | 13px | UI labels, helper text |
| `--text-base` | 15px | Body, list items, descriptions |
| `--text-lg` | 18px | Card titles, modal headers |
| `--text-xl` | 22px | Section headers |
| `--text-2xl` | 28px | Page titles |
| `--text-3xl` | 36px | Display, hero |
| `--text-4xl` | 48px | Large display |

### Line height

| Size | Line height |
|------|-------------|
| Body (15px) | 1.6 |
| Small (≤13px) | 1.5 |
| Headings (≥18px) | 1.3 |
| Display (≥36px) | 1.15 |

### Letter-spacing — the rule that makes or breaks craft

| Context | Letter-spacing |
|---------|---------------|
| Body text (15px) | `0` (default) |
| Small text (≤13px) | `0.015em` |
| UI labels, button text | `0.02em` |
| ALL CAPS | `0.06em` to `0.1em` **(required)** |
| Headings 28px+ | `-0.015em` |
| Display 36px+ | `-0.02em` |

### Named rules

**The Three-Weight System.** Exactly three font weights are used across the entire UI:
- **400 (Read)** — body copy, descriptions, list items
- **500 (Interact)** — UI labels, navigation, buttons
- **600 (Announce)** — headings, display, emphasis

Weight 700+ is never needed. If the UI needs more emphasis, use spacing, not bold.

**The 65ch Rule.** Body text blocks are capped at `max-width: 65ch` for optimal readability.

**Thai Script Consideration.** Sarabun at 15px body reads wider than Geist at 15px — Thai characters have inherently larger counters. The 15px baseline was chosen as the smallest size where Sarabun remains fully legible. Never go below 13px for Thai text.

---

## 4. Component Stylings

### Buttons

| Property | Primary | Secondary | Ghost | Danger |
|----------|---------|-----------|-------|--------|
| Background | `--accent` | Transparent | Transparent | `--danger` |
| Text | `--accent-on` | `--fg` | `--fg` | `--accent-on` |
| Border | None | `--border` | None | None |
| Radius | `--radius-sm` (8px) | `--radius-sm` | `--radius-sm` | `--radius-sm` |
| Padding | 8px 18px | 8px 18px | 8px 18px | 8px 18px |
| Hover | `--accent-hover` | `--accent-soft` | `--accent-soft` | Darken 8% |
| Active | `--accent-active` | `--accent-soft` | `--accent-soft` | Darken 14% |

All buttons use `font-weight: 500`, `letter-spacing: 0.02em`, and `transition: background var(--motion-fast) var(--ease-standard), box-shadow var(--motion-fast) var(--ease-standard)`.

### Cards

- Background: `--surface`
- Border: `1px solid var(--border)`
- Radius: `--radius-md` (12px)
- Padding: `--space-5` (20px)
- Shadow: none (flat by default; use `--elev-ring` only when card needs separation from surface)
- Hover lift: optional, via `--elev-raised` for interactive cards only

### Inputs & Fields

- Border: `1px solid var(--border)`
- Radius: `--radius-sm` (8px)
- Padding: 8px 14px
- Focus: `--focus-ring` (3px violet-toned glow) + border shifts to `--accent`
- Background: `--surface`
- Text: `--fg`
- Placeholder: `--muted`
- Disabled: `opacity: 0.5`, `--muted` background
- Error: border shifts to `--danger` with `--focus-ring` in danger tone

### Navigation (Sidebar)

- Items: 44px tall, 8px radius, 500 weight
- Default: `--fg-2` text, transparent bg
- Hover: `--accent-soft` bg at 50%
- Active: `--accent-soft` bg, `--accent` text
- Icons: lucide-react, 20px, `currentColor`

### Navigation (Mobile Bottom Tab)

- Fixed bottom, `--surface` background, top border `--border`
- 4 primary items + "More" expandable
- Active: `--accent` icon + text
- Inactive: `--muted` icon + text
- Height: 64px (safe area inset accounted)

### Modals & Dialogs

- Background: `--surface`
- Radius: `--radius-lg` (16px)
- Elevation: `--elev-raised`
- Overlay: `rgba(15, 15, 26, 0.5)` (dark tint, light mode) / `rgba(0, 0, 0, 0.6)` (dark mode)
- Close button: ghost style, top-right
- Animation: `fadeIn` at `--motion-base`

### Status Badges & Tags

- Radius: `--radius-pill` (9999px)
- Padding: 2px 10px
- Font: `--text-sm`, 500 weight, `0.02em` tracking
- Semantic colors map to their respective `--*-soft` backgrounds with `--*` text (e.g., success badge: `--success` at 12% opacity bg, `--success` text)

---

## 5. Layout Principles

### Grid

- 12-column grid, `--container-max` (1080px) content width
- 24px gutters desktop, 16px tablet, 12px phone
- Sidebar: 240px (collapses to bottom tab bar on mobile)
- Content: fills remaining width with 24px padding

### Section rhythm

| Breakpoint | Top/Bottom spacing |
|------------|-------------------|
| Desktop ≥1024px | `--section-y-desktop` (80px) |
| Tablet 640–1023px | `--section-y-tablet` (56px) |
| Phone <640px | `--section-y-phone` (40px) |

### Whitespace principles

- Whitespace is the primary separator — not dividers
- Dividers only between unrelated top-level sections
- Content is top-biased, never vertically centered
- Dense data (tables, transaction lists) uses 8px row padding, not 16px

### Page structure

```
┌─────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content   │
│  ┌─────────────┐  │  ┌───────────┐  │
│  │ Hunter      │  │  │ Nav/Tabs  │  │
│  │ Status      │  │  ├───────────┤  │
│  ├─────────────┤  │  │           │  │
│  │ Checklist   │  │  │ Feature   │  │
│  │ Dashboard   │  │  │ Content   │  │
│  ├─────────────┤  │  │           │  │
│  │ Accounting  │  │  │           │  │
│  │ Academic    │  │  └───────────┘  │
│  │ Calendar    │  │                 │
│  │ Timetable   │  │  ┌───────────┐  │
│  │ Habits      │  │  │ Omni      │  │
│  │ Pomodoro    │  │  │ Assistant │  │
│  │ Settings    │  │  └───────────┘  │
│  └─────────────┘  │                 │
└─────────────────────────────────────┘
```

---

## 6. Depth & Elevation

### Three levels only

| Level | Token | Use |
|-------|-------|-----|
| **Flat (0)** | `--elev-flat: none` | Default — structural cards, dashboard tiles, list items |
| **Ring (1)** | `--elev-ring: 0 0 0 1px var(--border)` | Cards that need separation from same-bg surfaces; dense lists where border is more efficient than shadow |
| **Raised (2)** | `--elev-raised` | Modals, dropdowns, floating buttons, tooltips |

`--elev-raised` values:
- Light: `0 2px 12px rgba(26, 26, 46, 0.10), 0 1px 3px rgba(26, 26, 46, 0.06)`
- Dark: `0 4px 16px rgba(0, 0, 0, 0.30)`

No fourth level. No neumorphism. No glassmorphism. No glowing elements in the productivity UI (glow is reserved for the Solo Leveling subsystem).

### Focus ring

```css
--focus-ring: 0 0 0 3px color-mix(in oklab, var(--accent), transparent 70%);
```

Applied to `:focus-visible` on all interactive elements (buttons, inputs, links, tabs). This token is the single source of truth for keyboard-focus indicators.

---

## 7. Do's and Don'ts

### Do:
- ✅ Let whitespace do the work — it is the primary layout tool
- ✅ One accent element per screen; two max
- ✅ Use accent sparingly on the focused/active element only
- ✅ Sentence-case for all headings; title case only for brand names
- ✅ Optimise for scanability — clear hierarchy, chunked information
- ✅ Use the **three-weight system** consistently (400/500/600)
- ✅ Apply negative tracking to display sizes, positive tracking to small text
- ✅ Use lucide-react monoline SVGs with `currentColor` for all icons
- ✅ Keep destructive actions red, confirmations green, warnings amber
- ✅ Make empty states actionable — illustration + headline + CTA
- ✅ Match loading indicator to expected duration (skeleton ≥ 300ms; spinner 300ms–2s)

### Don't:
- ❌ No pure black (#000) or pure white (#fff) — always use the palette values
- ❌ No Tailwind indigo (#6366f1, #4f46e5) as accent — our violet is intentional
- ❌ No decorative gradients on backgrounds or cards
- ❌ No emoji as icons — use lucide-react
- ❌ No rounded cards with colored left-border accent
- ❌ No shadows on structural cards — flat is the default
- ❌ No "Something went wrong" error messages — always show cause + recovery
- ❌ No lorem ipsum, "Feature One/Two/Three", or placeholder copy — empty sections are a composition problem
- ❌ No more than three type sizes visible above the fold
- ❌ No glassmorphism, neumorphism, or glowing effects in productivity UI
- ❌ No hero sections in the app UI — this is a tool, not a marketing page
- ❌ No invented metrics — "10x faster", "99.9% uptime"

---

## 8. Responsive Behavior

### Breakpoints

| Name | Range | Grid | Sidebar |
|------|-------|------|---------|
| Desktop | ≥1024px | 12-col | 240px sidebar visible |
| Tablet | 640–1023px | 8-col | Sidebar collapses to icon rail (64px) |
| Phone | <640px | 4-col | Bottom tab navigation |

### Mobile adaptations

- Bottom tab bar with 4 primary items + "More" for full navigation
- Full-screen push for modal forms
- OmniAssistant slides up as bottom sheet, not floating panel
- Data tables become card lists
- Calendar grid cells shrink; use horizontal scroll for week view
- Charts (recharts) switch to vertical layout or single-column

### Dark mode

- Toggled via `ThemeContext`, persisted to localStorage
- `.dark` class on `<html>` activates all `:root.dark { }` token overrides
- Respects `prefers-color-scheme` on first visit, then honours user toggle
- No abrupt transition — 200ms crossfade on background/color changes

---

## 9. Agent Prompt Guide

When generating or modifying UI for this project:

### Token discipline
- Never use raw hex values outside the `:root { }` token block in `tokens.css`
- Reference every color, size, spacing, and motion value via `var(--name)` — not Tailwind utility classes for colours
- If a needed value doesn't exist as a token, add it to the C-extension section of `tokens.css` with a comment explaining which component needs it

### Composition
- When in doubt, subtract. Fewer boxes, less chrome, more space
- Use whitespace as the primary separator; reach for a divider only when two unrelated sections sit adjacent
- One violet accent element per screen; two max
- Every list, table, card, form, and panel must implement all five states: loading, empty, error, populated, and edge (extreme volume/length)

### Typography
- Use exactly three weights: 400 (read) / 500 (interact) / 600 (announce)
- Apply negative tracking to headings ≥28px and positive tracking to small text ≤13px
- ALL CAPS text **must** have `letter-spacing: 0.06em` minimum
- Never use emoji as icons; use lucide-react with `currentColor`

### Code quality
- Components must be modular with single responsibility
- Use `useState` + `useEffect` or custom hooks for data fetching — each hook manages its own loading/error/empty states
- Apply `prefers-reduced-motion` at the global level and strip all transform-based animations
- No inline styles for themable values — always use CSS variables or Tailwind classes
- Preserve user input across errors — forms must not clear on submit failure

### Solo Leveling subsystem
- The gamification UI (hunter stats, EXP bars, level-up) uses its own delimited token namespace (`--hunter-*`)
- Allowed in the sidebar and overlay modals only — never in the main content area
- Glow effects, dark backgrounds, and gold accents are confined to this subsystem
- Level-up animation fires once and dismisses; no looping celebration

### Anti-slop checklist (must-fix)
- [ ] No indigo (#6366f1) anywhere
- [ ] No two-stop gradients
- [ ] No emoji icons
- [ ] No rounded-card-with-left-border
- [ ] No "Something went wrong" messages
- [ ] No placeholder/filler copy
- [ ] No pure black or pure white
- [ ] ALL CAPS tracking ≥ 0.06em
- [ ] Display text has negative tracking
- [ ] All five states present (loading/empty/error/populated/edge)

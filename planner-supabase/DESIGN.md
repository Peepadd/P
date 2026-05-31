---
name: Planner App
description: Manage daily life tasks, schedules, shared finances, and habits with focus and clarity.
colors:
  primary: "#6366f1"
  primary-dark: "#4f46e5"
  success: "#22c55e"
  danger: "#ef4444"
  warning: "#f59e0b"
  neutral-bg: "#f9fafb"
  neutral-border: "#e5e7eb"
typography:
  display:
    fontFamily: "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif"
    fontWeight: 700
  headline:
    fontFamily: "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Planner App

## 1. Overview

**Creative North Star: "The Apple Calendar Philosophy"**

A serene, breathable space that feels like a native OS app. It whispers rather than shouts. The design prioritizes calm clarity over dense information, rejecting complex SaaS tropes and enterprise data tables. Information is comfortably spaced, relying on alignment and soft borders rather than heavy containers. It is meant to reduce cognitive load and feel effortlessly approachable.

**Key Characteristics:**
- Native, soft, and out of the way.
- Flat by default with subtle, intentional shadows.
- Clear, purposeful accents without overwhelming the eye.

## 2. Colors

The palette is restrained, using a single approachable accent color over clean neutral backgrounds.

### Primary
- **Soft Indigo** (#6366f1): The interactive anchor. Used for primary buttons, active states, and essential emphasis. It feels native and approachable rather than aggressive.

### Neutral
- **Background** (#f9fafb): The default canvas. A clean, soft off-white that reduces eye strain compared to pure white.
- **Subtle Border** (#e5e7eb): Used to delineate structure without adding visual noise.

### Functional
- **Success Green** (#22c55e): Positive confirmation and budget tracking.
- **Danger Red** (#ef4444): Destructive actions and budget deficits.
- **Warning Amber** (#f59e0b): Temporary states and pending tasks.

### Named Rules
**The Whispering Accent Rule.** The Soft Indigo is used sparingly (≤10% of the screen) to guide the user's eye to what matters. If everything is indigo, nothing is.

## 3. Typography

**Display/Body Font:** Sarabun (with Noto Sans Thai and system-ui fallbacks)

**Character:** A highly legible, modern Thai-Latin pairing that reads cleanly at both display and interface sizes.

### Hierarchy
- **Display** (700 weight): Section headers and primary page titles.
- **Headline** (600 weight): Card titles and modal headers.
- **Body** (400 weight): Standard paragraphs, descriptions, and list items.

### Named Rules
**The System-Native Rule.** The typography must always feel like it belongs to the device's native OS, leaning heavily on `system-ui` for English text while maintaining crisp `Sarabun` readability for Thai.

## 4. Elevation

Flat by default. Shadows are only used to lift interactive elements like modals or dropdowns.

### Shadow Vocabulary
- **Modal Lift** (`shadow-xl`): Used to strongly elevate modals and floating notification panels above the main canvas.
- **Subtle Lift** (`shadow-sm`): Used rarely for hovering interactive elements or small badges.

### Named Rules
**The Flat Canvas Rule.** Structural cards and panels use a 1px border (`border-gray-200`) and a white background to separate from the canvas, NOT shadows.

## 5. Components

### Buttons
- **Shape:** Softly rounded (8px radius, `rounded-lg`).
- **Primary:** Soft Indigo background (`bg-indigo-500`) with white text.
- **Hover / Focus:** Transitions to a slightly darker shade (`bg-indigo-600`) without moving or jumping.

### Cards / Containers
- **Corner Style:** Highly rounded (12px radius, `rounded-xl`).
- **Background:** Pure white (`bg-white`) on top of the neutral canvas.
- **Shadow Strategy:** Flat. Relies on a 1px border (`border-gray-200`) for definition.

### Inputs / Fields
- **Style:** 8px radius (`rounded-lg`) with a 1px border (`border-gray-300`).
- **Focus:** A soft 2px Indigo focus ring (`focus:ring-2 focus:ring-indigo-500`) with a matching border color shift.

### Navigation
Clean, text-forward links. Active states use a soft Indigo background tint (`bg-indigo-50`) with Indigo text, rather than heavy underlines.

## 6. Do's and Don'ts

### Do:
- **Do** rely on `rounded-xl` (12px) for cards and `rounded-lg` (8px) for buttons and inputs.
- **Do** keep navigation simple and breathable.
- **Do** use `bg-indigo-50` for subtle active or hover states on list items.

### Don't:
- **Don't** use clunky, dense, or gray data tables reminiscent of enterprise software.
- **Don't** use complex SaaS tropes like excessive sidebars or metric-heavy layouts.
- **Don't** apply shadows to structural cards on the dashboard.

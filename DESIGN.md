---
name: Dark Graphite Precision Amber
colors:
  surface: '#1a120d'
  surface-dim: '#1a120d'
  surface-bright: '#423732'
  surface-container-lowest: '#140c08'
  surface-container-low: '#221a15'
  surface-container: '#271e19'
  surface-container-high: '#322823'
  surface-container-highest: '#3d332d'
  on-surface: '#f0dfd7'
  on-surface-variant: '#dbc1b5'
  inverse-surface: '#f0dfd7'
  inverse-on-surface: '#382e29'
  outline: '#a38c81'
  outline-variant: '#55433a'
  surface-tint: '#ffb68e'
  primary: '#ffc09e'
  on-primary: '#542200'
  primary-container: '#ff985b'
  on-primary-container: '#733100'
  inverse-primary: '#98480f'
  secondary: '#e8b3ff'
  on-secondary: '#471c5e'
  secondary-container: '#603476'
  on-secondary-container: '#d6a2ed'
  tertiary: '#45e3da'
  on-tertiary: '#003734'
  tertiary-container: '#00c7be'
  on-tertiary-container: '#004d4a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb68e'
  on-primary-fixed: '#331200'
  on-primary-fixed-variant: '#773300'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e8b3ff'
  on-secondary-fixed: '#300247'
  on-secondary-fixed-variant: '#603476'
  tertiary-fixed: '#61f9ef'
  tertiary-fixed-dim: '#39dcd2'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504c'
  background: '#1a120d'
  on-background: '#f0dfd7'
  surface-variant: '#3d332d'
  accent-amber: '#ff9f0a'
  electric-crimson: '#ff3b30'
  cyber-lime: '#34c759'
  vibrant-violet: '#af52de'
  canvas-base: '#0c0e12'
  surface-acrylic: rgba(22, 24, 29, 0.82)
typography:
  headline-lg:
    fontFamily: system-ui
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: system-ui
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: system-ui
    fontSize: 0.9375rem
    fontWeight: '500'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-md:
    fontFamily: system-ui
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: system-ui
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-md:
    fontFamily: system-ui
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: system-ui
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.02em
  code-badge:
    fontFamily: ui-monospace
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  margin: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

This design system is tailored for high-density browser extensions, screen markup tools, and visual feedback environments. The design language marries utilitarian minimalism with a tactical dark acrylic aesthetic. It prioritizes focused workflows by immersing the user in a deep, matte graphite foundation where essential interactive signals cut through with an energetic, warm amber-coral signature.

### Design Style & Attitude
- **Matte Dark Graphite**: Dark, light-absorbing surfaces (`#111317`) reduce visual glare and deliver an uncompromising professional instrument bench.
- **Amber & Warm Coral Radiance**: Replacing cold turquoise, the primary focal accent is pivoted to an energetic, warm amber-orange spectrum (`#FF9F0A` / `#FF985B`), evoking precision optics, telemetry gauges, and immediate visual hierarchy without fatigue.
- **Glassmorphic Precision**: Micro-dock HUDs, contextual popovers, and side trays leverage translucent slate containers with backdrop blurs, maintaining environmental host context while isolating the user's workflow.
- **Engineered Density**: Spaced tightly on a 4px module for compact browser panels, keyboard-first operations, and in-situ screen overlays.

## Colors

The color palette establishes an uncompromising boundary between supportive chrome and decisive action markers. Structural chrome relies on deep graphite tones, while foreground actions and primary selections leverage high-voltage amber and warm coral.

### Primary Color Dynamic
- **Primary Anchor (`#FF985B` / `#FF9F0A`)**: Represents active tools, focused input rings, primary calls-to-action, drag anchors, and primary measurement highlights. It brings a fiery, high-clarity focal point against the obsidian backdrop.
- **Secondary Accent (`#E8B3FF` / `#AF52DE`)**: Retained for collaborative markup, grouping dimensions, secondary badges, and multi-user annotations.
- **Tertiary Accent (`#00C7BE`)**: Repurposed from its former primary role into a specialized secondary utility token—ideal for technical guides, secondary inspection nodes, and non-destructive overlays.

### Surface Hierarchy
- **Canvas Lowest**: `#0C0E12` (Host-layer backing, deep inset viewports).
- **Default Surface**: `#111317` (Main application background and extension tray shell).
- **Surface Elevation High**: `#1E2024` (Cards, inactive buttons, dock capsules).
- **Surface Elevation Highest**: `#282A2E` (Dropdown tiers, popovers, active item hovers).
- **Borders & Separators**: `#3C4948` (Low-contrast architectural borders) and `rgba(255, 255, 255, 0.08)` (Inset dividers).

## Typography

The typographic hierarchy is engineered for microscopic precision, legibility under compact constraints, and instant scannability during live screen recording and capture.

No web fonts are loaded. The UI relies on the host platform's native system font so it renders instantly inside third-party pages and needs no network access.

- **System Sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)**: Used for headings, body copy, and micro-labels (11px–13px). Headings use weight 600 with slight negative tracking; labels use weight 500.
- **System Mono (`ui-monospace, SFMono-Regular, Menlo, monospace`)**: Reserved for hotkey badges (`<kbd>`) and code on the settings page. The floating dock and its popovers use the sans face only, with tabular numerals for the fade readout.

## Layout & Spacing

A compact, 4px-aligned modular system accommodates high density across extension sidebars (320px–380px), floating HUD micro-docks (36px–44px height), and on-canvas annotation panels.

### Layout Cadence
- **Floating Overlays & Docks**: Built with `space-xs` (4px) to `space-sm` (6px) between micro-tools and action buttons. Anchored floating docks maintain an outer viewport clearance using `margin` (`0.75rem`).
- **Sidebar & Stack Containers**: Use unified 1-column layouts with a consistent `gutter` of `0.5rem` between collapsible toolcards.
- **Compact Vertical Rhythm**: Form elements, color pickers, and tool items are standardized to heights of 28px (compact tool button), 32px (standard control), and 36px (primary button).

## Elevation & Depth

Visual hierarchy is constructed through tonal surface stepping, refined back-lit translucent planes, and sharp interior borders rather than blurred diffuse shadows.

### Elevation Architecture
1. **Base Zero (Host Canvas Backdrop)**: `#0C0E12` solid matte graphite.
2. **Level 1 (Floating HUDs & Micro-Docks)**: Translucent `#16181D` (82% opacity) paired with `backdrop-filter: blur(16px)`, bound by a 1px perimeter of `#282A2E`. Ambient soft shadow: `0 6px 20px -2px rgba(0, 0, 0, 0.6)`.
3. **Level 2 (Tooltips, Popovers & Context Menus)**: `#1E2024` with top-highlight bevel `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08)` and structural perimeter `1px solid #333539`.
4. **Active Focus & Tool Selection**: Emits a subtle amber ambient perimeter: `box-shadow: 0 0 0 1px #FF985B, 0 0 12px rgba(255, 152, 91, 0.25)`.

## Shapes

The shape language reflects architectural precision using a compact curvature scale (`roundedness: 1`). Controls retain clean, slightly softened edges that preserve maximum screen real estate within dense browser sidebars.

### Corner Radii
- **Tool Buttons, Input Fields & Panels**: `0.25rem` (4px) to `0.375rem` (6px) for an instrument-like feel.
- **Cards & Popover Containers**: `0.5rem` (8px) for structural containment.
- **Dock Envelopes & Segmented Switchers**: `9999px` (fully rounded pills) used exclusively for encapsulated floating HUDs and selection toggles.
- **Micro Shortcut Tags (`<kbd>`)**: `0.25rem` (4px).

## Components

### Buttons
- **Primary Action**: Solid `#FF985B` background with deep contrast `#331200` or `#111317` text, font weight 600. On hover: lightness increases by 8%, accompanied by an amber surface glow.
- **Secondary / Ghost**: Transparent fill with `1px solid #282A2E` border and `#E2E2E8` text. Hovering activates `#1E2024` background and shifts border to `#333539`.
- **Destructive**: Low-alpha red tint `rgba(255, 59, 48, 0.12)` with border `rgba(255, 59, 48, 0.35)` and `#FF3B30` text.

### Floating Annotation Dock (HUD)
- **Housing**: Acrylic capsule with `rgba(22, 24, 29, 0.85)` background, `backdrop-filter: blur(16px)`, and 1px border `#282A2E`.
- **Active Tool Item**: Highlighted with `background: rgba(255, 152, 91, 0.15)`, text/icon `#FF985B`, and an inset active border indicator.
- **Inactive Tool Item**: Neutral muted icon `#9CA3AF`, transitioning to `#E2E2E8` on hover over a `rgba(255, 255, 255, 0.05)` fill.

### Input Fields & Controls
- **Inputs & Dropdowns**: Background `#16181D`, border `1px solid #282A2E`, text `#E2E2E8`. Focus state introduces a crisp `1px solid #FF985B` border with zero offset ring.
- **Range & Stroke Sliders**: Track height 3px `#282A2E`, filled active track `#FF985B`, and an 11px circular thumb in pure white with a 2px `#111317` outline.

### Checkboxes & Switches
- **Checkboxes**: 14px × 14px square (`rounded: 3px`), border `1px solid #333539`. Checked state is filled with `#FF985B` displaying a dark `#111317` checkmark.
- **Toggle Switch**: 28px width pill; when active, the track fills with `#FF985B` and translates a white knob smoothly.

### Keyboard Shortcut Badges (`<kbd>`)
- Monospaced badge: `#1E2024` background, `1px solid #282A2E` perimeter with a subtle bottom edge `2px solid #22252A`, displaying system monospace text in `#9CA3AF`.

### Swatch Pickers & Tooltips
- **Swatches**: 18px diameter circles. Selected swatch receives an exterior 1.5px white ring separated by a 2px dark gap.
- **Tooltips**: High-density `#0C0E12` shell, `1px solid #333539` border, displaying high-contrast `#E2E2E8` text accompanied by inline shortcut `<kbd>` tokens.
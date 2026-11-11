---
name: Nook
description: Bright-aisle Market Hall Wayfinding design system for the Nook self-hosted household OS
colors:
  route-grocery: "#D9381E"
  route-grocery-hover: "#B92B14"
  route-stock: "#047857"
  route-stock-hover: "#065F46"
  route-finance: "#1D4ED8"
  route-finance-hover: "#1E40AF"
  route-house: "#6D28D9"
  route-house-hover: "#5B21B6"
  signal-amber: "#B45309"
  enamel-ground: "#F7F5EE"
  enamel-bay: "#EFECE2"
  enamel-plate: "#FAF9F4"
  enamel-settled: "#F2EFE6"
  enamel-ink: "#14191D"
  enamel-settled-ink: "#43494E"
  enamel-muted: "#5B6268"
  enamel-rule: "#D6D1C4"
  enamel-rule-soft: "#E2DDD0"
  rail-active: "#1D2329"
  rail-divider: "#2A3137"
  rail-muted: "#A1AAB3"
typography:
  display:
    fontFamily: '"Archivo", "Public Sans", sans-serif'
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Archivo", "Public Sans", sans-serif'
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  label:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  micro: "2px"
  control: "3px"
  plate: "4px"
  drawer-top: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-grocery:
    backgroundColor: "{colors.route-grocery}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "10px 16px"
    height: "44px"
  button-grocery-hover:
    backgroundColor: "{colors.route-grocery-hover}"
    textColor: "#FFFFFF"
  button-stock:
    backgroundColor: "{colors.route-stock}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "10px 16px"
    height: "44px"
  button-stock-hover:
    backgroundColor: "{colors.route-stock-hover}"
    textColor: "#FFFFFF"
  button-finance:
    backgroundColor: "{colors.route-finance}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "10px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.enamel-plate}"
    textColor: "{colors.enamel-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "44px"
  enamel-plate:
    backgroundColor: "{colors.enamel-plate}"
    textColor: "{colors.enamel-ink}"
    rounded: "{rounded.plate}"
    padding: "16px"
  input-enamel:
    backgroundColor: "{colors.enamel-ground}"
    textColor: "{colors.enamel-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "10px 12px"
    height: "40px"
  route-switch:
    backgroundColor: "{colors.enamel-bay}"
    textColor: "{colors.enamel-ink}"
    typography: "{typography.body}"
    padding: "10px 12px"
    height: "44px"
  rail-dock:
    backgroundColor: "{colors.enamel-ink}"
    textColor: "{colors.enamel-ground}"
---

# Design System: Nook

## Overview

**Creative North Star: "Market Hall Wayfinding"**

Nook is engineered for bright-aisle supermarket runs, kitchen pantry checks, and monthly household reviews on a self-hosted homelab. Its visual system takes its cues from European market hall signage and vitreous enamel plates: warm cream enamel grounds, deep charcoal transit rails, crisp `1px` hairline divisions, and unmistakable pillar color routes that separate Grocery, Pantry Stock, Finance, and House without decorative noise.

Instead of soft pastel cards, floating drop shadows, or oversized pill chrome, Nook organizes operational data into dense, high-contrast hairline checklists and aligned tabular numeric columns. Pending items sit above settled ones, active route bars anchor the top and bottom edges of the screen, and critical one-handed triggers—checking off items, scanning barcodes, and unpacking groceries into stock—remain within immediate thumb reach.

**Key Characteristics:**
- **Vitreous Enamel Surfaces:** Warm cream grounds (`#F7F5EE`), secondary bay tints (`#EFECE2`), and crisp row plates (`#FAF9F4`) eliminate harsh pure-white glare under bright store lighting.
- **Zero-Shadow Hairline Structure:** Boundaries are drawn strictly with `1px` warm mineral rules (`#D6D1C4` / `#E2DDD0`) and `3px` route bars—never blurred drop shadows or glowing buttons.
- **Pillar Color Routes:** Four distinct operational lines—Signal Vermilion (`#D9381E`), Market Emerald (`#047857`), Cobalt Route (`#1D4ED8`), and Plum Route (`#6D28D9`)—identify each household domain at a glance.
- **Locked Tabular Columns:** Quantities, unit prices, and euro totals stay right-aligned in `tabular-nums` across both pending and collected rows so totals scan vertically without horizontal jitter.

## Colors

The palette pairs warm architectural enamel neutrals with four high-contrast transit route colors and one amber caution signal.

### Primary
- **Signal Vermilion** (`route-grocery`): High-visibility red-orange used for active Grocery Cart route bars, the Barcode Scanner trigger, `Add to Cart` restock alerts, the `3px` cart progress meter, and primary `Save` / `Create Nook` commits.
- **Signal Vermilion Hover** (`route-grocery-hover`): Pressed and hover state for Signal Vermilion triggers.

### Secondary
- **Market Emerald** (`route-stock`): Used for the Pantry Stock route bar, the `Arrived Home? Unpack to Stock` transfer CTA, collected checklist checkmarks, settled line totals, and `In Stock` / `Paid` verification markers.
- **Market Emerald Hover** (`route-stock-hover`): Hover and active transition for Market Emerald triggers.

### Tertiary
- **Cobalt Route** (`route-finance`): Dedicated to the Finance pillar route bar, the `1-Tap Settle` ledger CTA, monthly budget meter fill, and receipt attachment controls.
- **Cobalt Route Hover** (`route-finance-hover`): Hover state for Cobalt Route actions.
- **Plum Route** (`route-house`): Dedicated to the House pillar route bar, appliance zone tags, PDF manual icons, chore cadence timestamps, and `MinIO Vault` indicators.
- **Plum Route Hover** (`route-house-hover`): Hover state for Plum Route actions.
- **Ochre Signal** (`signal-amber`): Reserved exclusively for low-stock warning banners, `Running Low` inventory markers, and urgent appliance maintenance alerts.

### Neutral
- **Enamel Cream Ground** (`enamel-ground`): Global viewport canvas, active route-switch tab surface, and form input background inside plates.
- **Secondary Bay Tint** (`enamel-bay`): Recessed surface for route-switch strips, section sub-headers (`To Buy`, `Zone Stock`), search bars, and secondary buttons.
- **Enamel Plate** (`enamel-plate`): Active checklist rows, inventory rows, appliance rows, `.enamel-plate` cards, and bottom-sheet drawer surfaces.
- **Settled Row Tint** (`enamel-settled`): Quiet recessed row background for collected cart items, completed chores, and logged maintenance tasks.
- **Rail Charcoal** (`enamel-ink`): Primary text ink, sticky top bar background, mobile bottom dock background, desktop left route rail background, and crisp `2px` checkbox strokes.
- **Settled Charcoal** (`enamel-settled-ink`): Strikethrough item titles and secondary metadata on `#F2EFE6` settled rows, preserving `>= 4.5:1` contrast.
- **Muted Slate** (`enamel-muted`): Column headers, secondary item metadata, units, and inactive route labels on light enamel surfaces.
- **Primary Hairline Rule** (`enamel-rule`): `1px` structural borders dividing summary bands, bay bars, desktop workspace edges, and enamel plates.
- **Soft Row Rule** (`enamel-rule-soft`): `1px` horizontal dividers separating stacked list rows.
- **Rail Active Surface** (`rail-active`), **Rail Divider** (`rail-divider`), **Rail Muted Ink** (`rail-muted`): Dark-rail surface stepping, `1px` dividers, and secondary ink inside the `#14191D` header, bottom dock, desktop sidebar, and scanner drawer.

### Named Rules
**The Pillar Route Rule.** Every primary domain owns one route color (`#D9381E` Grocery, `#047857` Pantry Stock, `#1D4ED8` Finance, `#6D28D9` House). Route colors appear on `3px` active rail/tab borders, progress meters, and domain-specific primary CTAs—never mixed decoratively across domains.
**The Settled Contrast Rule.** Collected or completed rows step down from `#FAF9F4` to `#F2EFE6` and shift text to `#43494E` rather than fading via low opacity, guaranteeing legible strike-through contrast in bright daylight.

## Typography

**Display Font:** `"Archivo"` (with `"Public Sans", sans-serif` fallback; self-hosted via `@fontsource/archivo` weights `700` and `800`)  
**Body Font:** `"Public Sans"` (with `sans-serif` fallback; self-hosted via `@fontsource/public-sans` weights `400`, `600`, `700`, and `800`)  
**Label/Mono Font:** `"Public Sans"` for uppercase tracking headers; system monospace (`font-mono`) for raw EAN/UPC barcode digits in scanner and catalog drawers.

**Character:** Compact, utilitarian transit signage. `Archivo` brings sturdy geometric shoulders to trip titles and euro totals, while `Public Sans` keeps dense list rows, units, and control labels crisp at `12px–14px` with `-0.01em` base tracking.

### Hierarchy
- **Display** (800 weight, `1.375rem` / `22px`, line-height `1.25`, tracking `-0.03em`): Page summary headings (`Supermarket Run`, `Home Stock Inventory`, `Appliance Dossiers`) and primary right-aligned euro/burn-rate totals.
- **Headline** (800 weight, `1rem` / `16px`, line-height `1.25`, tracking `-0.02em`): Top bar `Nook` wordmark and `Vaul` bottom drawer titles (`Arrived Home? Unpack to Stock`, `In-Store Barcode Scanner`).
- **Title** (700 weight, `0.875rem` / `14px`, line-height `1.4`, tracking `-0.01em`): Pending checklist item names, stock product titles, appliance names, chore titles, and desktop rail labels.
- **Body** (600 / 700 / 800 weight, `0.75rem` / `12px`, line-height `1.4`, tracking `-0.01em`): Action buttons, inline form controls, secondary bay metadata, and route sub-tab labels.
- **Label** (800 weight, `0.6875rem` / `11px`, line-height `1.2`, tracking `0.06em`, uppercase): Bay section headers (`TO BUY`, `COLLECTED IN CART`, `HOUSEHOLD ROUTES`), column captions, and percentage readouts (`% COLLECTED`, `% USED`).

### Named Rules
**The Tabular Lock Rule.** Every numeric column—euro totals, unit prices, quantity steppers, stock counts, and cadence dates—must apply `font-variant-numeric: tabular-nums` so numbers align vertically across rows.
**The Proportional Signal Rule.** Status markers scale in size and geometry with urgency rather than relying on color alone: a `6px` (`w-1.5 h-1.5`) circle for nominal `In Stock` / `Paid`, an `8px` (`w-2 h-2`, `2px` radius) square for `Running Low`, and a `10px` (`w-2.5 h-2.5`, `1px` radius) block for `Out of Stock` / `Urgent`.

## Layout

Nook transitions seamlessly from a full-bleed single-column mobile workspace to a two-column desktop market hall layout constrained to `max-w-6xl` (`1152px`) centered with `1px` outer border rules (`#D6D1C4`).

- **Mobile Navigation (`< 768px`):** Sticky dark charcoal `Header` at the top and a 5-column sticky `BottomDock` (`Grocery`, `Pantry`, `Scan`, `Finance`, `House`) at the bottom. High-frequency actions like `Arrived Home? Unpack to Stock` live in normal document flow inside a `#EFECE2` bay bar so list rows are never occluded.
- **Desktop Workspace (`>= 768px`):** The `BottomDock` hides and a `224px` left charcoal route rail (`aside`) anchors the four household routes alongside a dedicated `Scan Barcode` vermilion button. Inside `FinancePage`, desktop splits into a `320px` summary column and a `1fr` transaction table divided by a `1px` vertical rule.
- **Submodule Route Switches:** Multi-view pages (`GroceryPage` 2-column, `FinancePage` 3-column, `HousePage` 3-column) sit flush beneath the header in full-bleed `#EFECE2` grids with `1px` column dividers and `3px` active bottom route bars.
- **Spacing Rhythm:** Base density steps in `4px` increments (`4px`, `8px`, `12px`, `16px`, `20px`), with `16px` (`px-4`) horizontal gutter on summary bands and `12px–16px` (`px-3 sm:px-4`) on checklist rows.

## Elevation & Depth

Nook uses **zero box shadows**. Depth and hierarchy are communicated exclusively through surface value stepping, `1px` mineral hairline borders, and `3px` weighted route indicators:

1. **Ground (`#F7F5EE`):** Global canvas and summary header bands.
2. **Recessed Bay (`#EFECE2`):** Route-switch strips, search/filter bars, section headers, and inline add/unpack trays.
3. **Active Plate (`#FAF9F4`):** Pending checklist rows, stock items, `.enamel-plate` setup cards, and light bottom drawers (`Vaul`).
4. **Settled Row (`#F2EFE6`):** Checked-off grocery items, logged maintenance tasks, and completed chores.
5. **Transit Rail (`#14191D`):** Sticky top header, bottom mobile dock, desktop left rail, and dark barcode scanner drawer.

### Named Rules
**The Zero-Ghost-Shadow Rule.** Never apply diffuse drop shadows (`box-shadow`) to cards, buttons, docks, or drawers. Separate layers with `1px` borders (`#D6D1C4`, `#E2DDD0`, or `#14191D` on interactive menus) and tonal stepping between `#F7F5EE`, `#EFECE2`, `#FAF9F4`, and `#F2EFE6`.

## Shapes

Nook rejects pill buttons and large bubbly cards in favor of crisp architectural enamel rectangles:

- **Micro Tags & Dots (`2px` radius):** Header route marker squares, barcode pills, `MinIO Vault` / `Paid` / `Household Admin` micro-badges, drawer drag handles, and skeleton placeholders.
- **Controls & Checkboxes (`3px` radius):** `20px` square checklist checkboxes (`border-2 border-[#14191D]`), `- / qty / +` quantity steppers, location filter chips, status cycle badges, and inline row buttons (`+ Add Item`, `PDF`, `QR`, `Log Done`, `Add to Cart`).
- **Plates, Inputs & Primary CTAs (`4px` radius):** `.enamel-plate` / `.enamel-bay` containers, primary domain action buttons, the `Scan` dock button, form inputs, and scanner viewfinder frames.
- **Drawer Apex (`8px` top-only radius):** `Vaul` bottom sheets (`rounded-t-[8px]`) topped with a `3px` route border (`#047857` for Unpack, `#D9381E` for Scanner and Product Digitalize) and a centered `40px × 4px` (`w-10 h-1`) grab bar.

## Components

### Buttons
- **Shape:** Architectural rectangle with `4px` radius for primary block CTAs and `3px` radius for compact row/inline actions. Primary controls enforce a minimum `44px` height (`min-h-[44px]`).
- **Primary Grocery / Scan (`button-grocery`):** `#D9381E` fill (`#B92B14` hover), `#FFFFFF` `12px` `800`-weight text, `4px` radius, `10px 16px` padding, `active:scale-[0.99]`.
- **Market Emerald Unpack (`button-stock`):** `#047857` fill (`#065F46` hover), `#FFFFFF` `12px` `800`-weight text, `4px` radius, full-width bar layout with leading Home icon and trailing arrow.
- **Cobalt Settle (`button-finance`):** `#1D4ED8` fill (`#1E40AF` hover), `#FFFFFF` `12px` `800`-weight text, `4px` radius.
- **Secondary / Control (`button-secondary`):** `#FAF9F4` or `#F7F5EE` fill with `1px solid #D6D1C4` (or `#14191D` for high-emphasis inline `+ Add Item`), `#14191D` text, `3px` radius.

### Chips & Badges
- **Location Filter Chips:** `40px` min-height, `3px` radius, `12px` `800`-weight text. Active chip flips to `#14191D` background with `#F7F5EE` text; inactive sits on `#FAF9F4` with `#D6D1C4` border.
- **Proportional Status Badges:** `3px` radius, `10px` `800`-weight text pairing a proportional shape marker with semantic tint surfaces: `In Stock` (`#ECFDF5` / `#A7F3D0` / `#065F46`), `Running Low` (`#FEF3C7` / `#F59E0B` / `#92400E`), and `Out of Stock` (`#FEE2E2` / `#FCA5A5` / `#991B1B`).

### Cards / Containers
- **Corner Style:** `4px` (`enamel-plate` / `enamel-bay`) or full-bleed `0px` stacked checklist rows separated by `1px` `#E2DDD0` bottom rules.
- **Background:** `#FAF9F4` for active rows and containers; `#F2EFE6` for settled rows; `#EFECE2` for nested form trays and summary bays.
- **Shadow Strategy:** None (`0px` blur); `1px` structural borders (`#D6D1C4` or `#14191D` on open inline forms/menus).
- **Internal Padding:** `12px–16px` (`p-3.5` to `p-4`) on trays and setup plates; `6px–10px` vertical × `12px–16px` horizontal on dense list rows.

### Inputs / Fields
- **Style:** `#F7F5EE` (or `#FAF9F4` inside `#EFECE2` search bays), `1px solid #D6D1C4`, `4px` radius, `12px–14px` `600–700`-weight text, `10px 12px` padding.
- **Focus:** `outline: none` with `border-color` shifting to the active domain route (`#D9381E` in Cart/Setup/Product, `#047857` in Stock search, `#1D4ED8` in Unpack expense input); global `:focus-visible` uses a `2px solid #D9381E` outline with `2px` offset.

### Navigation
- **Top Enamel Header (`Header`):** Sticky `#14191D` bar with a `3px` bottom border colored by the active route, a `10px` (`2px`-radius) route square, `16px` `Archivo` `Nook` wordmark, pipe-separated active route name, and a `#FAF9F4` / `#14191D`-bordered profile dropdown.
- **Mobile Bottom Dock (`BottomDock`):** Sticky `#14191D` 5-column grid (`md:hidden`) with `1px solid #2A3137` top rule. Route tabs render `3px` top indicator borders (`#D9381E`, `#047857`, `#1D4ED8`, `#6D28D9`) over `#1D2329` active fills; center `Scan` tile sits in-grid as a `4px`-radius `#D9381E` button.
- **Desktop Left Rail (`aside`):** `224px` fixed-width `#14191D` sidebar (`md:flex`) with `3px` left active route borders, `1px solid #2A3137` row dividers, and a full-width `#D9381E` `Scan Barcode` CTA.

### Signature Component: Enamel Checklist, Unpack Sheet & Barcode Viewfinder
- **Checklist Row:** `44px` hit target wrapping a `20px` (`w-5 h-5`, `3px` radius) `2px`-stroked checkbox, item title + storage zone metadata, inline `- / qty / +` stepper (`3px` radius), and a fixed `68px` right-aligned `tabular-nums` euro column. Mobile splits stepper and delete controls onto a clean indented sub-row so product names never truncate prematurely.
- **Unpack & Digitalize Bottom Drawers (`Vaul`):** `#FAF9F4` surface anchored to the bottom (`rounded-t-[8px]`) with a `3px` top route band (`#047857` or `#D9381E`), `1px`-divided stock transfer manifest, optional Finance receipt logger, and `44px` action bar.
- **Barcode Viewfinder Drawer:** Dark `#14191D` `Vaul` drawer (`border-t-[3px] border-[#D9381E]`) framing a `300px` square camera viewport with pulsing `#D9381E` reticle corners (`animate-reticle`), `#F59E0B` active torch toggle, dark catalog match card (`#1D2329`), and inline manual EAN fallback.

## Do's and Don'ts

### Do:
- **Do** build surfaces from the four enamel neutrals (`#F7F5EE`, `#EFECE2`, `#FAF9F4`, `#F2EFE6`) separated by `1px` rules (`#D6D1C4` / `#E2DDD0`).
- **Do** enforce `tabular-nums` on every price, quantity stepper, stock count, and budget readout.
- **Do** keep primary interactive buttons, checklist toggles, and route switches at least `44px` tall (`min-h-[44px]`).
- **Do** pair domain route colors (`#D9381E`, `#047857`, `#1D4ED8`, `#6D28D9`) with explicit `3px` borders or `1px`-bordered proportional badges rather than decorative gradients.
- **Do** provide instant optimistic list updates paired with subtle haptic pulses (`navigator.vibrate?.(15..50)`).

### Don't:
- **Don't** add drop shadows (`box-shadow`) or blurred glass backdrops to cards, buttons, docks, or drawers.
- **Don't** use `9999px` pill radii on buttons, filter chips, or navigation docks; reserve `rounded-full` strictly for `6px` nominal status indicator dots.
- **Don't** fade completed/collected rows with low CSS opacity; use the `#F2EFE6` settled plate and `#43494E` ink to maintain `>= 4.5:1` legibility.
- **Don't** use pure `#FFFFFF` as the global viewport background or mix route colors across unrelated domains.

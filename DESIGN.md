---
name: Nook
description: Fresh Botanical Capsules design system with Lexend + Nunito Sans for the Nook self-hosted household OS
colors:
  botanical-ground: "#F4F9F5"
  botanical-surface: "#FFFFFF"
  botanical-collected: "#EEF7F0"
  botanical-tint: "#DCFCE7"
  botanical-border: "#E2ECE4"
  botanical-settled-border: "#CDE5D3"
  botanical-ring: "#86EFAC"
  botanical-ink: "#14201A"
  botanical-settled-ink: "#475B4E"
  botanical-muted: "#5B6B61"
  leaf-fill: "#15803D"
  leaf-fill-hover: "#166534"
  leaf-accent: "#16A34A"
  coral-punch: "#FF6B4A"
  coral-punch-hover: "#FF5530"
  finance-fill: "#0369A1"
  finance-fill-hover: "#075985"
  finance-accent: "#0284C7"
  finance-tint: "#E0F2FE"
  house-accent: "#7C3AED"
  house-ink: "#6D28D9"
  house-tint: "#EDE9FE"
  amber-signal: "#D97706"
  amber-tint: "#FEF3C7"
  amber-ink: "#92400E"
  danger-fill: "#DC2626"
  danger-tint: "#FEE2E2"
  danger-ink: "#991B1B"
  scanner-surface: "#0F1B14"
  scanner-card: "#16271D"
  scanner-border: "#1F3528"
  scanner-muted: "#A7C4B2"
typography:
  display:
    fontFamily: '"Lexend", "Nunito Sans", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Lexend", "Nunito Sans", sans-serif'
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Lexend", "Nunito Sans", sans-serif'
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: '"Nunito Sans", sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  dock-item: "12px"
  inner-tray: "16px"
  card: "18px"
  drawer-top: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-leaf:
    backgroundColor: "{colors.leaf-fill}"
    textColor: "{colors.botanical-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
    height: "48px"
  button-leaf-hover:
    backgroundColor: "{colors.leaf-fill-hover}"
    textColor: "{colors.botanical-surface}"
  button-coral:
    backgroundColor: "{colors.coral-punch}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "44px"
  button-coral-hover:
    backgroundColor: "{colors.coral-punch-hover}"
    textColor: "{colors.botanical-ink}"
  button-finance:
    backgroundColor: "{colors.finance-fill}"
    textColor: "{colors.botanical-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.botanical-surface}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "44px"
  botanical-card:
    backgroundColor: "{colors.botanical-surface}"
    textColor: "{colors.botanical-ink}"
    rounded: "{rounded.card}"
    padding: "14px"
  botanical-card-settled:
    backgroundColor: "{colors.botanical-collected}"
    textColor: "{colors.botanical-settled-ink}"
    rounded: "{rounded.card}"
    padding: "10px 14px"
  input-pill:
    backgroundColor: "{colors.botanical-surface}"
    textColor: "{colors.botanical-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px 8px 40px"
    height: "44px"
  segmented-switch:
    backgroundColor: "{colors.leaf-fill}"
    textColor: "{colors.botanical-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "44px"
  dock-chrome:
    backgroundColor: "{colors.botanical-surface}"
    textColor: "{colors.botanical-muted}"
---

# Design System: Nook

## Overview

**Creative North Star: "Fresh Botanical Capsules"**

Nook is a self-hosted household and life operating system built for bright-aisle supermarket runs, kitchen pantry checks, and monthly household reviews on mobile and desktop. Its Fresh Botanical Capsules visual system pairs a sunlit mint-tinted daylight canvas with crisp pure-white rounded cards, `1px` sage-mineral borders, wide-aperture `Lexend` + `Nunito Sans` typography, and high-contrast pill-capsule controls.

Instead of heavy dark chrome, dense tabular grids, or floating drop shadows, Nook separates operational states through clean value stepping and organic geometry. Pending items sit inside luminous white `18px` cards with circular green-ring checkboxes, collected items settle softly onto muted mint cards, sticky bottom capsules keep one-handed unpacking and barcode scanning within natural thumb reach, and four calibrated domain hues separate Grocery, Pantry Stock, Finance, and House without visual clutter.

**Key Characteristics:**
- **Sunlit Botanical Surfaces:** Cool mint ground (`#F4F9F5`), pure white cards (`#FFFFFF`), and settled mint cards (`#EEF7F0`) deliver effortless daylight legibility without heavy box shadows.
- **Tactile Pill Capsules:** Segmented switches, filter chips, quantity steppers, status badges, and primary CTAs share full-pill (`9999px`) silhouettes anchored to `>= 44px` touch targets.
- **Wide-Aperture Legibility:** `Lexend` display titles and numeric totals pair with `Nunito Sans` list copy and `tabular-nums` alignment for fast scanning in motion.
- **Calibrated Domain Accents:** WCAG-AA Leaf Green (`#15803D`) and vibrant Leaf Accent (`#16A34A`) anchor Grocery and Stock, Coral Punch (`#FF6B4A`) drives Barcode Scanning and urgent restocks, Sky Blue (`#0369A1` / `#0284C7`) governs Finance, and Iris Violet (`#7C3AED` / `#6D28D9`) identifies House management.

## Colors

The palette pairs cool sunlit botanical neutrals with four domain-specific accents and calibrated semantic tints.

### Primary
- **Leaf Fill** (`leaf-fill`): Deep botanical green (`#15803D`) guaranteeing WCAG-AA white-text contrast on active Grocery/Pantry pill tabs, primary `Arrived Home? Unpack to Stock` / `Add to Cart` / `Create Nook` CTAs, progress bar fills, and collected line-item totals.
- **Leaf Fill Hover** (`leaf-fill-hover`): Pressed and hover state (`#166534`) for Leaf Fill buttons.
- **Leaf Accent** (`leaf-accent`): Saturated botanical green (`#16A34A`) reserved for non-text dots, focus-visible outlines, text selection, caret color, filled circular checkboxes, and positive ledger balances.

### Secondary
- **Coral Punch** (`coral-punch`): High-visibility warm coral (`#FF6B4A`) dedicated to the `Scan` dock capsule, desktop `Scan Barcode` trigger, urgent `Add to Cart` restock buttons on low/empty stock rows, and the scanner viewfinder reticle. Always paired with Deep Pine Ink (`#14201A`) rather than white text to preserve contrast.
- **Coral Punch Hover** (`coral-punch-hover`): Hover and active state (`#FF5530`) for Coral Punch triggers.

### Tertiary
- **Finance Fill** (`finance-fill`) & **Finance Accent** (`finance-accent`): Deep sky blue (`#0369A1`, hover `#075985`) for active Finance sub-tabs and `1-Tap Settle` CTAs, paired with `#0284C7` for progress fills, receipt icons, and expense checkboxes over `#E0F2FE` tint surfaces.
- **House Accent** (`house-accent`) & **House Ink** (`house-ink`): Iris violet (`#7C3AED`) for active House sub-tabs and document icons, paired with `#6D28D9` text on `#EDE9FE` tint badges and desktop route rows.
- **Amber Signal** (`amber-signal`), **Danger Fill** (`danger-fill`): Semantic alerts—Amber (`#D97706` marker on `#FEF3C7` / `#92400E`) for `Running Low` stock and urgent maintenance timers; Red (`#DC2626` button/marker on `#FEE2E2` / `#991B1B`) for `Out of Stock`, error banners, and sign-out actions.

### Neutral
- **Botanical Ground** (`botanical-ground`): Global daylight mint viewport canvas (`#F4F9F5`), secondary button fill, and input field ground inside white cards/drawers.
- **Botanical Surface** (`botanical-surface`): Pure white surface (`#FFFFFF`) for `.botanical-card` containers, sticky `Header`, mobile `BottomDock`, desktop left sidebar, light `Vaul` drawers, and stock search inputs.
- **Collected Card Tint** (`botanical-collected`): Soft mint surface (`#EEF7F0`) for `.botanical-card-settled` collected grocery items and logged maintenance cards.
- **Botanical Tint** (`botanical-tint`): Pale mint-leaf fill (`#DCFCE7`) for active desktop/mobile Grocery & Pantry navigation pills, total cost pills, and `In Stock` badges.
- **Botanical Border** (`botanical-border`) & **Settled Border** (`botanical-settled-border`): Crisp `1px` structural hairline strokes (`#E2ECE4` on white surfaces, `#CDE5D3` on settled cards, `#86EFAC` for active ring accents and interactive hover borders).
- **Deep Pine Ink** (`botanical-ink`): Primary text (`#14201A`), active location filter chip fill, `Log Done` primary neutral button, and ink on Coral Punch buttons.
- **Settled Pine Ink** (`botanical-settled-ink`) & **Muted Sage Ink** (`botanical-muted`): `#475B4E` for strikethrough settled titles, form labels, and secondary settled details; `#5B6B61` for metadata subtitles, inactive route labels, and input placeholders.
- **Scanner Dark Botanical** (`scanner-surface`, `scanner-card`, `scanner-border`, `scanner-muted`): Deep forest-night drawer (`#0F1B14`) with `#16271D` catalog match cards, `#1F3528` borders, and `#A7C4B2` readable muted sage labels around the live camera viewfinder.

### Named Rules
**The Accessible Fill Split Rule.** Use `#15803D` (`leaf-fill`) and `#0369A1` (`finance-fill`) whenever white text sits inside a solid pill or button; reserve `#16A34A` (`leaf-accent`) for dots, borders, focus rings, and checkmark fills, and pair `#FF6B4A` (`coral-punch`) exclusively with `#14201A` dark pine ink.
**The Settled Mint Contrast Rule.** Checked-off cart items and completed maintenance tasks shift from `#FFFFFF` / `#E2ECE4` to `#EEF7F0` / `#CDE5D3` with `#475B4E` text rather than dimming with low CSS opacity, keeping strikethrough items crisp in sunlight.

## Typography

**Display Font:** `"Lexend"` (with `"Nunito Sans", sans-serif` fallback; self-hosted via `@fontsource/lexend` weights `600`, `700`, `800`)  
**Body Font:** `"Nunito Sans"` (with `sans-serif` fallback; self-hosted via `@fontsource/nunito-sans` weights `500`, `600`, `700`, `800`)  
**Label/Mono Font:** `"Nunito Sans"` for form labels, metadata, and badge captions; `Lexend` at `10px–12px` (`700–800`) on pill switches, status chips, and uppercase `SCAN` dock labels.

**Character:** Open, friendly, daylight-first legibility. `Lexend` softens page headings and price totals with generous letter apertures and relaxed tracking (`-0.025em` to `-0.02em`), while `Nunito Sans` keeps multi-item grocery rows, brand notes, and unit labels effortless to scan at `12px–14px`.

### Hierarchy
- **Display** (`Lexend` 800, `1.5rem` / `24px`, line-height `1.2`, tracking `-0.025em`): Finance monthly spend and burn-rate hero figures (`€248.50`, `€148.90/mo`).
- **Headline** (`Lexend` 700, `1.3125rem` / `21px`, line-height `1.25`, tracking `-0.025em`): View headers (`Supermarket Run`, `Home Stock Inventory`, `Groceries & Household`, `Appliance Dossiers`, `Welcome to Nook`).
- **Title** (`Lexend` 700–800, `1rem–1.125rem` / `16px–18px`, line-height `1.25`, tracking `-0.02em`): Top bar `Nook` wordmark (`18px` 800-weight) and `Vaul` bottom drawer titles (`16px` 700-weight).
- **Body** (`Nunito Sans` 600–700, `0.875rem` / `14px` item titles and `0.75rem` / `12px` metadata, line-height `1.4`): Primary card titles, storage locations, brand subtitles, and input values.
- **Label** (`Nunito Sans` / `Lexend` 700–800, `0.6875rem–0.75rem` / `11px–12px`, line-height `1.2`): Route pill badges, form field labels, barcode chips, segmented tabs, and `BottomDock` captions.

### Named Rules
**The Tabular Lock Rule.** Apply `font-variant-numeric: tabular-nums` (`.tabular-nums`) to every currency figure, cart percentage, quantity stepper, stock count, warranty serial, and barcode readout so columns align without horizontal jitter.

## Layout

Nook adapts between an independently scrolling single-column mobile shell (`< 768px`) and a framed two-column desktop workspace (`>= 768px`, `max-w-6xl` / `1152px` centered).

- **Mobile App Shell (`< 768px`):** `h-[100dvh] overflow-hidden flex flex-col` frames a sticky white `Header` at the top, an independently scrollable workspace (`max-w-md mx-auto px-4 pt-4`), and a pinned 5-column white `BottomDock` (`Grocery`, `Pantry`, `Scan`, `Finance`, `House`) at the bottom. Inside `ShoppingCartView`, the `Arrived Home? Unpack to Stock` pill bar pins cleanly (`sticky bottom-0 z-20 bg-[#F4F9F5]/95 pt-2 pb-1`) whenever at least one item is collected.
- **Desktop Workspace (`>= 768px`):** `BottomDock` hides and the workspace switches to `md:grid md:grid-cols-[248px_1fr] md:gap-6 md:px-6 md:py-6 md:items-start`. A framed white `.botanical-card` left sidebar (`248px` wide, `sticky top-[84px] p-3.5`) houses the four household routes (`rounded-2xl` items), an `#E2ECE4`-divided `#FF6B4A` `Scan Barcode` pill CTA, and the `Project Janus · Self-Hosted` footer label.
- **Domain Grids & Spacing Rhythm:** `FinancePage` splits into `md:grid-cols-[300px_1fr] md:gap-4` (summary card alongside trip/ledger cards). Spacing steps on a `4px` base scale (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`) with `10px–14px` vertical card gaps (`space-y-2.5` / `space-y-3.5`).

## Elevation & Depth

Nook uses a **border-defined flat botanical hierarchy** rather than blurred elevation shadows on primary cards, buttons, docks, and drawers:

1. **Daylight Ground (`#F4F9F5`):** Viewport backdrop, sticky unpack tray backing, and nested form inputs inside white containers.
2. **Primary Card & Chrome (`#FFFFFF` + `1px solid #E2ECE4`):** `.botanical-card` list rows, summary cards, sticky `Header`, `BottomDock`, framed desktop sidebar, and light `Vaul` bottom sheets.
3. **Settled Card (`#EEF7F0` + `1px solid #CDE5D3`):** `.botanical-card-settled` collected grocery items and logged maintenance rows.
4. **Tinted Callouts & Badges:** `#DCFCE7` (leaf), `#E0F2FE` (sky), `#EDE9FE` (iris), `#FEF3C7` (amber), `#FEE2E2` (danger), and `#FFF1EE` (coral feedback).
5. **Dark Viewfinder Sheet (`#0F1B14` + `1px solid #1F3528`):** Dedicated high-contrast camera drawer (`BarcodeScannerModal`) over a `#14201A`/70% backdrop scrim.

### Named Rules
**The Clean Botanical Border Rule.** Define card and drawer boundaries with `1px` botanical borders (`#E2ECE4` or `#CDE5D3`, shifting to `#86EFAC` or `#C4B5FD` on hover) rather than drop shadows or glass blur.

## Shapes

Nook builds every interactive surface from soft organic capsules and rounded botanical rectangles:

- **Full-Pill Capsules (`9999px` radius):** Segmented sub-navigation switches, primary and secondary action buttons, `Scan` / `Scan Barcode` triggers, location filter chips, `+ / qty / -` steppers, stock status badges, search inputs, circular `22px` checkboxes, and `8px–10px` status indicator dots.
- **Dock Route Tiles (`12px` radius):** Mobile `BottomDock` route tabs (`rounded-xl`) inside the 5-column white footer bar.
- **Nested Trays & Sidebar Items (`16px` radius):** Desktop sidebar route buttons (`rounded-2xl`), stacked form inputs, notice banners, photo capture tiles, and unpack transfer manifests.
- **Botanical Cards (`18px` radius):** `.botanical-card` and `.botanical-card-settled` containers (`rounded-[18px]`), plus scanner viewfinder frames (`20px` / `rounded-[20px]`).
- **Bottom Sheet Apex (`24px` top-only radius):** `Vaul` drawers (`rounded-t-[24px]`) topped with a centered `40px × 6px` (`w-10 h-1.5 rounded-full`) drag handle.

## Components

### Buttons
- **Shape:** Full pill (`9999px`) across all primary, secondary, and inline row actions, enforcing `min-h-[44px]` (`48px` on full-width drawer/unpack commits and `40px` on compact `+ Add Item` triggers).
- **Primary Leaf CTA (`button-leaf`):** `#15803D` fill (`#166534` hover), `#FFFFFF` `Lexend` `700`-weight text, `9999px` radius, `12px 20px` padding, `active:scale-[0.99]`.
- **Coral Scanner / Urgent CTA (`button-coral`):** `#FF6B4A` fill (`#FF5530` hover), `#14201A` deep pine `Lexend` `800`-weight text, `9999px` radius, `min-h-[44px]`. Used for `Scan`, `Scan Barcode`, `Add to Cart` on low/out-of-stock rows, and scanner actions.
- **Finance Sky CTA (`button-finance`):** `#0369A1` fill (`#075985` hover), `#FFFFFF` `Lexend` `700`-weight text, `9999px` radius.
- **Secondary Pill (`button-secondary`):** `#FFFFFF` or `#F4F9F5` fill with `1px solid #E2ECE4`, `#14201A` text, `hover:bg-[#EEF7F0]`, `9999px` radius.

### Chips & Badges
- **Segmented Domain Switches:** `flex gap-2` row of `flex-1 min-h-[44px] rounded-full` `Lexend` `800`-weight buttons. Active state fills with domain color (`#15803D` Grocery, `#0369A1` Finance, `#7C3AED` House) and `#FFFFFF` text; inactive stays `#FFFFFF` with `1px solid #E2ECE4` and `#5B6B61` text.
- **Zone Filter Chips:** `min-h-[44px] px-4 rounded-full` pills; active selection flips to `#14201A` fill with `#FFFFFF` text.
- **Status Badges:** Full-pill (`9999px`) badges pairing a status dot (`w-2 h-2 rounded-full` `#16A34A` for `In Stock`, `w-2.5 h-2.5 rounded-full` `#D97706` for `Running Low`, `w-2.5 h-2.5 rounded-[3px]` `#DC2626` for `Out of Stock`) with `#DCFCE7` / `#FEF3C7` / `#FEE2E2` tinted fills.

### Cards / Containers
- **Corner Style:** `18px` radius (`.botanical-card` and `.botanical-card-settled`).
- **Background:** `#FFFFFF` for active items and summary widgets; `#EEF7F0` for collected cart items and completed maintenance tasks.
- **Shadow Strategy:** None; `1px solid #E2ECE4` on active cards (`hover:border-[#86EFAC]` in Cart, `hover:border-[#C4B5FD]` in Chores) and `1px solid #CDE5D3` on settled cards.
- **Internal Padding:** `14px` (`p-3.5`) on standard stock/finance/appliance cards, `8px 14px` (`px-3.5 py-2`) on interactive cart rows, and `20px` (`p-5`) on Finance summary cards.

### Inputs / Fields
- **Style:** `#F4F9F5` fill inside white forms/drawers (`rounded-2xl` / `16px` radius) or `#FFFFFF` pill (`rounded-full`, `min-h-[44px]`) for the Stock search field, both framed with `1px solid #E2ECE4`.
- **Focus:** `focus:border-[#15803D]` (or `#0369A1` in Unpack expense inputs, `#FF6B4A` in the dark scanner manual input); global `:focus-visible` renders a `2px solid #16A34A` outline with `2px` offset.

### Navigation
- **Sticky Botanical Header (`Header`):** White (`#FFFFFF`) sticky bar with `1px solid #E2ECE4` bottom border, `10px` domain dot (`#16A34A` / `#0284C7` / `#7C3AED`), `18px` `Lexend` `Nook` wordmark, domain pill badge, and `#F4F9F5` pill profile trigger.
- **Mobile Bottom Dock (`BottomDock`):** Sticky white (`#FFFFFF`) 5-column footer (`md:hidden`) with `1px solid #E2ECE4` top border. Route tabs use `12px`-radius tinted active pills (`#DCFCE7` / `#15803D`, `#E0F2FE` / `#0369A1`, `#EDE9FE`/60 / `#7C3AED`); center cell hosts the `#FF6B4A` coral `SCAN` pill (`text-[#14201A]`).
- **Desktop Floating Sidebar (`aside`):** `248px` `.botanical-card` sticky rail (`md:flex`) with `16px`-radius domain pills, `#FF6B4A` `Scan Barcode` pill CTA, and `Project Janus · Self-Hosted` footer caption.

### Signature Component: Botanical Item Card, Sticky Unpack Capsule & Coral Reticle Scanner
- **Botanical Checklist Card:** `44px × 44px` hit zone wrapping a `22px` circular checkbox (`border-2 border-[#86EFAC]`, filling `#16A34A` with white checkmark when collected), item title + storage zone metadata, `rounded-full` `- / qty / +` stepper (`bg-[#F4F9F5] border-[#E2ECE4]`), and a `68px` right-aligned `tabular-nums` euro column. Mobile places the stepper and delete icon on an indented sub-row (`pl-[38px]`) so long item names never clip.
- **Sticky Unpack Capsule & Vaul Sheet:** Full-width `#15803D` pill button (`Arrived Home? Unpack to Stock`) pins to the bottom of the mobile scroll container whenever items are collected, opening a `rounded-t-[24px]` white `Vaul` drawer with a scrollable transfer manifest, optional Finance receipt logger + photo upload, and `48px` `Put All into Stock` pill commit.
- **Coral Reticle Scanner Drawer:** Dark `#0F1B14` `Vaul` sheet (`rounded-t-[24px]`, `border-t border-[#1F3528]`) framing a `300px` square `rounded-[20px]` camera viewport with pulsing `#FF6B4A` corner reticles (`animate-reticle`), `#FACC15` active torch pill, `#16271D` catalog match card, and inline manual barcode input.

## Do's and Don'ts

### Do:
- **Do** build primary cards from `.botanical-card` (`#FFFFFF` + `1px solid #E2ECE4` + `18px` radius) and collected rows from `.botanical-card-settled` (`#EEF7F0` + `1px solid #CDE5D3`).
- **Do** use `#15803D` (`leaf-fill`) and `#0369A1` (`finance-fill`) behind white button/tab labels, and pair `#FF6B4A` (`coral-punch`) exclusively with `#14201A` dark pine ink.
- **Do** enforce `Lexend` on headings, totals, and pill CTAs, `Nunito Sans` on list copy, and `.tabular-nums` on every numeric quantity, price, and percentage.
- **Do** keep primary buttons, switches, filter chips, and row checkboxes at least `44px` in tap target height (`min-h-[44px]`).
- **Do** keep card and dock surfaces free of drop shadows and pair optimistic state updates with subtle haptic feedback (`navigator.vibrate?.(15..50)`).

### Don't:
- **Don't** put white text on `#FF6B4A` coral or `#16A34A` leaf accent backgrounds where contrast drops below WCAG-AA.
- **Don't** dim collected or completed cards with low CSS opacity; step down to `.botanical-card-settled` (`#EEF7F0`) and `#475B4E` ink instead.
- **Don't** add blurred drop shadows or heavy dark header/dock chrome back onto cards, segmented switches, or bottom navigation.
- **Don't** truncate mobile item titles next to inline steppers; keep mobile quantity controls on the indented sub-row.

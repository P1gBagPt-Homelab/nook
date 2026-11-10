# 06. UI/UX Design Tokens & Component Blueprint

> **Aesthetic Philosophy**: Minimalist, clean whitespace, impeccable typography, and **subtle, happy colors** that feel warm, delightful, and human.

---

## 1. Color Palette & Design Tokens

### Core Neutral Surfaces
* **Canvas / Body**: `#FAFAF8` (Warm porcelain — softer and warmer than sterile `#FFFFFF` or cold gray).
* **Card Surface**: `#FFFFFF` (Pure white with 1px border `rgba(0,0,0,0.04)` and soft ambient shadow).
* **Text Primary**: `#18181B` (Deep charcoal, high readability).
* **Text Secondary**: `#71717A` (Muted zinc for units, categories, dates).
* **Dividers & Borders**: `#F4F4F5` / `#E4E4E7`.

### Subtle Joyful Accents
* 🍑 **Warm Peach / Tangerine (`#FF7A59`)**:
  * Primary brand action button, camera scan highlight, active tab indicator.
* 🌿 **Fresh Sage / Mint (`#10B981`)**:
  * In-stock badges, completed items, checked shopping list items.
* ☀️ **Sunshine Butter / Amber (`#F59E0B`)**:
  * "Running low" pantry badges, maintenance due warnings, price chips.
* 🪻 **Soft Lavender (`#8B5CF6`)**:
  * Household management, appliance dossiers, PDF manual tags.
* 🌊 **Sky Mist (`#0EA5E9`)**:
  * Shared ledger balance, split settlement chips.

```css
/* Tailwind CSS Root Theme Variables */
:root {
  --background: #FAFAF8;
  --surface: #FFFFFF;
  --foreground: #18181B;
  --muted: #71717A;
  
  --joy-peach: #FF7A59;
  --joy-sage: #10B981;
  --joy-amber: #F59E0B;
  --joy-lavender: #8B5CF6;
  --joy-sky: #0EA5E9;
  
  --radius-card: 1.25rem; /* 20px smooth rounded curves */
  --radius-button: 9999px; /* Pill shapes for thumb buttons */
}
```

---

## 2. Mobile PWA Ergonomics & Two-Submodule Grocery Layout

The Grocery section is split cleanly into **My Stock** and **Shopping Cart** with a segmented top pill switch:

```
┌────────────────────────────────────────┐
│  Nook                         [Profile]│  <- Header
├────────────────────────────────────────┤
│     [ 🛒 Shopping Cart ]  [ 📦 My Stock ]  <- Smooth Segmented Switch
├────────────────────────────────────────┤
│  === VIEW A: SHOPPING CART MODE ===    │
│  Supermarket Run           9/12 in Cart│
│                                        │
│  [ Produce ]                           │
│  [✓] Bananas (1 bunch)         €1.49   │ (Collected)
│  [ ] Avocados (3 pcs)          €2.99   │ (Pending)
│                                        │
│  [ 🚚 Arrived Home? Unpack to Stock ]  │ <- Fresh Sage action button
│                                        │
│  === VIEW B: MY STOCK INVENTORY ===    │
│  Locations: [All] [Fridge] [Pantry]    │
│                                        │
│  🥛 Whole Milk 1L              2 pcs   │
│  🟢 In Stock         [+ Add to Cart]   │
│                                        │
│  🧈 Butter Salted             100g     │
│  🟡 Running Low      [+ Add to Cart]   │
├────────────────────────────────────────┤
│   🛒        📦       [ 📷 ]    💰    🏠  │  <- Floating Bottom Dock
│ Grocery   Pantry     SCAN   Finance  House│
└────────────────────────────────────────┘
```

### Unpack Bottom Sheet Drawer (`Vaul`):
When tapping **"Arrived Home? Unpack to Stock"**:
* Shows an interactive checklist of collected items with location tags (Fridge, Freezer, Pantry).
* Top button: **"Put All into Stock (1-Tap)"** (styled in Fresh Sage `#10B981`).
* Individual checkboxes to exclude items you ate right away.
* Optional toggle: *"Record €42.50 expense in Groceries"* with 1-tap receipt photo snap.

### Thumb Zone Rules:
1. **Central Floating Camera Button**: Slightly oversized, glowing soft peach (`#FF7A59`), placed dead-center for effortless thumb reach.
2. **Bottom-Aligned Sheets**: All forms, editors, and dialogs open as **bottom sheets** sliding from the base of the screen, never centered modal popups that require reaching to the top of the phone.
3. **Optimistic List Taps**: Tapping anywhere on a grocery item card triggers immediate visual checkmark animation with subtle haptic tap (`navigator.vibrate(20)`).

---

## 3. The In-Store Barcode Scanner Component

### Viewfinder Spec
* **Camera Stream**: Fullscreen or dedicated 320x320px viewport with rounded corners.
* **Target Reticle**: Subtle glowing peach frame with pulsing corner brackets.
* **Controls**:
  * Torch / Flashlight toggle button (top right of viewfinder).
  * Flip Camera (back camera default).
  * Manual barcode number entry button (if barcode is torn or unreadable).

```typescript
// Hardware-accelerated barcode detection hook
export function useBarcodeScanner({ onScan }: { onScan: (barcode: string) => void }) {
  // Uses window.BarcodeDetector API if supported (Chromium/Android/Safari),
  // with fallback to @zxing/browser.
  // Triggers navigator.vibrate(50) on successful decode.
}
```

---

## 4. The Product Digitalization Bottom Sheet (`Vaul` Drawer)

When an uncataloged barcode is detected:
1. Sound/haptic confirmation fires.
2. The scanner view pauses.
3. The bottom sheet glides up smoothly with pre-filled metadata (from Open Food Facts if matched).

```
┌────────────────────────────────────────┐
│                [  Drag Handle  ]       │
├────────────────────────────────────────┤
│  ✨ Digitalize New Product             │
│  Barcode: 5601009941123                │
│                                        │
│  [ Camera Icon ]  Title *              │
│  Snap Photo       [ Terra Nostra Milk] │
│                                        │
│  Brand            Category             │
│  [ Terra Nostra]  [ 🥛 Dairy        ▼] │
│                                        │
│  Price (€)        Unit                 │
│  [ 1.15        ]  [ Liters (L)      ▼] │
│                                        │
│  [   Save & Add to Shopping List   ]   │  <- Warm Peach primary button
│  [         Save to Catalog Only    ]   │
└────────────────────────────────────────┘
```

### Interactive Features:
* **1-Tap Photo Snap**: Tapping the photo placeholder opens the camera. Once snapped, it compresses client-side to modern `.webp` and posts directly to MinIO S3 via a presigned URL.
* **Instant Currency Pad**: Number input with decimal formatting for effortless price logging.
* **Category Pills**: Scrollable horizontal chips (Dairy, Produce, Pantry, Household, Beverage, Bakery) for rapid classification.

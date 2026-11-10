# 05. Step 5: In-Store Barcode Scanner & Product Catalog

> **Goal**: Implement the ultra-fast barcode lookup service with Open Food Facts fallback, the mobile camera scanner using native `BarcodeDetector` + `@zxing`, and the joyful product digitalization bottom drawer.  
> **Prerequisites**: Steps 1–4 completed (Fastify, PostgreSQL, S3 presigned engine).  

---

## 📋 Task 5.1: Open Food Facts External Resolver Service

Create `apps/api/src/modules/catalog/services/open-food-facts.ts`:
```typescript
interface OpenFoodFactsProduct {
  barcode: string;
  title: string;
  brand: string | null;
  category: string;
  unit: string;
  imageUrl: string | null;
}

export async function resolveOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "Nook - OpenSource Household App - contact@nook.app" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      barcode,
      title: p.product_name || p.generic_name || "Unknown Product",
      brand: p.brands || null,
      category: p.categories_tags?.[0]?.replace(/^en:/, "") || "General",
      unit: p.quantity || "pcs",
      imageUrl: p.image_front_url || p.image_url || null,
    };
  } catch {
    return null; // Silent fallback on external timeout
  }
}
```

---

## 📋 Task 5.2: Fastify Catalog Routes

Create `apps/api/src/modules/catalog/routes.ts`:
```typescript
import { FastifyPluginAsync } from "fastify";
import { db } from "../../lib/db";
import { productCatalog } from "../../lib/db/schema";
import { createProductSchema } from "@nook/shared";
import { resolveOpenFoodFacts } from "./services/open-food-facts";
import { eq, and } from "drizzle-orm";

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Instant Scan Lookup
  fastify.get(
    "/scan/:barcode",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { barcode } = request.params as { barcode: string };
      const householdId = request.user!.householdId;

      // Check Local Database First (<2ms)
      const [localProduct] = await db
        .select()
        .from(productCatalog)
        .where(
          and(
            eq(productCatalog.householdId, householdId),
            eq(productCatalog.barcode, barcode)
          )
        );

      if (localProduct) {
        return reply.send({
          source: "local",
          product: {
            ...localProduct,
            imageUrl: localProduct.imageKey
              ? `${process.env.S3_PUBLIC_ENDPOINT || "http://minio:9000"}/${process.env.S3_BUCKET || "nook-media"}/${localProduct.imageKey}`
              : null,
          },
        });
      }

      // Fallback: Query Open Food Facts
      const external = await resolveOpenFoodFacts(barcode);
      if (external) {
        return reply.send({
          source: "openfoodfacts",
          product: {
            id: null,
            barcode,
            title: external.title,
            brand: external.brand,
            category: external.category,
            unit: external.unit,
            defaultPrice: null,
            imageKey: null,
            imageUrl: external.imageUrl,
          },
        });
      }

      // Not found anywhere: Return prompt to create
      return reply.status(404).send({
        source: "not_found",
        barcode,
        message: "Product not in catalog. Open creation drawer.",
      });
    }
  );

  // 2. Create / Digitalize Product
  fastify.post(
    "/products",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const body = createProductSchema.parse(request.body);
      const householdId = request.user!.householdId;

      const [newProduct] = await db
        .insert(productCatalog)
        .values({
          householdId,
          barcode: body.barcode,
          title: body.title,
          brand: body.brand,
          category: body.category,
          unit: body.unit,
          defaultPrice: body.defaultPrice ? body.defaultPrice.toString() : null,
          imageKey: body.imageKey,
        })
        .onConflictDoUpdate({
          target: [productCatalog.householdId, productCatalog.barcode],
          set: {
            title: body.title,
            brand: body.brand,
            category: body.category,
            defaultPrice: body.defaultPrice ? body.defaultPrice.toString() : null,
            imageKey: body.imageKey,
            updatedAt: new Date(),
          },
        })
        .returning();

      return reply.status(201).send(newProduct);
    }
  );

  // 3. Search Catalog
  fastify.get(
    "/products",
    { preHandler: fastify.authenticate },
    async (request) => {
      const householdId = request.user!.householdId;
      const products = await db
        .select()
        .from(productCatalog)
        .where(eq(productCatalog.householdId, householdId))
        .limit(100);
      return products;
    }
  );
};
```

---

## 📋 Task 5.3: Hardware Barcode Scanner Hook in PWA (`apps/web`)

In `apps/web/src/hooks/useBarcodeScanner.ts`:
```typescript
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  enabled: boolean;
}

export function useBarcodeScanner({ onScan, enabled }: UseBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    let reader: BrowserMultiFormatReader | null = null;
    let stream: MediaStream | null = null;

    async function startScanner() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          trackRef.current = stream.getVideoTracks()[0];
        }

        // 1. Hardware BarcodeDetector API (Supported in Chrome/Safari mobile)
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
          });

          const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detected = barcodes[0].rawValue;
                navigator.vibrate?.(40); // Joyful haptic feedback!
                onScan(detected);
              }
            } catch {}
          }, 150);

          return () => clearInterval(interval);
        }

        // 2. Fallback to @zxing/browser
        reader = new BrowserMultiFormatReader();
        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            navigator.vibrate?.(40);
            onScan(result.getText());
          }
        });
      } catch (err) {
        console.error("Camera access error:", err);
        setHasCamera(false);
      }
    }

    startScanner();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, onScan]);

  function toggleTorch() {
    if (trackRef.current && "applyConstraints" in trackRef.current) {
      const next = !torchOn;
      (trackRef.current as any).applyConstraints({ advanced: [{ torch: next }] }).catch(() => {});
      setTorchOn(next);
    }
  }

  return { videoRef, hasCamera, torchOn, toggleTorch };
}
```

---

## 📋 Task 5.4: Digitalization Bottom Sheet (`ProductCreateDrawer.tsx`)

In `apps/web/src/components/products/ProductCreateDrawer.tsx`:
```tsx
import { Drawer } from "vaul";
import { useState } from "react";
import { Camera, Check, Tag } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

interface ProductCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  initialData?: {
    title?: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
  };
  onSave: (product: any) => void;
}

export function ProductCreateDrawer({
  isOpen,
  onClose,
  barcode,
  initialData,
  onSave,
}: ProductCreateDrawerProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState(initialData?.category || "Produce");
  const [price, setPrice] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);

  const { uploadPhoto, isUploading } = usePhotoUpload();

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    const result = await uploadPhoto(file, "products");
    setImageKey(result.fileKey);
  }

  async function handleSubmit() {
    const payload = {
      barcode,
      title,
      brand: brand || undefined,
      category,
      defaultPrice: price ? parseFloat(price) : undefined,
      imageKey: imageKey || undefined,
    };

    const res = await fetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      onSave(saved);
      onClose();
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[28px] p-6 z-50 shadow-xl">
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6" />

          <Drawer.Title className="text-xl font-semibold text-zinc-900 flex items-center justify-between">
            <span>✨ Digitalize Product</span>
            <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2.5 py-1 rounded-full">
              {barcode}
            </span>
          </Drawer.Title>

          <div className="mt-5 space-y-4">
            {/* Photo Capture */}
            <div className="flex items-center gap-4">
              <label className="relative w-24 h-24 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-zinc-50 transition">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-zinc-400" />
                    <span className="text-[10px] text-zinc-500 mt-1 font-medium">Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
              </label>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Product Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
                <input
                  type="text"
                  placeholder="Brand (optional)"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
              </div>
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-400 font-medium text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
              >
                <option value="Produce">🥬 Produce</option>
                <option value="Dairy">🥛 Dairy</option>
                <option value="Bakery">🥖 Bakery</option>
                <option value="Meat">🥩 Meat & Fish</option>
                <option value="Pantry">🥫 Pantry Dry</option>
                <option value="Frozen">🧊 Frozen</option>
                <option value="Beverage">🧃 Beverage</option>
                <option value="Household">🧼 Cleaning & Home</option>
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={handleSubmit}
              disabled={!title || isUploading}
              className="w-full mt-4 py-3.5 rounded-full bg-[#FF7A59] hover:bg-[#ff6842] text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Add to Cart</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

---

## 📋 Task 5.5: Bruno Test for Barcode Scan

Create `bruno/04-Catalog/Scan-Barcode.bru`:
```text
meta {
  name: Scan Barcode
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/api/catalog/scan/5601009941123
  body: none
  auth: none
}

assert {
  res.status: in [200, 404]
}
```

---

## ✅ Acceptance Criteria & Verification

1. Calling `GET /api/catalog/scan/:barcode`:
   * Matches existing DB items in **< 3ms**.
   * On unknown barcodes, queries Open Food Facts and returns pre-populated data.
2. In PWA on mobile:
   * Pointing camera at physical barcode triggers vibration (`navigator.vibrate(40)`).
   * Bottom sheet slides up instantly with title pre-filled.
   * Snapping a photo uploads directly to MinIO and previews immediately.
   * Clicking "Save & Add to Cart" writes to PostgreSQL `product_catalog` and attaches to active cart.

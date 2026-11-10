import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Camera, Check, Sparkles, Loader2 } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

export interface ProductCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  initialData?: {
    title?: string;
    brand?: string;
    category?: string;
    unit?: string;
    imageUrl?: string;
  };
  onSave: (product: any, addToCart: boolean) => void;
}

const CATEGORIES = [
  { id: "Produce", label: "🥬 Produce" },
  { id: "Dairy", label: "🥛 Dairy" },
  { id: "Bakery", label: "🥖 Bakery" },
  { id: "Meat", label: "🥩 Meat & Fish" },
  { id: "Pantry", label: "🥫 Pantry Dry" },
  { id: "Beverage", label: "🧃 Beverage" },
  { id: "Frozen", label: "🧊 Frozen" },
  { id: "Household", label: "🧼 Cleaning & Home" },
];

const UNITS = [
  { id: "pcs", label: "Pieces (pcs)" },
  { id: "L", label: "Liters (L)" },
  { id: "ml", label: "Milliliters (ml)" },
  { id: "kg", label: "Kilograms (kg)" },
  { id: "g", label: "Grams (g)" },
  { id: "pack", label: "Pack" },
  { id: "bunch", label: "Bunch" },
];

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
  const [unit, setUnit] = useState(initialData?.unit || "pcs");
  const [price, setPrice] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadPhoto, isUploading } = usePhotoUpload();

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setBrand(initialData?.brand || "");
      setCategory(initialData?.category || "Produce");
      setUnit(initialData?.unit || "pcs");
      setPreviewUrl(initialData?.imageUrl || null);
      setImageKey(null);
      setPrice("");
    }
  }, [isOpen, barcode, initialData]);

  // Client-side WebP compression and S3 upload
  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create local preview immediately
      setPreviewUrl(URL.createObjectURL(file));

      // Upload directly to MinIO via presigned S3 url
      const result = await uploadPhoto(file, "products");
      setImageKey(result.fileKey);
    } catch (err) {
      console.error("Photo upload error:", err);
    }
  }

  async function handleSave(addToCart: boolean) {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        barcode,
        title: title.trim(),
        brand: brand.trim() || undefined,
        category,
        unit,
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
        navigator.vibrate?.(30);
        onSave(saved, addToCart);
        onClose();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save product");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[32px] p-6 z-50 shadow-2xl border-t border-zinc-100 max-h-[92vh] overflow-y-auto">
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <Drawer.Title className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>✨ Digitalize New Product</span>
              </Drawer.Title>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-400">Barcode:</span>
                <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {barcode}
                </span>
              </div>
            </div>
            {initialData?.title && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Open Food Facts</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* 1-Tap Photo Snap & Title */}
            <div className="flex items-start gap-3.5">
              <label className="relative w-24 h-24 rounded-2xl bg-[#FAFAF8] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#FF7A59] transition shrink-0 group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[#FF7A59] flex items-center justify-center group-hover:scale-105 transition">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 font-semibold">Snap Photo</span>
                  </>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF7A59]" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>

              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Terra Nostra Milk"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Brand (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Terra Nostra"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAFAF8] border border-zinc-200 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                  />
                </div>
              </div>
            </div>

            {/* Category Pills (Blueprint: Scrollable horizontal chips) */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                      category === cat.id
                        ? "bg-[#FF7A59] text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Unit Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Price (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-xs">€</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[#FAFAF8] border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAF8] border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                >
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Two Action Buttons as specified in Blueprint Section 4 */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!title.trim() || isSubmitting || isUploading}
                className="w-full py-3.5 rounded-full bg-[#FF7A59] hover:bg-[#ff6842] active:scale-[0.99] text-white font-bold text-xs shadow-md button-peach-glow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save & Add to Shopping List</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={!title.trim() || isSubmitting || isUploading}
                className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Save to Catalog Only
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default ProductCreateDrawer;

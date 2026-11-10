import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Camera, Check } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

export interface ProductCreateDrawerProps {
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

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setBrand(initialData?.brand || "");
      setCategory(initialData?.category || "Produce");
      setPreviewUrl(initialData?.imageUrl || null);
      setImageKey(null);
      setPrice("");
    }
  }, [isOpen, barcode, initialData]);

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
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
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

export default ProductCreateDrawer;

import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import type { TranslationKey } from "../../i18n/locales/en";

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

const CATEGORIES: { id: string; labelKey: TranslationKey }[] = [
  { id: "Produce", labelKey: "product.cat.Produce" },
  { id: "Dairy", labelKey: "product.cat.Dairy" },
  { id: "Bakery", labelKey: "product.cat.Bakery" },
  { id: "Meat", labelKey: "product.cat.Meat" },
  { id: "Pantry", labelKey: "product.cat.Pantry" },
  { id: "Beverage", labelKey: "product.cat.Beverage" },
  { id: "Frozen", labelKey: "product.cat.Frozen" },
  { id: "Household", labelKey: "product.cat.Household" },
];

const UNITS: { id: string; labelKey: TranslationKey }[] = [
  { id: "pcs", labelKey: "product.unit.pcs" },
  { id: "L", labelKey: "product.unit.L" },
  { id: "ml", labelKey: "product.unit.ml" },
  { id: "kg", labelKey: "product.unit.kg" },
  { id: "g", labelKey: "product.unit.g" },
  { id: "pack", labelKey: "product.unit.pack" },
  { id: "bunch", labelKey: "product.unit.bunch" },
];

export function ProductCreateDrawer({
  isOpen,
  onClose,
  barcode,
  initialData,
  onSave,
}: ProductCreateDrawerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialData?.title || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState(initialData?.category || "Produce");
  const [unit, setUnit] = useState(initialData?.unit || "pcs");
  const [price, setPrice] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );
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

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPreviewUrl(URL.createObjectURL(file));
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
        alert(err.detail || t("product.saveFailed"));
      }
    } catch (err: any) {
      alert(t("product.errorPrefix", { message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] overflow-y-auto">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2" />

          <div className="px-5 py-3 border-b border-[#E2ECE4] flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
                {t("product.title")}
              </Drawer.Title>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold text-[#5B6B61]">
                  {t("product.barcode")}
                </span>
                <span className="text-[11px] font-bold bg-[#F4F9F5] text-[#14201A] px-2.5 py-0.5 rounded-full border border-[#E2ECE4] tabular-nums">
                  {barcode}
                </span>
              </div>
            </div>
            {initialData?.title && (
              <span className="text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] px-2.5 py-0.5 rounded-full">
                {t("scanner.source.off")}
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <label className="relative w-24 h-24 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#16A34A] transition-colors shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-[#FF6B4A]" />
                    <span className="text-[11px] text-[#5B6B61] mt-1 font-bold">
                      {t("product.snapPhoto")}
                    </span>
                  </>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-[#14201A]/60 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B4A]" />
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

              <div className="flex-1 space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                    {t("product.titleLabel")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("product.titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#15803D]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                    {t("product.brandLabel")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("product.brandPlaceholder")}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-semibold text-[#14201A] focus:border-[#15803D]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                {t("product.categoryLabel")}
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer font-display ${
                      category === cat.id
                        ? "bg-[#15803D] text-white border-[#15803D]"
                        : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                    }`}
                  >
                    {t(cat.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("product.priceLabel")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#5B6B61] font-bold text-xs">
                    €
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("product.unitLabel")}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#15803D]"
                >
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {t(u.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!title.trim() || isSubmitting || isUploading}
                className="w-full min-h-[48px] py-3 rounded-full bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t("product.saveAndAdd")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={!title.trim() || isSubmitting || isUploading}
                className="w-full min-h-[44px] py-2.5 rounded-full bg-[#F4F9F5] hover:bg-[#EEF7F0] border border-[#E2ECE4] text-[#14201A] font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("product.saveOnly")}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default ProductCreateDrawer;

import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { Check, FileText, Loader2, Upload } from "lucide-react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import { useTranslation } from "../../i18n/I18nContext";
import { translateApiError } from "../../i18n/helpers";
import type { TranslationKey } from "../../i18n/locales/en";

interface AssetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ROOMS = ["Kitchen", "Laundry", "Utility", "Living Room", "Bathroom", "Home"];

export function AssetDrawer({ isOpen, onClose, onSaved }: AssetDrawerProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [roomLocation, setRoomLocation] = useState("Kitchen");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [manualFileName, setManualFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadPhoto, isUploading } = usePhotoUpload();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setRoomLocation("Kitchen");
      setBrand("");
      setModel("");
      setSerialNumber("");
      setWarrantyUntil("");
      setManualKey(null);
      setManualFileName(null);
      setError(null);
    }
  }, [isOpen]);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const res = await uploadPhoto(file, "manuals");
      setManualKey(res.fileKey);
      setManualFileName(file.name);
      navigator.vibrate?.(25);
    } catch (err: any) {
      setError(translateApiError(t, err?.message, "asset.pdfUploadFailed"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/house/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roomLocation,
          brand: brand.trim() || null,
          model: model.trim() || null,
          serialNumber: serialNumber.trim() || null,
          warrantyUntil: warrantyUntil
            ? new Date(`${warrantyUntil}T12:00:00Z`).toISOString()
            : null,
          manualKey: manualKey || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(translateApiError(t, err.detail, "asset.registerFailed"));
      }

      navigator.vibrate?.(35);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || t("asset.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/50 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] z-50 border-t border-[#E2ECE4] max-h-[92vh] flex flex-col focus:outline-none">
          <div className="w-10 h-1.5 bg-[#E2ECE4] rounded-full mx-auto mt-3 mb-2 shrink-0" />
          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">

          <div className="px-5 py-3 border-b border-[#E2ECE4]">
            <Drawer.Title className="text-base font-bold text-[#14201A] font-display">
              {t("asset.title")}
            </Drawer.Title>
            <p className="text-xs text-[#5B6B61] font-medium mt-0.5">
              {t("asset.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-2xl text-xs font-bold border border-[#FCA5A5]"
              >
                {error}
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                {t("asset.nameLabel")}
              </label>
              <input
                type="text"
                required
                placeholder={t("asset.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] focus:border-[#7C3AED]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5B6B61] block mb-1.5">
                {t("asset.roomLabel")}
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {ROOMS.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setRoomLocation(room)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer font-display ${
                      roomLocation === room
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "bg-[#F4F9F5] text-[#5B6B61] border-[#E2ECE4] hover:text-[#14201A]"
                    }`}
                  >
                    {t(`asset.room.${room}` as TranslationKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("asset.brandLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("asset.brandPlaceholder")}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-semibold text-[#14201A] focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("asset.modelLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("asset.modelPlaceholder")}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-semibold text-[#14201A] tabular-nums focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("asset.serialLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("asset.serialPlaceholder")}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-semibold text-[#14201A] tabular-nums focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#5B6B61] block mb-1">
                  {t("asset.warrantyLabel")}
                </label>
                <input
                  type="date"
                  value={warrantyUntil}
                  onChange={(e) => setWarrantyUntil(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#F4F9F5] border border-[#E2ECE4] text-xs font-bold text-[#14201A] tabular-nums focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <label className="w-full min-h-[56px] px-4 py-3 rounded-2xl bg-[#F4F9F5] border border-dashed border-[#C4B5FD] hover:border-[#7C3AED] flex items-center justify-between gap-3 cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : manualKey ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#14201A] truncate font-display">
                    {manualFileName || t("asset.uploadPdfTitle")}
                  </div>
                  <div className="text-[11px] text-[#5B6B61] font-medium">
                    {manualKey ? t("asset.pdfUploaded") : t("asset.pdfHint")}
                  </div>
                </div>
              </div>
              <Upload className="w-4 h-4 text-[#7C3AED] shrink-0" />
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
            </label>

            <button
              type="submit"
              disabled={!name.trim() || isSubmitting || isUploading}
              className="w-full min-h-[48px] py-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold font-display text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{t("asset.save")}</span>
                </>
              )}
            </button>
          </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

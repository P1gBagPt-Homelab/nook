import { useState } from "react";
import { Drawer } from "vaul";
import { X, Zap, RefreshCw, KeyRound, Plus, Loader2, Tag } from "lucide-react";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { useTranslation } from "../../i18n/I18nContext";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDetected: (barcode: string, productData?: any) => void;
  onAddDirectToCart?: (product: any) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onProductDetected,
  onAddDirectToCart,
}: BarcodeScannerModalProps) {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanResult, setScanResult] = useState<{
    barcode: string;
    product?: any;
    source?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { videoRef, hasCamera, torchOn, toggleTorch, flipCamera } = useBarcodeScanner({
    enabled: isOpen,
    onScan: handleScanBarcode,
  });

  async function handleScanBarcode(barcode: string) {
    if (!barcode) return;
    setIsSearching(true);
    navigator.vibrate?.(50);

    try {
      const res = await fetch(`/api/catalog/scan/${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const data = await res.json();
        setScanResult({ barcode, product: data.product, source: data.source });
      } else {
        setScanResult({ barcode, product: null });
      }
    } catch {
      setScanResult({ barcode, product: null });
    } finally {
      setIsSearching(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanBarcode(manualCode.trim());
      setShowManualInput(false);
      setManualCode("");
    }
  }

  function handleProceed() {
    if (!scanResult) return;
    if (scanResult.product && scanResult.source === "local" && onAddDirectToCart) {
      onAddDirectToCart(scanResult.product);
      setScanResult(null);
      onClose();
    } else {
      onProductDetected(scanResult.barcode, scanResult.product);
      setScanResult(null);
      onClose();
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-[#14201A]/70 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0F1B14] text-white rounded-t-[24px] p-5 z-50 border-t border-[#1F3528]">
          <div className="w-10 h-1.5 bg-[#2A4736] rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B4A]" aria-hidden="true" />
              <Drawer.Title className="text-base font-bold text-white tracking-tight font-display">
                {t("scanner.title")}
              </Drawer.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-full bg-[#1C2F24] text-[#A7C4B2] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t("scanner.closeAria")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative aspect-square w-full max-w-[300px] mx-auto rounded-[20px] overflow-hidden bg-black border border-[#1F3528] flex items-center justify-center">
            {hasCamera ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-[#A7C4B2] text-xs font-semibold">
                {t("scanner.cameraUnavailable")}
              </div>
            )}

            {/* Coral Reticle */}
            <div className="absolute inset-7 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-7 h-7 border-t-[3px] border-l-[3px] border-[#FF6B4A] rounded-tl-xl animate-reticle" />
                <div className="w-7 h-7 border-t-[3px] border-r-[3px] border-[#FF6B4A] rounded-tr-xl animate-reticle" />
              </div>

              <div className="w-full h-[2px] bg-[#FF6B4A]/75" />

              <div className="flex justify-between">
                <div className="w-7 h-7 border-b-[3px] border-l-[3px] border-[#FF6B4A] rounded-bl-xl animate-reticle" />
                <div className="w-7 h-7 border-b-[3px] border-r-[3px] border-[#FF6B4A] rounded-br-xl animate-reticle" />
              </div>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTorch}
                title={t("scanner.toggleTorch")}
                aria-label={t("scanner.toggleTorch")}
                className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  torchOn
                    ? "bg-[#FACC15] text-[#14201A]"
                    : "bg-[#0F1B14]/80 text-white hover:bg-[#0F1B14]"
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={flipCamera}
                title={t("scanner.flipCamera")}
                aria-label={t("scanner.flipCamera")}
                className="min-w-[40px] min-h-[40px] rounded-full bg-[#0F1B14]/80 text-white hover:bg-[#0F1B14] flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isSearching && (
              <div className="absolute inset-0 bg-[#0F1B14]/85 flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 text-[#FF6B4A] animate-spin" />
                <span className="text-xs font-bold">{t("scanner.lookingUp")}</span>
              </div>
            )}
          </div>

          {scanResult && (
            <div className="mt-4 p-4 rounded-2xl bg-[#16271D] border border-[#243E2F] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A7C4B2] tabular-nums">
                  {scanResult.barcode}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#15803D] text-white font-bold">
                  {scanResult.product
                    ? scanResult.source === "local"
                      ? t("scanner.source.local")
                      : t("scanner.source.off")
                    : t("scanner.source.new")}
                </span>
              </div>

              <div className="text-sm font-bold text-white font-display">
                {scanResult.product?.title || t("scanner.unregistered")}
              </div>

              {scanResult.product?.brand && (
                <div className="text-xs text-[#A7C4B2] font-semibold">
                  {scanResult.product.brand}
                </div>
              )}

              <button
                type="button"
                onClick={handleProceed}
                className="w-full min-h-[44px] py-2.5 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] text-[#14201A] font-bold font-display text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {scanResult.product?.id ? (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t("scanner.addToCart")}</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    <span>{t("scanner.digitalize")}</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#1F3528] text-center">
            {!showManualInput ? (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="min-h-[44px] inline-flex items-center gap-1.5 text-xs text-[#A7C4B2] hover:text-white font-bold transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FF6B4A]" />
                <span>{t("scanner.manualPrompt")}</span>
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("scanner.manualPlaceholder")}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#16271D] border border-[#243E2F] text-xs font-semibold text-white placeholder-[#A7C4B2] focus:border-[#FF6B4A] tabular-nums"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-full bg-[#FF6B4A] hover:bg-[#FF5530] text-[#14201A] text-xs font-bold font-display transition-colors cursor-pointer"
                >
                  {t("scanner.lookup")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="min-h-[44px] px-3 py-2 text-xs font-bold text-[#A7C4B2] hover:text-white cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

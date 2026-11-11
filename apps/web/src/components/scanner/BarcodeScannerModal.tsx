import { useState } from "react";
import { Drawer } from "vaul";
import { X, Zap, RefreshCw, KeyRound, Plus, Loader2, Tag } from "lucide-react";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";

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
        <Drawer.Overlay className="fixed inset-0 bg-[#14191D]/75 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#14191D] text-[#F7F5EE] rounded-t-[8px] p-5 z-50 border-t-[3px] border-[#D9381E]">
          <div className="w-10 h-1 bg-[#2A3137] rounded-[2px] mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D9381E]" aria-hidden="true" />
              <Drawer.Title className="text-base font-extrabold text-[#F7F5EE] tracking-tight">
                In-Store Barcode Scanner
              </Drawer.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] bg-[#2A3137] text-[#A1AAB3] hover:text-white transition-colors cursor-pointer"
              aria-label="Close scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Crisp Enamel Viewfinder Frame */}
          <div className="relative aspect-square w-full max-w-[300px] mx-auto rounded-[4px] overflow-hidden bg-black border border-[#2A3137] flex items-center justify-center">
            {hasCamera ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-[#A1AAB3] text-xs font-semibold">
                Camera unavailable or permission blocked. Use manual barcode entry below.
              </div>
            )}

            {/* Vermilion Enamel Reticle */}
            <div className="absolute inset-7 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-[3px] border-l-[3px] border-[#D9381E] animate-reticle" />
                <div className="w-6 h-6 border-t-[3px] border-r-[3px] border-[#D9381E] animate-reticle" />
              </div>

              <div className="w-full h-[2px] bg-[#D9381E]/75" />

              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-[3px] border-l-[3px] border-[#D9381E] animate-reticle" />
                <div className="w-6 h-6 border-b-[3px] border-r-[3px] border-[#D9381E] animate-reticle" />
              </div>
            </div>

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTorch}
                title="Toggle Torch"
                aria-label="Toggle Torch"
                className={`p-2 rounded-[4px] border transition-colors cursor-pointer ${
                  torchOn
                    ? "bg-[#F59E0B] border-[#F59E0B] text-[#14191D]"
                    : "bg-[#14191D]/80 border-[#2A3137] text-white hover:bg-[#14191D]"
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={flipCamera}
                title="Flip Camera"
                aria-label="Flip Camera"
                className="p-2 rounded-[4px] bg-[#14191D]/80 border border-[#2A3137] text-white hover:bg-[#14191D] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isSearching && (
              <div className="absolute inset-0 bg-[#14191D]/85 flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 text-[#D9381E] animate-spin" />
                <span className="text-xs font-bold">Looking up barcode...</span>
              </div>
            )}
          </div>

          {scanResult && (
            <div className="mt-4 p-3.5 rounded-[4px] bg-[#1D2329] border border-[#2A3137] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#A1AAB3] tabular-nums">
                  {scanResult.barcode}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#047857] text-white font-extrabold">
                  {scanResult.product
                    ? scanResult.source === "local"
                      ? "Household Catalog"
                      : "Open Food Facts"
                    : "New Item"}
                </span>
              </div>

              <div className="text-sm font-extrabold text-white">
                {scanResult.product?.title || "Unregistered Product"}
              </div>

              {scanResult.product?.brand && (
                <div className="text-xs text-[#A1AAB3] font-semibold">
                  {scanResult.product.brand}
                </div>
              )}

              <button
                type="button"
                onClick={handleProceed}
                className="w-full py-2.5 rounded-[4px] bg-[#D9381E] hover:bg-[#B92B14] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {scanResult.product?.id ? (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    <span>Digitalize & Set Price / Photo</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#2A3137] text-center">
            {!showManualInput ? (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1AAB3] hover:text-white font-bold transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#D9381E]" />
                <span>Barcode damaged or unreadable? Enter manually</span>
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode number..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-[4px] bg-[#1D2329] border border-[#2A3137] text-xs font-mono text-white placeholder-[#A1AAB3] focus:outline-none focus:border-[#D9381E]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-[4px] bg-[#D9381E] hover:bg-[#B92B14] text-white text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Lookup
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-2 py-2 text-xs font-bold text-[#A1AAB3] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

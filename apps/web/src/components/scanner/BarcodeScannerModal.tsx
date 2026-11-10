import { useState } from "react";
import { Drawer } from "vaul";
import { X, Zap, RefreshCw, KeyRound, Sparkles, Plus } from "lucide-react";
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
        // Not found in local or external catalog -> Digitalize
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
      // Pass to digitalization drawer
      onProductDetected(scanResult.barcode, scanResult.product);
      setScanResult(null);
      onClose();
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-zinc-950 text-white rounded-t-[32px] p-6 z-50 shadow-2xl border-t border-zinc-800">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />

          {/* Scanner Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A59] animate-pulse" />
              <Drawer.Title className="text-base font-bold text-white tracking-tight">
                In-Store Barcode Scanner
              </Drawer.Title>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white transition"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Spec */}
          <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-inner flex items-center justify-center">
            {hasCamera ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center text-zinc-400 text-xs">
                Camera access not available or blocked. Use manual barcode input below.
              </div>
            )}

            {/* Glowing Peach Reticle with Pulsing Corner Brackets */}
            <div className="absolute inset-8 pointer-events-none flex flex-col justify-between">
              {/* Top Corners */}
              <div className="flex justify-between">
                <div className="w-7 h-7 border-t-3 border-l-3 border-[#FF7A59] rounded-tl-lg shadow-[0_0_12px_rgba(255,122,89,0.8)] animate-reticle" />
                <div className="w-7 h-7 border-t-3 border-r-3 border-[#FF7A59] rounded-tr-lg shadow-[0_0_12px_rgba(255,122,89,0.8)] animate-reticle" />
              </div>

              {/* Center subtle guide line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FF7A59]/80 to-transparent shadow-[0_0_8px_rgba(255,122,89,0.9)] animate-pulse" />

              {/* Bottom Corners */}
              <div className="flex justify-between">
                <div className="w-7 h-7 border-b-3 border-l-3 border-[#FF7A59] rounded-bl-lg shadow-[0_0_12px_rgba(255,122,89,0.8)] animate-reticle" />
                <div className="w-7 h-7 border-b-3 border-r-3 border-[#FF7A59] rounded-br-lg shadow-[0_0_12px_rgba(255,122,89,0.8)] animate-reticle" />
              </div>
            </div>

            {/* Viewfinder Controls Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={toggleTorch}
                title="Toggle Torch"
                className={`p-2.5 rounded-full backdrop-blur-md transition ${
                  torchOn ? "bg-amber-400 text-zinc-950 font-bold" : "bg-black/50 text-white hover:bg-black/70"
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={flipCamera}
                title="Flip Camera"
                className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isSearching && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <Sparkles className="w-6 h-6 text-[#FF7A59] animate-spin" />
                <span className="text-xs font-semibold">Looking up product...</span>
              </div>
            )}
          </div>

          {/* Detected Product Card / Fallback */}
          {scanResult && (
            <div className="mt-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  Barcode: {scanResult.barcode}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                  {scanResult.product ? (scanResult.source === "local" ? "In Household Catalog" : "Open Food Facts Match") : "New Product"}
                </span>
              </div>

              <div className="text-sm font-bold text-white">
                {scanResult.product?.title || "Unregistered Product"}
              </div>

              {scanResult.product?.brand && (
                <div className="text-xs text-zinc-400">{scanResult.product.brand}</div>
              )}

              <button
                onClick={handleProceed}
                className="w-full mt-2 py-3 rounded-xl bg-[#FF7A59] hover:bg-[#ff6842] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {scanResult.product?.id ? (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Digitalize & Set Price / Photo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Entry Fallback */}
          <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
            {!showManualInput ? (
              <button
                onClick={() => setShowManualInput(true)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#FF7A59]" />
                <span>Barcode damaged or torn? Type manually</span>
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type barcode number (e.g. 5601...)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#FF7A59] text-white text-xs font-bold hover:bg-[#ff6842] transition"
                >
                  Lookup
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-2 py-2.5 text-xs text-zinc-500 hover:text-zinc-300"
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

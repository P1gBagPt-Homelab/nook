import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, QrCode, X } from "lucide-react";

interface QrLabelModalProps {
  asset: {
    id: string;
    name: string;
    roomLocation: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    qrCodeToken: string;
  } | null;
  onClose: () => void;
}

export function QrLabelModal({ asset, onClose }: QrLabelModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) {
      setQrDataUrl(null);
      return;
    }

    const payload = `${window.location.origin}/?asset=${asset.qrCodeToken}`;
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: {
        dark: "#14201A",
        light: "#FFFFFF",
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [asset]);

  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14201A]/65 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="botanical-card max-w-sm w-full p-5 space-y-4 print:border-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-[#14201A] font-display">
              Printable Asset Sticker
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Sticker"
            className="w-8 h-8 rounded-full bg-[#F4F9F5] flex items-center justify-center text-[#14201A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-[#C4B5FD] text-center space-y-2.5">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9] text-[10px] font-extrabold font-display">
            {asset.roomLocation}
          </div>
          <div className="text-base font-extrabold text-[#14201A] font-display">
            {asset.name}
          </div>

          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR code for ${asset.name}`}
              className="w-44 h-44 mx-auto rounded-xl border border-[#E2ECE4] p-1 bg-white"
            />
          )}

          {(asset.brand || asset.model) && (
            <div className="text-xs font-bold text-[#475B4E]">
              {[asset.brand, asset.model].filter(Boolean).join(" · ")}
            </div>
          )}
          {asset.serialNumber && (
            <div className="text-[11px] font-semibold text-[#5B6B61] tabular-nums">
              S/N: {asset.serialNumber}
            </div>
          )}
          <div className="text-[11px] font-bold text-[#6D28D9] tabular-nums">
            {asset.qrCodeToken}
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold font-display flex items-center justify-center gap-2 transition-colors cursor-pointer print:hidden"
        >
          <Printer className="w-4 h-4" />
          <span>Print Sticker</span>
        </button>
      </div>
    </div>
  );
}

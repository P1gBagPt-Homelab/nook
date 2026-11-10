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
    const videoEl = videoRef.current;
    if (!enabled || !videoEl) return;

    let reader: BrowserMultiFormatReader | null = null;
    let stream: MediaStream | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let controls: { stop: () => void } | null = null;

    async function startScanner() {
      if (!videoEl) return;
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

          interval = setInterval(async () => {
            if (!videoEl || videoEl.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoEl);
              if (barcodes.length > 0) {
                const detected = barcodes[0].rawValue;
                navigator.vibrate?.(40); // Joyful haptic feedback!
                onScan(detected);
              }
            } catch {}
          }, 150);

          return;
        }

        // 2. Fallback to @zxing/browser
        reader = new BrowserMultiFormatReader();
        const scannerControls = await reader.decodeFromVideoElement(
          videoEl,
          (result) => {
            if (result) {
              navigator.vibrate?.(40);
              onScan(result.getText());
            }
          }
        );
        controls = scannerControls;
      } catch (err) {
        console.error("Camera access error:", err);
        setHasCamera(false);
      }
    }

    startScanner();

    return () => {
      if (interval) clearInterval(interval);
      if (controls && typeof controls.stop === "function") {
        controls.stop();
      }
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

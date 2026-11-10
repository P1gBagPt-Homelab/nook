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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const isScanningRef = useRef(false);

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
        setHasCamera(true);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          trackRef.current = stream.getVideoTracks()[0];
          await videoRef.current.play().catch(() => {});
        }

        // 1. Hardware BarcodeDetector API (Supported in modern mobile browsers)
        if ("BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
            });

            interval = setInterval(async () => {
              if (!videoEl || videoEl.readyState < 2 || isScanningRef.current) return;
              try {
                const barcodes = await detector.detect(videoEl);
                if (barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  if (detected) {
                    isScanningRef.current = true;
                    navigator.vibrate?.(50);
                    onScan(detected);
                    setTimeout(() => {
                      isScanningRef.current = false;
                    }, 1200);
                  }
                }
              } catch {}
            }, 180);

            return;
          } catch {
            // fallback to zxing
          }
        }

        // 2. Fallback to @zxing/browser
        reader = new BrowserMultiFormatReader();
        const scannerControls = await reader.decodeFromVideoElement(
          videoEl,
          (result) => {
            if (result && !isScanningRef.current) {
              isScanningRef.current = true;
              navigator.vibrate?.(50);
              onScan(result.getText());
              setTimeout(() => {
                isScanningRef.current = false;
              }, 1200);
            }
          }
        );
        controls = scannerControls;
      } catch (err) {
        console.warn("Camera access note:", err);
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
  }, [enabled, facingMode, onScan]);

  function toggleTorch() {
    if (trackRef.current && "applyConstraints" in trackRef.current) {
      const next = !torchOn;
      (trackRef.current as any)
        .applyConstraints({ advanced: [{ torch: next }] })
        .then(() => setTorchOn(next))
        .catch(() => {});
    }
  }

  function flipCamera() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  return { videoRef, hasCamera, torchOn, toggleTorch, flipCamera, facingMode };
}

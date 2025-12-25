"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@staysafeos/ui";
import { parseIDBarcode, type AAMVAData } from "@/lib/parse-aamva";

interface IDScannerProps {
  onScan: (data: AAMVAData) => void;
  onClose: () => void;
}

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorLike {
  detect: (image: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

export function IDScanner({ onScan, onClose }: IDScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const animationRef = useRef<number>(0);
  const lastScanRef = useRef<number>(0);

  const stopScanner = useCallback(() => {
    // Cancel animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !scanning) return;

    // Throttle scanning to every 100ms for performance
    const now = Date.now();
    if (now - lastScanRef.current < 100) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    lastScanRef.current = now;

    try {
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const barcodes = await detectorRef.current.detect(video);

        for (const barcode of barcodes) {
          console.log("[IDScanner] Detected:", barcode.format, barcode.rawValue.substring(0, 50) + "...");
          const parsed = parseIDBarcode(barcode.rawValue);
          if (parsed) {
            stopScanner();
            onScan(parsed);
            return;
          }
        }
      }
    } catch {
      // Detection errors are normal during scanning
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanFrame);
  }, [scanning, onScan, stopScanner]);

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      try {
        // Import the barcode-detector polyfill (uses ZXing WebAssembly)
        // This works on all browsers including iOS Safari
        const { BarcodeDetector } = await import("barcode-detector/pure");

        if (!mounted) return;

        // Check supported formats
        const formats = await BarcodeDetector.getSupportedFormats();
        console.log("[IDScanner] Supported formats:", formats);

        // Only use PDF417 for ID cards - this prevents picking up 1D barcodes
        if (!formats.includes("pdf417")) {
          throw new Error("PDF417 barcode format is not supported on this device");
        }

        detectorRef.current = new BarcodeDetector({ formats: ["pdf417"] });

        // Request camera access with high resolution for better barcode detection
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
          setInitializing(false);
        }
      } catch (err) {
        if (mounted) {
          console.error("[IDScanner] Error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to access camera. Please ensure camera permissions are granted."
          );
          setInitializing(false);
        }
      }
    }

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [stopScanner]);

  // Start scanning loop when scanning becomes true
  useEffect(() => {
    if (scanning) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scanning, scanFrame]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Scan ID Barcode
            <Button variant="ghost" size="sm" onClick={handleClose}>
              &times;
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleClose}>Enter Manually</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Hold the <strong>back</strong> of the ID card steady within the frame. Make sure the 2D barcode (PDF417) is visible.
              </p>

              <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Scan area overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[35%] border-2 border-white/60 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                  </div>
                </div>
                {/* Corner markers */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[35%] relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                  </div>
                </div>
              </div>

              {initializing && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  Starting camera...
                </p>
              )}

              {scanning && !error && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  Looking for barcode... Keep steady
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Tips for scanning:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Use good lighting (avoid glare)</li>
                  <li>Hold 6-10 inches from camera</li>
                  <li>Keep the card flat and parallel</li>
                  <li>Center the barcode in the frame</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

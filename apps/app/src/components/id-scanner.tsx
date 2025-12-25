"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@staysafeos/ui";
import { parseIDBarcode, type AAMVAData } from "@/lib/parse-aamva";

interface IDScannerProps {
  onScan: (data: AAMVAData) => void;
  onClose: () => void;
}

export function IDScanner({ onScan, onClose }: IDScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      if (!scannerRef.current || !mounted) return;

      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        if (!mounted) return;

        // Configure scanner with PDF417 support (used on ID cards)
        const scanner = new Html5Qrcode("id-scanner-container", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128, // Some IDs use this
            Html5QrcodeSupportedFormats.CODE_39,  // Military IDs often use this
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // Use native browser API if available
          },
        });
        html5QrCodeRef.current = scanner;

        setScanning(true);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15, // Higher FPS for better detection
            qrbox: { width: 350, height: 200 }, // Larger scan area
            aspectRatio: 1.5, // Better aspect for ID cards
            disableFlip: false,
          },
          (decodedText) => {
            // Success callback
            console.log("[IDScanner] Scanned:", decodedText.substring(0, 50) + "...");
            const parsed = parseIDBarcode(decodedText);
            if (parsed) {
              stopScanner();
              onScan(parsed);
            }
          },
          () => {
            // Ignore scan failures (normal during scanning)
          }
        );
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to access camera. Please ensure camera permissions are granted."
          );
          setScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [onScan, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
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
          <p className="text-sm text-muted-foreground">
            Hold the <strong>back</strong> of the ID card steady within the frame. Make sure the 2D barcode (PDF417) is visible.
          </p>

          <div
            id="id-scanner-container"
            ref={scannerRef}
            className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

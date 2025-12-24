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
          ],
          verbose: false,
        });
        html5QrCodeRef.current = scanner;

        setScanning(true);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
            aspectRatio: 2.0,
          },
          (decodedText) => {
            // Success callback
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
      <Card className="w-full max-w-md">
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
            Position the barcode on the back of the ID card within the frame
          </p>

          <div
            id="id-scanner-container"
            ref={scannerRef}
            className="w-full aspect-[2/1] bg-black rounded-lg overflow-hidden"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {scanning && !error && (
            <p className="text-sm text-center text-muted-foreground">
              Scanning for PDF417 barcode...
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Supports: Driver&apos;s Licenses, State IDs, CAC Cards
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@staysafeos/ui";
import { parseIDBarcode, type AAMVAData } from "@/lib/parse-aamva";

interface IDScannerProps {
  onScan: (data: AAMVAData) => void;
  onClose: () => void;
}

// Extend Window to include BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats: () => Promise<string[]>;
    };
  }
}

interface BarcodeDetectorInstance {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>;
}

export function IDScanner({ onScan, onClose }: IDScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const animationRef = useRef<number>(0);

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
    } catch (err) {
      // Detection errors are normal during scanning
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanFrame);
  }, [scanning, onScan, stopScanner]);

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      // Check for BarcodeDetector support
      if (!("BarcodeDetector" in window)) {
        setSupported(false);
        setError("Barcode scanning is not supported on this device. Please enter information manually.");
        return;
      }

      try {
        // Check if PDF417 is supported
        const formats = await window.BarcodeDetector!.getSupportedFormats();
        console.log("[IDScanner] Supported formats:", formats);

        if (!formats.includes("pdf417")) {
          setSupported(false);
          setError("PDF417 barcode format (used on ID cards) is not supported on this device.");
          return;
        }

        setSupported(true);

        // Create detector with PDF417 and other common ID formats
        const supportedFormats = ["pdf417"];
        if (formats.includes("code_128")) supportedFormats.push("code_128");
        if (formats.includes("code_39")) supportedFormats.push("code_39");
        if (formats.includes("qr_code")) supportedFormats.push("qr_code");

        detectorRef.current = new window.BarcodeDetector!({ formats: supportedFormats });

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
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
        }
      } catch (err) {
        if (mounted) {
          console.error("[IDScanner] Error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to access camera. Please ensure camera permissions are granted."
          );
          setScanning(false);
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
          {supported === false ? (
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
                  <div className="w-[80%] h-[40%] border-2 border-white/50 rounded-lg" />
                </div>
              </div>

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

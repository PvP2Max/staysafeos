"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

interface TawkToWidgetProps {
  propertyId?: string;
  widgetId?: string;
}

export function TawkToWidget({ propertyId, widgetId }: TawkToWidgetProps) {
  useEffect(() => {
    // Use environment variables or props
    const propId = propertyId || process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
    const widId = widgetId || process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

    if (!propId || !widId) {
      console.warn("Tawk.to: Missing property ID or widget ID");
      return;
    }

    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propId}/${widId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [propertyId, widgetId]);

  return null;
}

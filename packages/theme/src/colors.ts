/**
 * HSL Color Utilities
 * All colors are stored and manipulated in HSL format for easy palette generation
 */

export type HSL = {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
};

/**
 * Parse an HSL string like "220 80% 50%" into an HSL object
 */
export function parseHSL(hslString: string): HSL {
  // Handle formats: "220 80% 50%", "220, 80%, 50%", "hsl(220, 80%, 50%)"
  const cleaned = hslString
    .replace(/hsl\(|\)/g, "")
    .replace(/,/g, " ")
    .replace(/%/g, "")
    .trim();

  const parts = cleaned.split(/\s+/).map((p) => parseFloat(p));

  if (parts.length < 3 || parts.some((p) => isNaN(p))) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }

  return {
    h: parts[0],
    s: parts[1],
    l: parts[2],
  };
}

/**
 * Convert HSL object to string format "220 80% 50%"
 */
export function formatHSL(hsl: HSL): string {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
}

/**
 * Convert HSL to CSS hsl() function
 */
export function toHSLFunction(hsl: HSL): string {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust lightness of an HSL color
 */
export function adjustLightness(hsl: HSL, amount: number): HSL {
  return {
    ...hsl,
    l: Math.max(0, Math.min(100, hsl.l + amount)),
  };
}

/**
 * Adjust saturation of an HSL color
 */
export function adjustSaturation(hsl: HSL, amount: number): HSL {
  return {
    ...hsl,
    s: Math.max(0, Math.min(100, hsl.s + amount)),
  };
}

/**
 * Clamp saturation to a maximum value
 */
export function clampSaturation(hsl: HSL, maxSaturation: number): HSL {
  return {
    ...hsl,
    s: Math.min(hsl.s, maxSaturation),
  };
}

/**
 * Check if a color is considered "light" (lightness > 50)
 */
export function isLight(hsl: HSL): boolean {
  return hsl.l > 50;
}

/**
 * Get a contrasting foreground color (black or white)
 */
export function getContrastingForeground(hsl: HSL): HSL {
  return isLight(hsl)
    ? { h: hsl.h, s: Math.min(hsl.s, 15), l: 10 } // Dark text
    : { h: hsl.h, s: Math.min(hsl.s, 15), l: 98 }; // Light text
}

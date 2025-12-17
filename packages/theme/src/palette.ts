/**
 * Automatic Palette Generation
 * Generates a complete ShadCN-compatible color palette from a single primary color
 */

import {
  HSL,
  parseHSL,
  formatHSL,
  hexToHSL,
  isLight,
} from "./colors";

export type ColorPalette = {
  // Core colors
  primary: string;
  primaryForeground: string;

  // Background/Surface
  background: string;
  foreground: string;

  // Card/Paper surfaces
  card: string;
  cardForeground: string;

  // Popover/Dropdown
  popover: string;
  popoverForeground: string;

  // Muted/Secondary surfaces
  muted: string;
  mutedForeground: string;
  secondary: string;
  secondaryForeground: string;

  // Accent
  accent: string;
  accentForeground: string;

  // Semantic colors
  destructive: string;
  destructiveForeground: string;

  // Borders and inputs
  border: string;
  input: string;
  ring: string;

  // Chart colors (for data visualization)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

export type Theme = {
  light: ColorPalette;
  dark: ColorPalette;
};

/**
 * Generate a complete color palette from a primary color
 * @param primaryColor - HSL string "220 80% 50%" or hex "#3B82F6"
 */
export function generatePalette(primaryColor: string): Theme {
  // Parse the primary color
  let primary: HSL;

  if (primaryColor.startsWith("#")) {
    primary = hexToHSL(primaryColor);
  } else {
    primary = parseHSL(primaryColor);
  }

  const { h, s } = primary;

  // Light theme palette
  const light: ColorPalette = {
    // Primary - use as-is
    primary: formatHSL(primary),
    primaryForeground: isLight(primary)
      ? `${h} ${Math.min(s, 15)}% 10%`
      : `${h} ${Math.min(s, 15)}% 98%`,

    // Background - very light, low saturation
    background: `${h} ${Math.min(s, 20)}% 98%`,
    foreground: `${h} ${Math.min(s, 15)}% 10%`,

    // Card - slightly off-white
    card: `${h} ${Math.min(s, 15)}% 100%`,
    cardForeground: `${h} ${Math.min(s, 15)}% 10%`,

    // Popover - same as card
    popover: `${h} ${Math.min(s, 15)}% 100%`,
    popoverForeground: `${h} ${Math.min(s, 15)}% 10%`,

    // Muted - light gray with hint of primary
    muted: `${h} ${Math.min(s, 20)}% 95%`,
    mutedForeground: `${h} ${Math.min(s, 15)}% 40%`,

    // Secondary - similar to muted
    secondary: `${h} ${Math.min(s, 20)}% 93%`,
    secondaryForeground: `${h} ${Math.min(s, 15)}% 15%`,

    // Accent - light primary tint
    accent: `${h} ${Math.min(s * 0.8, 60)}% 96%`,
    accentForeground: `${h} ${Math.min(s, 15)}% 10%`,

    // Destructive - red
    destructive: "0 84% 60%",
    destructiveForeground: "0 0% 98%",

    // Borders and inputs
    border: `${h} ${Math.min(s, 20)}% 90%`,
    input: `${h} ${Math.min(s, 20)}% 90%`,
    ring: formatHSL(primary),

    // Chart colors - variations around primary hue
    chart1: formatHSL({ h, s: Math.min(s, 70), l: 50 }),
    chart2: formatHSL({ h: (h + 30) % 360, s: Math.min(s, 70), l: 55 }),
    chart3: formatHSL({ h: (h + 60) % 360, s: Math.min(s, 70), l: 60 }),
    chart4: formatHSL({ h: (h + 90) % 360, s: Math.min(s, 70), l: 55 }),
    chart5: formatHSL({ h: (h + 120) % 360, s: Math.min(s, 70), l: 50 }),
  };

  // Dark theme palette
  const dark: ColorPalette = {
    // Primary - slightly adjusted for dark mode
    primary: formatHSL({ h, s: Math.min(s, 80), l: 55 }),
    primaryForeground: `${h} ${Math.min(s, 15)}% 10%`,

    // Background - very dark
    background: `${h} ${Math.min(s, 30)}% 8%`,
    foreground: `${h} ${Math.min(s, 15)}% 95%`,

    // Card - slightly lighter than background
    card: `${h} ${Math.min(s, 25)}% 10%`,
    cardForeground: `${h} ${Math.min(s, 15)}% 95%`,

    // Popover - same as card
    popover: `${h} ${Math.min(s, 25)}% 10%`,
    popoverForeground: `${h} ${Math.min(s, 15)}% 95%`,

    // Muted - dark gray
    muted: `${h} ${Math.min(s, 25)}% 18%`,
    mutedForeground: `${h} ${Math.min(s, 15)}% 65%`,

    // Secondary
    secondary: `${h} ${Math.min(s, 25)}% 20%`,
    secondaryForeground: `${h} ${Math.min(s, 15)}% 95%`,

    // Accent
    accent: `${h} ${Math.min(s * 0.8, 50)}% 20%`,
    accentForeground: `${h} ${Math.min(s, 15)}% 95%`,

    // Destructive - darker red
    destructive: "0 72% 50%",
    destructiveForeground: "0 0% 98%",

    // Borders and inputs
    border: `${h} ${Math.min(s, 25)}% 20%`,
    input: `${h} ${Math.min(s, 25)}% 20%`,
    ring: formatHSL({ h, s: Math.min(s, 80), l: 55 }),

    // Chart colors - brighter for dark mode
    chart1: formatHSL({ h, s: Math.min(s, 80), l: 55 }),
    chart2: formatHSL({ h: (h + 30) % 360, s: Math.min(s, 80), l: 60 }),
    chart3: formatHSL({ h: (h + 60) % 360, s: Math.min(s, 80), l: 65 }),
    chart4: formatHSL({ h: (h + 90) % 360, s: Math.min(s, 80), l: 60 }),
    chart5: formatHSL({ h: (h + 120) % 360, s: Math.min(s, 80), l: 55 }),
  };

  return { light, dark };
}

/**
 * Generate CSS custom properties from a palette
 */
export function paletteToCSSVariables(
  palette: ColorPalette,
  prefix = ""
): Record<string, string> {
  const pre = prefix ? `${prefix}-` : "";

  return {
    [`--${pre}background`]: palette.background,
    [`--${pre}foreground`]: palette.foreground,
    [`--${pre}card`]: palette.card,
    [`--${pre}card-foreground`]: palette.cardForeground,
    [`--${pre}popover`]: palette.popover,
    [`--${pre}popover-foreground`]: palette.popoverForeground,
    [`--${pre}primary`]: palette.primary,
    [`--${pre}primary-foreground`]: palette.primaryForeground,
    [`--${pre}secondary`]: palette.secondary,
    [`--${pre}secondary-foreground`]: palette.secondaryForeground,
    [`--${pre}muted`]: palette.muted,
    [`--${pre}muted-foreground`]: palette.mutedForeground,
    [`--${pre}accent`]: palette.accent,
    [`--${pre}accent-foreground`]: palette.accentForeground,
    [`--${pre}destructive`]: palette.destructive,
    [`--${pre}destructive-foreground`]: palette.destructiveForeground,
    [`--${pre}border`]: palette.border,
    [`--${pre}input`]: palette.input,
    [`--${pre}ring`]: palette.ring,
    [`--${pre}chart-1`]: palette.chart1,
    [`--${pre}chart-2`]: palette.chart2,
    [`--${pre}chart-3`]: palette.chart3,
    [`--${pre}chart-4`]: palette.chart4,
    [`--${pre}chart-5`]: palette.chart5,
  };
}

/**
 * Generate a complete CSS string for theme variables
 */
export function generateThemeCSS(theme: Theme): string {
  const lightVars = paletteToCSSVariables(theme.light);
  const darkVars = paletteToCSSVariables(theme.dark);

  const lightCSS = Object.entries(lightVars)
    .map(([key, value]) => `    ${key}: ${value};`)
    .join("\n");

  const darkCSS = Object.entries(darkVars)
    .map(([key, value]) => `    ${key}: ${value};`)
    .join("\n");

  return `:root {
${lightCSS}
  }

  .dark {
${darkCSS}
  }`;
}

/**
 * Default StaySafeOS theme (blue primary)
 */
export const defaultTheme = generatePalette("#3B82F6");

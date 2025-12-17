/**
 * @staysafeos/theme
 * Shared theming system for StaySafeOS platform
 */

// Color utilities
export {
  type HSL,
  parseHSL,
  formatHSL,
  toHSLFunction,
  hexToHSL,
  hslToHex,
  adjustLightness,
  adjustSaturation,
  clampSaturation,
  isLight,
  getContrastingForeground,
} from "./colors";

// Palette generation
export {
  type ColorPalette,
  type Theme,
  generatePalette,
  paletteToCSSVariables,
  generateThemeCSS,
  defaultTheme,
} from "./palette";

// CSS variable injection (client-side)
export {
  type ThemeConfig,
  injectTheme,
  clearTheme,
  updateFavicon,
  getThemeMode,
  toggleThemeMode,
  setThemeMode,
  getThemeStyleObject,
  getThemeStyleTag,
} from "./css-variables";

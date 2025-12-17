/**
 * CSS Variable Injection Utilities
 * For dynamically applying themes at runtime
 */

import { generatePalette, paletteToCSSVariables, type ColorPalette } from "./palette";

export type ThemeConfig = {
  primaryColor: string; // HSL string or hex
  logoUrl?: string | null;
  faviconUrl?: string | null;
};

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Inject theme CSS variables into the document
 * Call this on the client side to dynamically apply a theme
 */
export function injectTheme(config: ThemeConfig, isDarkMode = false): void {
  if (typeof document === "undefined") {
    console.warn("injectTheme can only be called in browser environment");
    return;
  }

  const theme = generatePalette(config.primaryColor);
  const palette = isDarkMode ? theme.dark : theme.light;
  const cssVars = paletteToCSSVariables(palette);

  const root = document.documentElement;

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Update favicon if provided
  if (config.faviconUrl) {
    updateFavicon(config.faviconUrl);
  }
}

/**
 * Remove custom theme and reset to defaults
 */
export function clearTheme(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const cssVarNames = [
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--primary",
    "--primary-foreground",
    "--secondary",
    "--secondary-foreground",
    "--muted",
    "--muted-foreground",
    "--accent",
    "--accent-foreground",
    "--destructive",
    "--destructive-foreground",
    "--border",
    "--input",
    "--ring",
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
  ];

  cssVarNames.forEach((name) => {
    root.style.removeProperty(name);
  });
}

/**
 * Update the page favicon
 */
export function updateFavicon(url: string): void {
  if (typeof document === "undefined") return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = url;
}

/**
 * Get the current theme mode from the document
 */
export function getThemeMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Toggle between light and dark mode
 */
export function toggleThemeMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  if (isDark) {
    root.classList.remove("dark");
    return "light";
  } else {
    root.classList.add("dark");
    return "dark";
  }
}

/**
 * Set theme mode explicitly
 */
export function setThemeMode(mode: "light" | "dark" | "system"): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
}

/**
 * Generate inline style object for server-side rendering
 */
export function getThemeStyleObject(
  config: ThemeConfig,
  isDarkMode = false
): Record<string, string> {
  const theme = generatePalette(config.primaryColor);
  const palette = isDarkMode ? theme.dark : theme.light;
  return paletteToCSSVariables(palette);
}

/**
 * Generate a <style> tag content for SSR
 */
export function getThemeStyleTag(config: ThemeConfig): string {
  const theme = generatePalette(config.primaryColor);
  const lightVars = paletteToCSSVariables(theme.light);
  const darkVars = paletteToCSSVariables(theme.dark);

  const lightCSS = Object.entries(lightVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");

  const darkCSS = Object.entries(darkVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");

  return `<style>:root { ${lightCSS} } .dark { ${darkCSS} }</style>`;
}

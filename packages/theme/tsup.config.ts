import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/tailwind-preset.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["tailwindcss"],
});

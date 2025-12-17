import type { Config } from "tailwindcss";
import { staysafeosPreset } from "@staysafeos/theme/tailwind";

const config: Config = {
  presets: [staysafeosPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

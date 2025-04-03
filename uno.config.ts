import { createLocalFontProcessor } from "@unocss/preset-web-fonts/local";

import {
  defineConfig,
  presetAttributify,
  presetWind4,
  transformerDirectives,
  presetIcons,
  presetWebFonts,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind4({}),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
        height: "1.2em",
        width: "1.2em",
        "vertical-align": "text-bottom",
      },
    }),
    presetWebFonts({
      fonts: {
        sans: "Inter",
        mono: "DM Mono",
        condensed: "Roboto Condensed",
        wisper: "Bad Script",
      },
      processors: createLocalFontProcessor(),
    }),
  ],
  transformers: [
    transformerDirectives({
      applyVariable: ["--at-apply", "--uno-apply", "--uno"],
    }),
  ],
});

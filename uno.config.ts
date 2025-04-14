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
  content: {
    pipeline: {
      // md 里面某些比如 app-index 会被错误解析 p-index
      exclude: ["posts/*.md", "dev-posts/*.md"],
    },
  },
  presets: [
    presetWind4({}),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
        height: "1em",
        width: "1em",
        "vertical-align": "-0.125em",
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

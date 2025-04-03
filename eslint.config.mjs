import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import unocss from "@unocss/eslint-config/flat";
import pluginPrettierRecomended from "eslint-plugin-prettier/recommended";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import autoImportJson from "./.eslintrc-auto-import.js";

export default defineConfig([
  globalIgnores([
    // "docs/.vitepress/cache/**/*",
    ".eslintrc-auto-import.js",
    "auto-import.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,vue}"],
    plugins: {
      js,
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    extends: ["js/recommended"],
    languageOptions: {
      globals: Object.assign({}, globals.browser, autoImportJson.globals),
      parser: tseslint.parser,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  tseslint.configs.recommended,
  {
    files: ["src/**/*.vue"],
    extends: [pluginVue.configs["flat/essential"]],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  unocss,
  pluginPrettierRecomended,
]);

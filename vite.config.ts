import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import unocss from "unocss/vite";
import autoImport from "unplugin-auto-import/vite";
import components from "unplugin-vue-components/vite";
import inspect from "vite-plugin-inspect";
// import exclude from "vite-plugin-optimize-exclude";
import markdown from "unplugin-vue-markdown/vite";
import markdownItShiki from "@shikijs/markdown-it";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import anchor from "markdown-it-anchor";
import gitHubAlerts from "markdown-it-github-alerts";
import linkAttributes from "markdown-it-link-attributes";
import { slugify } from "./scripts/slugify";
// @ts-expect-error missing types
import toc from "markdown-it-table-of-contents";
import markdownItMagicLink from "markdown-it-magic-link";
import { buildRouteMeta } from "./scripts/buildRouteMeta";
import { markdownFrontmatterPlugin } from "./scripts/markdownFrontmatterPlugin";
import { MarkdownItAsync } from "markdown-it-async";
import vueDevTools from "vite-plugin-vue-devtools";
import generateSitemap from "vite-ssg-sitemap";

const __dirname = dirname(fileURLToPath(import.meta.url));

let markdownitAsyncInstance: MarkdownItAsync | undefined;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    envPrefix: "GITHUB_",
    optimizeDeps: {
      include: [
        "vue",
        "vue-router",
        "@vueuse/core",
        "@vueuse/components",
        "@vueuse/router",
      ],
    },
    plugins: [
      vue({
        include: [/\.vue$/, /\.md$/],
      }),
      vueDevTools(),
      unocss(),
      autoImport({
        imports: ["vue", "pinia", "@vueuse/core", VueRouterAutoImports],
        dts: resolve(__dirname, "auto-imports.d.ts"),
        eslintrc: {
          enabled: true,
          filepath: resolve(__dirname, ".eslintrc-auto-import.js"),
        },
      }),
      components({
        extensions: ["vue", "md"],
        dts: true,
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      }),
      markdown({
        wrapperClasses: "kan-doc",
        headEnabled: true,
        exportFrontmatter: true,
        exposeFrontmatter: true,
        exposeExcerpt: true,
        markdownItOptions: {
          quotes: "\"\"''",
        },
        async markdownItSetup(md) {
          md.use(
            await markdownItShiki({
              themes: {
                dark: "vitesse-dark",
                light: "vitesse-light",
              },
              defaultColor: false,
              cssVariablePrefix: "--s-",
              transformers: [
                transformerTwoslash({
                  explicitTrigger: true,
                  renderer: rendererRich(),
                }),
                transformerNotationDiff(),
                transformerNotationHighlight(),
                transformerNotationWordHighlight(),
              ],
            }),
          );

          md.use(anchor, {
            slugify,
            permalink: anchor.permalink.linkInsideHeader({
              symbol: "🔗",
              // renderAttrs: () => ({ "aria-hidden": "true" }),
            }),
          });

          md.use(linkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: "_blank",
              rel: "noopener",
            },
          });

          md.use(toc, {
            includeLevel: [1, 2, 3, 4, 5, 6],
            slugify,
            containerClass: "mujika-toc-container",
          });

          md.use(markdownItMagicLink, {
            linksMap: {
              NuxtLabs: "https://nuxtlabs.com",
              Vitest: "https://github.com/vitest-dev/vitest",
              Slidev: "https://github.com/slidevjs/slidev",
              VueUse: "https://github.com/vueuse/vueuse",
              UnoCSS: "https://github.com/unocss/unocss",
              Elk: "https://github.com/elk-zone/elk",
              "Type Challenges":
                "https://github.com/type-challenges/type-challenges",
              Vue: "https://github.com/vuejs/core",
              Nuxt: "https://github.com/nuxt/nuxt",
              Vite: "https://github.com/vitejs/vite",
              Shiki: "https://github.com/shikijs/shiki",
              Twoslash: "https://github.com/twoslashes/twoslash",
              "ESLint Stylistic":
                "https://github.com/eslint-stylistic/eslint-stylistic",
              Unplugin: "https://github.com/unplugin",
              "Nuxt DevTools": "https://github.com/nuxt/devtools",
              "Vite PWA": "https://github.com/vite-pwa",
              "i18n Ally": "https://github.com/lokalise/i18n-ally",
              ESLint: "https://github.com/eslint/eslint",
              Astro: "https://github.com/withastro/astro",
              TwoSlash: "https://github.com/twoslashes/twoslash",
              "Anthony Fu Collective": {
                link: "https://opencollective.com/antfu",
                imageUrl: "https://github.com/antfu-collective.png",
              },
              Netlify: {
                link: "https://netlify.com",
                imageUrl: "https://github.com/netlify.png",
              },
              Stackblitz: {
                link: "https://stackblitz.com",
                imageUrl: "https://github.com/stackblitz.png",
              },
              Vercel: {
                link: "https://vercel.com",
                imageUrl: "https://github.com/vercel.png",
              },
            },
            imageOverrides: [
              ["https://github.com/vuejs/core", "https://vuejs.org/logo.svg"],
              [
                "https://github.com/nuxt/nuxt",
                "https://nuxt.com/assets/design-kit/icon-green.svg",
              ],
              ["https://github.com/vitejs/vite", "https://vitejs.dev/logo.svg"],
              ["https://github.com/sponsors", "https://github.com/github.png"],
              [
                "https://github.com/sponsors/antfu",
                "https://github.com/github.png",
              ],
              ["https://nuxtlabs.com", "https://github.com/nuxtlabs.png"],
              [/opencollective\.com\/vite/, "https://github.com/vitejs.png"],
              [/opencollective\.com\/elk/, "https://github.com/elk-zone.png"],
            ],
          });

          md.use(gitHubAlerts);

          md.use(markdownFrontmatterPlugin);

          markdownitAsyncInstance = md;
        },
        // frontmatterPreprocess(frontmatter, options, id, defaults) {
        //   (() => {
        //     if (!id.endsWith(".md")) return;
        //     const route = basename(id, ".md");
        //     if (route === "index" || frontmatter.image || !frontmatter.title)
        //       return;
        //     const path = `og/${route}.png`;
        //     promises.push(
        //       fs.existsSync(`${id.slice(0, -3)}.png`)
        //         ? fs.copy(`${id.slice(0, -3)}.png`, `public/${path}`)
        //         : generateOg(
        //             frontmatter.title!.replace(/\s-\s.*$/, "").trim(),
        //             `public/${path}`,
        //           ),
        //     );
        //     frontmatter.image = `https://antfu.me/${path}`;
        //   })();
        //   const head = defaults(frontmatter, options);
        //   return { head, frontmatter };
        // },
      }),
      vueRouter({
        extensions: [".vue", ".md"],
        routesFolder: [
          resolve(__dirname, "src", "pages"),
          resolve(__dirname, "src", mode === "development" ? "test" : "test"),
        ],
        async extendRoute(route) {
          await buildRouteMeta(route, markdownitAsyncInstance!);
        },
        // async beforeWriteFiles(rootRoute) {
        // rewriteRoutePath(rootRoute);
        // },
      }),
      inspect(),
      // 该插件会导致 Octokit 导入不正确
      // exclude(),
      // viteCdnPlugin({
      //   modules: ["vue"],
      // }),
      {
        name: "cdn",
        transformIndexHtml() {
          if (!isProd) {
            return [];
          }
          return [
            {
              tag: "script",
              attrs: {
                type: "importMap",
              },
              children: JSON.stringify({
                imports: {
                  vue: "https://cdn.jsdelivr.net/npm/vue/+esm",
                  "vue-router": "https://cdn.jsdelivr.net/npm/vue-router/+esm",
                  pinia: "https://cdn.jsdelivr.net/npm/pinia/+esm",
                  "@vueuse/core":
                    "https://cdn.jsdelivr.net/npm/@vueuse/core/+esm",
                  "@vueuse/components":
                    "https://cdn.jsdelivr.net/npm/@vueuse/components/+esm",
                  "@vueuse/router":
                    "https://cdn.jsdelivr.net/npm/@vueuse/router/+esm",
                  "@vueuse/shared":
                    "https://cdn.jsdelivr.net/npm/@vueuse/shared/+esm",
                  "date-fns": "https://cdn.jsdelivr.net/npm/date-fns/+esm",
                  nprogress: "https://cdn.jsdelivr.net/npm/nprogress/+esm",
                  octokit: "https://cdn.jsdelivr.net/npm/octokit/+esm",
                  "pinia-plugin-persistedstate":
                    "https://cdn.jsdelivr.net/npm/pinia-plugin-persistedstate/+esm",
                  "vue-router-better-scroller":
                    "https://cdn.jsdelivr.net/npm/vue-router-better-scroller/+esm",
                },
              }),
            },
          ];
        },
      },
    ],
    resolve: {
      alias: {
        "~": resolve(__dirname, "pages"),
        "@": resolve(__dirname, "src"),
      },
    },
    ssgOptions: {
      script: "async",
      formatting: "minify",
      beastiesOptions: {
        reduceInlineStyles: false,
      },
      onFinished() {
        generateSitemap();
      },
    },
    build: {
      rollupOptions: {
        external: [
          "vue",
          "vue-router",
          "@vueuse/core",
          "@vueuse/components",
          "@vueuse/router",
          "pinia",
          "octokit",
          "date-fns",
          "nprogress",
          "pinia-plugin-persistedstate",
          "vue-router-better-scroller",
        ],
      },
    },
  };
});

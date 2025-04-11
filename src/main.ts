import "@unocss/reset/tailwind.css";
import "markdown-it-github-alerts/styles/github-colors-light.css";
import "markdown-it-github-alerts/styles/github-colors-dark-class.css";
import "markdown-it-github-alerts/styles/github-base.css";
import "@shikijs/twoslash/style-rich.css";
import "shiki-magic-move/style.css";
import "./styles/index.scss";
import "uno.css";

import NProgress from "nprogress";
import { ViteSSG } from "vite-ssg";
import { routes } from "vue-router/auto-routes";
import { setupRouterScroller } from "vue-router-better-scroller";

import App from "./App.vue";
import pinia from "./stores";
import { type MarkdownPage, PageType } from "./types";

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ app, router, isClient }) => {
    app.use(pinia);

    if (isClient) {
      const html = document.querySelector("html")!;
      setupRouterScroller(router, {
        selectors: {
          html(ctx) {
            // only do the sliding transition when the scroll position is not 0
            // Disable sliding transition on Dev Mode
            if (ctx.savedPosition?.top || import.meta.hot) {
              html.classList.add("no-sliding");
            } else {
              html.classList.remove("no-sliding");
            }
            return true;
          },
        },
        behavior: "auto",
      });

      router.beforeEach((to) => {
        const { page } = to.meta;
        if (page.type === PageType.MD) {
          document.title = (page as MarkdownPage).title + " | 恋の歌";
        }
        NProgress.start();
      });
      router.afterEach(() => {
        NProgress.done();
      });
    }
  },
);

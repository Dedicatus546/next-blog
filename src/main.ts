import "@unocss/reset/tailwind.css";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import "markdown-it-github-alerts/styles/github-colors-light.css";
import "markdown-it-github-alerts/styles/github-colors-dark-class.css";
import "markdown-it-github-alerts/styles/github-base.css";
import "@shikijs/twoslash/style-rich.css";
// import "shiki-magic-move/style.css";
import "./styles/index.scss";
import "uno.css";

import NProgress from "nprogress";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { ViteSSG } from "vite-ssg";
import { routes } from "vue-router/auto-routes";
import { setupRouterScroller } from "vue-router-better-scroller";

import App from "./App.vue";
import pinia from "./stores";

console.log("routes", routes);

export const createApp = ViteSSG(
  // the root component
  App,
  // vue-router options
  { routes },
  // function to have custom setups
  ({ app, router, isClient }) => {
    app.use(pinia);

    if (isClient) {
      pinia.use(piniaPluginPersistedstate);
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
        document.title = (page.title ? `${page.title} - ` : "") + "恋の歌";
        NProgress.start();
      });
      router.afterEach(() => {
        NProgress.done();
      });
    }
  },
);

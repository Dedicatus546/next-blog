import "vue-router";

import { Page } from "./types";
declare module "vue-router" {
  interface RouteMeta {
    page: Page;
  }
}

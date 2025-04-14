import { format, fromUnixTime } from "date-fns";

import { type MarkdownPage, PageType } from "@/types";

export const useRootStore = defineStore("root-store", () => {
  const state = reactive<{
    list: MarkdownPage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    };
  }>({
    list: [],
    pagination: {
      page: 1,
      pageSize: Number.parseInt(import.meta.env.P9_PAGESIZE),
      total: 0,
    },
  });

  const router = useRouter();
  const route = useRoute();

  // TODO 下面两个函数功能重复，或许可以提取出来
  const initPage = (route: ReturnType<typeof useRoute>) => {
    if (route.path === "/") {
      state.pagination.page = 1;
    } else if (/pages\/\d+/.test(route.path)) {
      const page = Number.parseInt(
        route.path.slice(route.path.lastIndexOf("/") + 1),
      );
      state.pagination.page = page;
    }
  };

  router.beforeEach((to) => {
    if (to.path === "/") {
      state.pagination.page = 1;
    } else if (/pages\/\d+/.test(to.path)) {
      const page = Number.parseInt(to.path.slice(to.path.lastIndexOf("/") + 1));
      state.pagination.page = page;
    }
  });

  const init = () => {
    const routeList = router.getRoutes();
    state.list = routeList
      .filter((item) => item.meta.page.type === PageType.MD)
      .sort((a, b) => {
        const aPage = a.meta.page as MarkdownPage;
        const bPage = b.meta.page as MarkdownPage;
        if (bPage.top - aPage.top !== 0) {
          return bPage.top - aPage.top;
        }
        return new Date(bPage.date).getTime() - new Date(aPage.date).getTime();
      })
      .map((item) => item.meta.page as MarkdownPage);
    state.pagination.total = state.list.length;
    initPage(route);
  };

  init();

  const categoryList = computed(() => {
    const set = new Set<string>();
    state.list.forEach((item) => {
      item.categories?.forEach((category) => set.add(category));
    });
    return Array.from(set);
  });

  const tagList = computed(() => {
    const set = new Set<string>();
    state.list.forEach((item) => {
      item.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  });

  const renderList = computed(() => {
    const { page, pageSize } = state.pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return state.list.slice(start, end);
  });

  const archiveList = computed(() => {
    return Object.entries(
      Object.groupBy(state.list, (item) =>
        format(fromUnixTime(item.date), "yyyy年MM月"),
      ),
    )
      .map(([month, list]) => {
        return {
          month,
          list: list ?? [],
        };
      })
      .reverse();
  });

  const onPageChange = (page: number) => {
    state.pagination.page = page;
  };

  return {
    state,
    renderList,
    categoryList,
    archiveList,
    tagList,
    onPageChange,
  };
});

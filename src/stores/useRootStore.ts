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
      pageSize: 0,
      total: 0,
    },
  });

  const router = useRouter();

  const init = () => {
    const routeList = router.getRoutes();
    state.list = routeList
      .filter((item) => item.meta.page.type === PageType.MD)
      .sort((a, b) => {
        const { date: aDate } = a.meta.page as MarkdownPage;
        const { date: bDate } = b.meta.page as MarkdownPage;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .map((item) => item.meta.page as MarkdownPage);
    state.pagination.pageSize = Math.min(3, state.list.length);
    state.pagination.total = state.list.length;
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

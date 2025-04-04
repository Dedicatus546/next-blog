import type { MarkdownPage } from "@/types";

export const usePost = () => {
  const route = useRoute();
  return computed(() => route.meta.page as MarkdownPage);
};

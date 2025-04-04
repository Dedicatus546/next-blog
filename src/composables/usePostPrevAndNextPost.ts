import { useRootStore } from "@/stores/useRootStore";

export const usePostPrevAndNextPost = (hash: MaybeRefOrGetter<string>) => {
  const rootStore = useRootStore();
  const index = computed(() => {
    const hashValue = toValue(hash);
    const list = rootStore.state.list;
    const index = list.findIndex((item) => item.hash === hashValue);
    return index;
  });
  return {
    prev: computed(() =>
      index.value <= 0 ? undefined : rootStore.state.list[index.value - 1],
    ),
    next: computed(() =>
      index.value >= rootStore.state.list.length - 1
        ? undefined
        : rootStore.state.list[index.value + 1],
    ),
  };
};

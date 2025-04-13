import { Fancybox } from "@fancyapps/ui";

export const useFancyBox = (
  containerRef: MaybeRefOrGetter<HTMLElement | null>,
) => {
  onMounted(() => {
    Fancybox.bind(toValue(containerRef), "[data-fancybox]", {
      // Your custom options
    });
  });
};

import FancyApps from "@fancyapps/ui";

const { Fancybox } = FancyApps;

export const useFancyBox = (
  containerRef: MaybeRefOrGetter<HTMLElement | null>,
) => {
  onMounted(() => {
    Fancybox.bind(toValue(containerRef), "[data-fancybox]", {
      // Your custom options
    });
  });
};

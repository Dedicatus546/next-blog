<script setup lang="ts">
import { usePostTocList } from "@/composables/usePostTocList";

const { y } = useWindowScroll({
  behavior: "smooth",
});

const { tocList } = usePostTocList();
const showToc = ref(false);
// const isLocked = useScrollLock(document);
// syncRef(showToc, isLocked);

const closeTocOverlay = () => {
  showToc.value = false;
};
</script>

<template>
  <div
    v-if="showToc"
    flex
    items-center
    inset-2
    justify-center
    fixed
    z-10
    backdrop-blur-md
    lg:hidden
  >
    <MujikaCard :padding-level="2">
      <MujikaTocList :list="tocList" @click="closeTocOverlay" />
    </MujikaCard>
  </div>
  <div flex="~ col" gap-2 bottom-24 right-4 fixed z-10>
    <button
      bg="[var(--mygo-c-bg)]"
      shadow="[var(--mygo-shadow-1)]"
      leading-0
      rounded-full
      flex
      w-40px
      aspect-ratio-square
      items-center
      justify-center
      lg:hidden
      @click="showToc = !showToc"
    >
      <i class="i-ri:menu-2-fill" text-2xl></i>
    </button>
    <button
      :class="{
        invisible: y < 60,
      }"
      bg="[var(--mygo-c-bg)]"
      shadow="[var(--mygo-shadow-1)]"
      leading-0
      rounded-full
      flex
      w-40px
      aspect-ratio-square
      items-center
      justify-center
      lg:w-60px
      @click="y = 0"
    >
      <i class="i-mi:caret-up" text-3xl></i>
    </button>
  </div>
</template>

<style scoped lang="scss"></style>

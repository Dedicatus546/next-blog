<script setup lang="ts">
import { usePostPrevAndNextPost } from "@/composables/usePostPrevAndNextPost";
import MujikaGitTalk from "@/packages/MujikaGitTalk/MujikaGitTalk.vue";
import type { MarkdownPage } from "@/types";

import MujikaCard from "./MujikaCard.vue";
// import MujikaPostMeta from "./MujikaPostMeta.vue";

const { meta } = useRoute();
const page = computed(() => meta.page as MarkdownPage);
const { prev, next } = usePostPrevAndNextPost(() => page.value.hash);

useEventListener(window, "hashchange", () => {
  // 需要和 tocList 组件抽取复用逻辑
  if (location.hash) {
    const el = document.querySelector(decodeURIComponent(location.hash));
    if (el) {
      const rect = el.getBoundingClientRect();
      const y = window.scrollY + rect.top - 20;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  }
  // TODO 这里带有 hash 的 url 初次进入没有滚动到指定位置
});
</script>

<template>
  <div flex gap-2 items-start>
    <div flex="~ col grow" gap-2 min-w-0>
      <MujikaCard :padding-level="2">
        <div flex="~ col" gap-4>
          <h1 text="34px center">{{ page.title }}</h1>
        </div>
        <slot />
        <div flex="~ wrap" mt-8 gap-4 justify-center>
          <div v-for="item of page.tags" :key="item">#{{ item }}</div>
        </div>
      </MujikaCard>
      <MujikaCard :padding-level="2">
        <div flex>
          <RouterLink :to="prev.path" v-if="prev">
            <i class="i-mi:chevron-left" mr-1></i>
            <span>{{ prev.title }}</span>
          </RouterLink>
          <RouterLink :to="next.path" ml-auto v-if="next">
            <span>{{ next.title }}</span>
            <i class="i-mi:chevron-right" ml-1></i>
          </RouterLink>
        </div>
      </MujikaCard>
      <MujikaGitTalk />
    </div>
    <MujikaAside />
  </div>
</template>

<style scoped lang="scss"></style>

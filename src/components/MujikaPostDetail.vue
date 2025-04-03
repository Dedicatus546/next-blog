<script setup lang="ts">
import { usePostDetailData } from "@/composables/usePostDetailData";
import MujikaGitTalk from "@/packages/MujikaGitTalk/MujikaGitTalk.vue";

import MujikaCard from "./MujikaCard.vue";
import MujikaPostMeta from "./MujikaPostMeta.vue";

const postDetail = usePostDetailData();

onMounted(() => {
  useEventListener(window, "hashchange", () => {
    if (location.hash) {
      const el = document.querySelector(decodeURIComponent(location.hash));
      if (el) {
        const rect = el.getBoundingClientRect();
        const y = window.scrollY + rect.top;
        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    }
  });
});
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-4>
      <h1 text="34px center">{{ postDetail.title }}</h1>
      <MujikaPostMeta :meta="postDetail" />
    </div>
    <Content class="kan-doc mt-8" />
    <div flex="~ wrap" mt-8 gap-4 justify-center>
      <div v-for="item of postDetail.tags" :key="item">#{{ item }}</div>
    </div>
  </MujikaCard>
  <MujikaCard :padding-level="2">
    <div flex>
      <a v-if="postDetail.prev" :href="postDetail.prev.url">
        <i class="i-mi:chevron-left" mr-1></i>
        <span>{{ postDetail.prev.text }}</span>
      </a>
      <a ml-auto v-if="postDetail.next" :href="postDetail.next.url">
        <span>{{ postDetail.next.text }}</span>
        <i class="i-mi:chevron-right" ml-1></i>
      </a>
    </div>
  </MujikaCard>
  <MujikaGitTalk />
</template>

<style scoped lang="scss"></style>

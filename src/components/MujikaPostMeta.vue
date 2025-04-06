<script setup lang="ts">
import { format, fromUnixTime } from "date-fns";

import type { MarkdownPage } from "@/types";

const { page } = defineProps<{
  page: MarkdownPage;
}>();

const date = computed(() =>
  format(fromUnixTime(page.date), "yyyy-MM-dd HH:mm"),
);
const updated = computed(() =>
  format(fromUnixTime(page.updated), "yyyy-MM-dd HH:mm"),
);

const formatedWordCount = computed(() => {
  const { wordCount } = page;
  if (wordCount > 1000) {
    return `${Math.floor(wordCount / 1000)}.${Math.floor(wordCount / 100) % 10}K`;
  }
  return wordCount;
});

const time = computed(() => {
  function getFormatTime(minutes: number, suffix: string) {
    const fHours = Math.floor(minutes / 60);
    let fMinutes = Math.floor(minutes - fHours * 60);
    if (fMinutes < 1) {
      fMinutes = 1; // 0 => 1
    }
    return fHours < 1
      ? fMinutes + " " + suffix // < 59 => 59 mins.
      : fHours + ":" + ("00" + fMinutes).slice(-2) + "小时"; // = 61 => 1:01
  }
  const minutes = Math.round(page.wordCount / 275);
  return getFormatTime(minutes, "分钟");
});
</script>

<template>
  <div flex="~ col" gap-3>
    <div flex="~ wrap" gap-3 justify-center>
      <div v-if="page.top > 0" flex gap-1 items-center>
        <i class="i-fa6-solid:thumbtack"></i>
        <span>置顶</span>
      </div>
      <div flex gap-1 items-center>
        <i class="i-fa6-regular:calendar"></i>
        <span>发表于</span>
        <span pl-1>{{ date }}</span>
      </div>
      <div flex gap-1 items-center>
        <i class="i-fa6-regular:calendar-check"></i>
        <span>更新于</span>
        <span pl-1>{{ updated }}</span>
      </div>
      <div flex gap-1 items-center>
        <i class="i-fa6-regular:folder"></i>
        <span>分类于</span>
        <a
          pl-1
          :href="`/category/${item}`"
          v-for="item of page.categories"
          :key="item"
        >
          {{ item }}
        </a>
      </div>
    </div>
    <div flex="~ wrap" gap-3 justify-center>
      <div flex gap-1 items-center>
        <i class="i-fa6-regular:file-word"></i>
        <span>总字数</span>
        <span pl-1>{{ formatedWordCount }}</span>
      </div>
      <div flex gap-1 items-center>
        <i class="i-fa6-regular:clock"></i>
        <span>阅读时长 ≈</span>
        <span pl-1>{{ time }}</span>
      </div>
    </div>
  </div>
</template>

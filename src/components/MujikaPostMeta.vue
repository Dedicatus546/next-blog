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
</script>

<template>
  <div flex="~ col" gap-2>
    <div flex="~ wrap" gap-4 justify-center>
      <div>
        <span>
          <i class="i-fa6-regular:calendar" mr-1></i>
          发表于
        </span>
        <span ml-1 inline-block>{{ date }}</span>
      </div>
      <div>
        <span>
          <i class="i-fa6-regular:calendar-check" mr-1></i>
          更新于
        </span>
        <span ml-1 inline-block>{{ updated }}</span>
      </div>
      <div>
        <span>
          <i class="i-fa6-regular:folder" mr-1></i>
          分类于
        </span>
        <a
          ml-1
          inline-block
          :href="`/category/${item}`"
          v-for="item of page.categories"
          :key="item"
        >
          {{ item }}
        </a>
      </div>
    </div>
    <div flex="~ wrap" gap-4 justify-center>
      <div>
        <span>
          <i class="i-fa6-regular:file-word" mr-1></i>
          总字数
        </span>
        <span>2.4K</span>
      </div>
      <div>
        <span>
          <i class="i-fa6-regular:clock" mr-1></i>
          阅读时长 ≈
        </span>
        <span>9 分钟</span>
      </div>
    </div>
  </div>
</template>

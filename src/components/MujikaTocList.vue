<script setup lang="ts">
import { TocItem } from "@/composables/usePostTocList";

const { prefix = "" } = defineProps<{
  list: Array<TocItem>;
  prefix?: string;
}>();

const onAnchorClick = () => {};
</script>

<template>
  <ul class="mujika-toc-list" flex="~ col" gap-2>
    <li
      class="mujika-toc-list-item"
      v-for="(item, index) of list"
      :key="item.id"
    >
      <a
        class="header-anchor"
        max-w-full
        inline-block
        cursor-pointer
        truncate
        :href="item.link"
        :title="item.title"
      >
        {{ prefix + (index + 1) + "." }} {{ item.title }}
      </a>
      <MujikaTocList
        :list="item.children"
        :prefix="`${prefix}${index + 1}.`"
        v-if="item.children.length > 0"
        mt-2
        pl-3
      />
    </li>
  </ul>
</template>

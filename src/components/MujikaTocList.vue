<script setup lang="ts">
import { type TocItem } from "@/composables/usePostTocList";

const { prefix = "" } = defineProps<{
  list: Array<TocItem>;
  prefix?: string;
}>();

const onAnchorClick = (e: MouseEvent) => {
  const anchorEl = e.target as HTMLAnchorElement;
  const href = anchorEl.href;
  const url = new URL(href);
  const { hash } = url;
  history.replaceState({}, "", hash);
  const el = document.querySelector(decodeURIComponent(hash));
  if (el) {
    const rect = el.getBoundingClientRect();
    const y = window.scrollY + rect.top - 20;
    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  }
};
</script>

<template>
  <ul class="mujika-toc-list" flex="~ col" gap-2 v-if="list.length > 0">
    <li
      class="mujika-toc-list-item"
      v-for="(item, index) of list"
      :key="item.id"
    >
      <a
        class="header-anchor"
        max-w-full
        inline-block
        truncate
        :href="item.link"
        :title="item.title"
        @click.prevent="onAnchorClick"
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

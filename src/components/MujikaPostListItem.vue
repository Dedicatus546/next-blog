<script setup lang="ts">
import { type MarkdownPage } from "@/types";

import MujikaCard from "./MujikaCard.vue";
import MujikaPostMeta from "./MujikaPostMeta.vue";

defineProps<{
  post: MarkdownPage;
}>();
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-4>
      <h1 text="30px center">
        <RouterLink
          :to="post.path"
          inline-block
          break-all
          relative
          before:mx-auto
          before:h-3px
          before:w-0
          before:inline-block
          before:content-empty
          before:transition-width
          before:bottom--5px
          before:left-0
          before:right-0
          before:absolute
          before:hover:w-full
          before:bg="[var(--mygo-c-text-1)]"
        >
          <!-- before:hover:w-full
          before:hover:bg="[var(--mygo-c-text-1)]" -->
          {{ post.title }}
        </RouterLink>
      </h1>
      <MujikaPostMeta :page="post" />
      <div class="kan-doc" v-html="post.excerpt"></div>
    </div>
  </MujikaCard>
</template>

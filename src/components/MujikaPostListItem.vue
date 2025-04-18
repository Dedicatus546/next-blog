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
          break-all
          relative
          before:mx-auto
          before:h-2px
          before:w-0
          before:content-empty
          before:transition
          before:inset-x-0
          before:bottom--5px
          before:absolute
          before:hover:w-full
          before:hover:bg="[var(--mygo-c-text-1)]"
        >
          {{ post.title }}
        </RouterLink>
      </h1>
      <MujikaPostMeta :page="post" />
      <div class="kan-doc" v-html="post.excerpt"></div>
    </div>
  </MujikaCard>
</template>

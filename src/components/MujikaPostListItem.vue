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
      <RouterLink :to="post.path">
        <h2 text="34px center">{{ post.title }}</h2>
      </RouterLink>
      <MujikaPostMeta :page="post" />
      <div class="kan-doc" v-html="post.excerpt"></div>
    </div>
  </MujikaCard>
</template>

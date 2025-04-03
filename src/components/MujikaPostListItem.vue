<script setup lang="ts">
import { PostListItem } from "@/types";

import MujikaCard from "./MujikaCard.vue";
import MujikaPostMeta from "./MujikaPostMeta.vue";

defineProps<{
  post: PostListItem;
}>();
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-4>
      <a :href="post.url">
        <h2 text="34px center">{{ post.title }}</h2>
      </a>
      <MujikaPostMeta :meta="post" />
      <div class="kan-doc" v-html="post.excerpt"></div>
    </div>
  </MujikaCard>
</template>

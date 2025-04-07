<script setup lang="ts">
import type { GithubIssueComment } from "@/types";

defineProps<{
  comment: GithubIssueComment;
}>();
</script>

<template>
  <div flex gap-4 items-start>
    <img
      flex="shrink-0"
      rounded-6px
      w-60px
      aspect-ratio-square
      :src="comment.user?.avatar_url"
      :alt="`${comment.user?.login}的头像`"
    />
    <div flex="~ col grow" gap-2>
      <div>{{ comment.user?.login }}</div>
      <div class="haruhikage-doc" v-html="comment.body_html"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

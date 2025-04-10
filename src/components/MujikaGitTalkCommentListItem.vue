<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

import type { GithubIssueComment } from "@/types";

function formatRelativeTime(dateStr: string) {
  return formatDistanceToNow(dateStr, {
    addSuffix: true,
    locale: zhCN,
  });
}

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
      :src="comment.user.avatar_url"
      :alt="`${comment.user.login}的头像`"
    />
    <div flex="~ col grow" gap-2>
      <div>
        <div>{{ comment.user.login }}</div>
        <div text-sm text="[var(--mygo-c-text-2)]">
          {{ formatRelativeTime(comment.created_at) }}
        </div>
      </div>
      <div class="haruhikage-doc" v-html="comment.body_html"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

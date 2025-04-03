<script setup lang="ts">
import MujikaCard from "@/components/MujikaCard.vue";
import MujikaPagination from "@/components/MujikaPagination.vue";
import MujikaVerticalDivider from "@/components/MujikaVerticalDivider.vue";

import MujikaGitTalkCommentListItem from "./MujikaGitTalkCommentListItem.vue";
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-4>
      <div flex gap-4 items-start>
        <img
          w-60px
          aspect-ratio-square
          flex="shrink-0"
          block
          src="https://avatars.githubusercontent.com/u/48575405?v=4"
          alt="Dedicatus545的头像"
        />
        <div flex="~ col grow" gap-4>
          <textarea
            placeholder="万水千山总是情，留下评论行不行"
            class="mujika-gittalk-textarea"
            p-4
            outline-0
          />
          <div flex items-start justify-between>
            <a
              target="_blank"
              href="https://guides.github.com/features/mastering-markdown/"
            >
              支持 Markdown 语法
            </a>
            <button class="mujika-gittalk-send-button" cursor-pointer>
              发送
            </button>
          </div>
        </div>
      </div>
      <MujikaVerticalDivider />
      <div flex="~ col" my-4 gap-8>
        <MujikaGitTalkCommentListItem v-for="n of 4" :key="n" />
      </div>
      <MujikaPagination />
    </div>
  </MujikaCard>
</template>

<style lang="scss" scoped>
.mujika-gittalk-textarea {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.mujika-gittalk-send-button {
  border: 1px solid #e8e8e8;
  padding: 4px 16px;
  border-radius: 6px;
}
</style>

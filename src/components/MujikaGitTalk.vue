<script setup lang="ts">
import MujikaCard from "@/components/MujikaCard.vue";
import MujikaPagination from "@/components/MujikaPagination.vue";
import MujikaVerticalDivider from "@/components/MujikaVerticalDivider.vue";
import { useMujikaGitTalkStore } from "@/stores/useMujikaGitTalkStore";

import MujikaGitTalkCommentListItem from "./MujikaGitTalkCommentListItem.vue";

const mujikaGitTalkStore = useMujikaGitTalkStore();
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex gap-4 items-start>
      <img
        v-if="mujikaGitTalkStore.isLogin"
        rounded-6px
        w-60px
        aspect-ratio-square
        flex="shrink-0"
        src="https://avatars.githubusercontent.com/u/48575405?v=4"
        alt="Dedicatus545的头像"
      />
      <div
        flex="~ shrink-0"
        bg="[#fafafa]"
        rounded-6px
        w-60px
        aspect-ratio-square
        items-center
        justify-center
        v-else
      >
        <i text-40px text="[#999]" class="i-fa6-regular:user"></i>
      </div>
      <div flex="~ col grow" gap-4>
        <textarea
          :disabled="!mujikaGitTalkStore.isLogin"
          v-model="mujikaGitTalkStore.state.comment"
          placeholder="万水千山总是情，留下评论行不行"
          class="mujika-git-talk-textarea"
          un-disabled:cursor-not-allowed
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
          <button
            v-if="mujikaGitTalkStore.isLogin"
            class="mujika-git-talk-button"
            cursor-pointer
          >
            发送
          </button>
          <button v-else class="mujika-git-talk-button" cursor-pointer>
            点击登录
          </button>
        </div>
      </div>
    </div>
  </MujikaCard>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-8>
      <MujikaGitTalkCommentListItem v-for="n of 4" :key="n" />
    </div>
    <div mt-8 flex justify-center>
      <button class="mujika-git-talk-button" cursor-pointer>加载更多</button>
    </div>
  </MujikaCard>
</template>

<style lang="scss" scoped>
.mujika-git-talk-textarea {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.mujika-git-talk-button {
  border: 1px solid #e8e8e8;
  padding: 4px 16px;
  border-radius: 6px;
}
</style>

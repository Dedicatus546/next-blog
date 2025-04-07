<script setup lang="ts">
import {
  getAccessTokenApi,
  getIssueByLabelApi,
  getUserInfoApi,
  setOctokitAuth,
} from "@/apis/githubApi";
import MujikaCard from "@/components/MujikaCard.vue";
import { usePost } from "@/composables/usePost";
import { useMujikaGitTalkStore } from "@/stores/useMujikaGitTalkStore";
import type { GithubIssue } from "@/types";

import MujikaGitTalkCommentListItem from "./MujikaGitTalkCommentListItem.vue";

const route = useRoute();
const post = usePost();
const mujikaGitTalkStore = useMujikaGitTalkStore();
const issue = ref<GithubIssue | null>(null);

const toLogin = () => {
  mujikaGitTalkStore.toLoginAction();
};

const getCommentList = async () => {
  const data = await getIssueByLabelApi(post.value.key);
  if (data) {
    mujikaGitTalkStore.state.pagination.total = data.commentCount;
  }
};

const onPageChange = (page: number) => {
  mujikaGitTalkStore.state.pagination.page = page;
};

onMounted(async () => {
  if (route.query.code) {
    const code = route.query.code as string;
    // 拿 accessToken
    const res = await getAccessTokenApi({
      code,
      clientId: mujikaGitTalkStore.options.clientId,
      clientSecret: mujikaGitTalkStore.options.clientSecret,
    });
    const { access_token, scope, token_type } = res;
    mujikaGitTalkStore.state.accessToken = access_token;
    mujikaGitTalkStore.state.scope = scope;
    mujikaGitTalkStore.state.tokenType = token_type;
  }

  if (mujikaGitTalkStore.state.accessToken) {
    const res = await getUserInfoApi(mujikaGitTalkStore.state.accessToken);
    setOctokitAuth(mujikaGitTalkStore.state.accessToken);
    mujikaGitTalkStore.state.user = res;
  }

  getCommentList();
});
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
          <button
            v-else
            class="mujika-git-talk-button"
            cursor-pointer
            @click="toLogin"
          >
            点击登录
          </button>
        </div>
      </div>
    </div>
  </MujikaCard>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-8>
      <MujikaGitTalkCommentListItem
        v-for="comment of mujikaGitTalkStore.state.commentList"
        :key="comment.id"
        :comment="comment"
      />
    </div>
    <div mt-8>
      <MujikaPagination
        :page="mujikaGitTalkStore.state.pagination.page"
        :page-size="mujikaGitTalkStore.state.pagination.pageSize"
        :total="mujikaGitTalkStore.state.pagination.total"
        @page-change="onPageChange"
      />
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

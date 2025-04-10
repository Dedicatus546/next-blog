<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useRouteQuery } from "@vueuse/router";

import {
  createIssueCommentApi,
  getAccessTokenApi,
  getIssueByLabelApi,
  getUserInfoApi,
  loadIssueCommentListApi,
  setOctokitAuth,
} from "@/apis/githubApi";
import MujikaCard from "@/components/MujikaCard.vue";
import { usePost } from "@/composables/usePost";
import { useMujikaGitTalkStore } from "@/stores/useMujikaGitTalkStore";
import type { GithubIssue, GithubIssueComment } from "@/types";

import MujikaGitTalkCommentListItem from "./MujikaGitTalkCommentListItem.vue";

const githubCode = useRouteQuery("code") as Ref<string | undefined>;
const post = usePost();
const mujikaGitTalkStore = useMujikaGitTalkStore();

const state = reactive({
  loading: false,
  issue: null as GithubIssue | null,
  comment: "",
  commentList: [] as Array<GithubIssueComment>,
  pagination: {
    page: 1,
    cursor: null as string | null,
    pageSize: 10,
    total: 0,
  },
});

const toLogin = () => {
  mujikaGitTalkStore.toLoginAction();
};

const getCommentList = async () => {
  state.loading = true;
  if (!state.issue) {
    state.issue = await getIssueByLabelApi(post.value.key);
  }
  const { list, pageInfo } = await loadIssueCommentListApi({
    issueNumber: state.issue!.number,
    cursor: state.pagination.cursor!,
    pageSize: state.pagination.pageSize,
  });
  state.pagination.total = state.issue!.commentCount;
  state.commentList.push(...list);
  state.pagination.cursor = pageInfo.cursor;
  state.loading = false;
};

const loadMore = ([entry]: IntersectionObserverEntry[]) => {
  if (entry.isIntersecting && !state.loading) {
    getCommentList();
  }
};

const submit = async () => {
  if (!state.comment) {
    return;
  }
  const comment = await createIssueCommentApi({
    issueNodeId: state.issue!.nodeId,
    content: state.comment,
  });
  state.comment = "";
  state.commentList.unshift(comment);
};

onMounted(async () => {
  if (githubCode.value) {
    // 拿 accessToken
    const res = await getAccessTokenApi({
      code: githubCode.value,
      clientId: mujikaGitTalkStore.options.clientId,
      clientSecret: mujikaGitTalkStore.options.clientSecret,
    });
    const { access_token, scope, token_type } = res;
    mujikaGitTalkStore.state.accessToken = access_token;
    mujikaGitTalkStore.state.scope = scope;
    mujikaGitTalkStore.state.tokenType = token_type;
    githubCode.value = undefined;
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
        bg="[var(--mygo-c-bg-alt)]"
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
          v-model="state.comment"
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
            @click="submit"
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
  <MujikaCard :padding-level="2" v-if="state.commentList.length > 0">
    <div flex="~ col" gap-8>
      <MujikaGitTalkCommentListItem
        v-for="comment of state.commentList"
        :key="comment.id"
        :comment="comment"
      />
    </div>
    <div
      v-if="state.commentList.length < state.pagination.total"
      v-intersection-observer="[
        loadMore,
        {
          rootMargin: '0px 0px 90px 0px',
          threshold: [1],
        },
      ]"
    >
      <!-- <MujikaPagination
        :page="mujikaGitTalkStore.state.pagination.page"
        :page-size="mujikaGitTalkStore.state.pagination.pageSize"
        :total="mujikaGitTalkStore.state.pagination.total"
        @page-change="onPageChange"
      /> -->
    </div>
  </MujikaCard>
</template>

<style lang="scss" scoped>
.mujika-git-talk-textarea {
  border: 1px solid var(--mygo-c-border);
  border-radius: var(--mygo-border-radius-base);
}

.mujika-git-talk-button {
  border: 1px solid var(--mygo-c-border);
  padding: 4px 16px;
  border-radius: var(--mygo-border-radius-base);
}
</style>

<script setup lang="ts">
import { vIntersectionObserver } from "@vueuse/components";
import { useRouteQuery } from "@vueuse/router";

import {
  createIssueApi,
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
  submitLoading: false,
  createLoading: false,
  issue: undefined as GithubIssue | undefined | null,
  comment: "",
  commentList: [] as Array<GithubIssueComment>,
  pagination: {
    page: 1,
    cursor: undefined as string | undefined,
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
    state.issue = await getIssueByLabelApi(String(post.value.key));
  }
  if (state.issue) {
    const { list, pageInfo } = await loadIssueCommentListApi({
      issueNumber: state.issue!.number,
      cursor: state.pagination.cursor!,
      pageSize: state.pagination.pageSize,
    });
    state.pagination.total = state.issue!.commentCount;
    state.commentList.push(...list);
    state.pagination.cursor = pageInfo.cursor;
  }
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
  state.submitLoading = true;
  const comment = await createIssueCommentApi({
    issueNodeId: state.issue!.id,
    content: state.comment,
  });
  state.comment = "";
  state.commentList.unshift(comment);
  state.pagination.total++;
  state.submitLoading = false;
};

const createIssue = async () => {
  state.createLoading = true;
  state.issue = await createIssueApi({
    title: post.value.title,
    body: `[${post.value.title}](https://next.prohibitorum.top/${post.value.hash})`,
    labelName: post.value.key + "",
  });
  state.createLoading = false;
};

onMounted(async () => {
  if (githubCode.value) {
    // 从 url query 拿 accessToken
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
    setOctokitAuth(mujikaGitTalkStore.state.accessToken);
  }

  if (
    mujikaGitTalkStore.state.user === null &&
    mujikaGitTalkStore.state.accessToken
  ) {
    const res = await getUserInfoApi();
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
        w-45px
        aspect-ratio-square
        lg:w-60px
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
      <div flex="~ col grow" gap-2 lg:gap-4>
        <textarea
          :disabled="!mujikaGitTalkStore.isLogin"
          v-model="state.comment"
          placeholder="万水千山总是情，留下评论行不行"
          class="mujika-git-talk-textarea"
          un-disabled:cursor-not-allowed
          p-2
          outline-0
          lg:p-4
        />
        <div flex items-start>
          <a
            target="_blank"
            href="https://guides.github.com/features/mastering-markdown/"
          >
            支持 Markdown 语法
          </a>
          <div ml-auto></div>
          <MujikaButton
            mr-2
            lg:mr-4
            v-if="mujikaGitTalkStore.isAuthor && state.issue === null"
            :loading="state.createLoading"
            @click="createIssue"
          >
            创建 issue
          </MujikaButton>
          <MujikaButton
            v-if="mujikaGitTalkStore.isLogin"
            :loading="state.submitLoading"
            @click="submit"
          >
            发送
          </MujikaButton>
          <MujikaButton v-else @click="toLogin">点击登录</MujikaButton>
        </div>
      </div>
    </div>
  </MujikaCard>
  <MujikaCard :padding-level="2">
    <div flex items-center justify-center v-if="state.commentList.length === 0">
      哦呢该，如果没有评论的话，瓦达西...
    </div>
    <div flex="~ col" gap-8 v-else>
      <MujikaGitTalkCommentListItem
        v-for="comment of state.commentList"
        :key="comment.id"
        :comment="comment"
      />
    </div>
    <div py-4 flex items-center justify-center lg:py-8 v-if="state.loading">
      <i class="i-ri:loader-2-fill" text-xl animate-spin lg:text-2xl></i>
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
    ></div>
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

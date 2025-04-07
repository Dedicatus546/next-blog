import type { GithubIssue, GithubIssueComment, GithubUser } from "@/types";

export const useMujikaGitTalkStore = defineStore(
  "mujika-git-talk-store",
  () => {
    const state = reactive({
      code: "",

      accessToken: "",
      scope: "",
      tokenType: "",

      user: null as GithubUser | null,

      comment: "",
      commentList: [] as Array<GithubIssueComment>,
      postKeyToIssueMap: new Map<number, GithubIssue>(),
      pagination: {
        page: 1,
        cursor: undefined,
        pageSize: 10,
        total: 0,
      },
    });

    const options = readonly({
      githubId: "Dedicatus546",
      repo: "gitalk",
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
      adminUser: "Dedicatus546",
    });

    const isLogin = computed(() => !!state.accessToken);

    const toLoginAction = () => {
      const { clientId } = options;
      const redirectUri = encodeURI(location.href);
      const scope = "public_repo";
      location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    };

    return {
      state,
      options,
      isLogin,
      toLoginAction,
    };
  },
  {
    persist: {
      pick: ["state.accessToken", "state.scope", "state.tokenType"],
    },
  },
);

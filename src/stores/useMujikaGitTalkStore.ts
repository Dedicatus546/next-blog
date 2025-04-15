import type { GithubUser } from "@/types";

export const useMujikaGitTalkStore = defineStore(
  "mujika-git-talk-store",
  () => {
    const state = reactive({
      accessToken: "",
      scope: "",
      tokenType: "",

      user: null as GithubUser | null,
    });

    const options = readonly({
      githubId: "Dedicatus546",
      repo: "gitalk",
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
      adminUser: "Dedicatus546",
    });

    const isLogin = computed(() => !!(state.accessToken && state.user));
    const isAuthor = computed(
      () => isLogin.value && state.user?.login === import.meta.env.GITHUB_OWNER,
    );

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
      isAuthor,
      toLoginAction,
    };
  },
  {
    persist: {
      pick: [
        "state.accessToken",
        "state.scope",
        "state.tokenType",
        "state.user",
      ],
    },
  },
);

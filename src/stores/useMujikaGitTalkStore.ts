export const useMujikaGitTalkStore = defineStore(
  "mujika-git-talk-store",
  () => {
    const state = reactive({
      accessToken: "",
      comment: "",
      commentList: [],
      pageSize: 10,
    });

    const isLogin = computed(() => !!state.accessToken);

    return {
      state,
      isLogin,
    };
  },
  {
    persist: {
      pick: ["state.accessToken"],
    },
  },
);

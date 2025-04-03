// export const useStore = defineStore("store", () => {
//   const state = reactive({
//     list,
//     pagination: {
//       page: 1,
//       pageSize: Math.min(10, list.length),
//       total: list.length,
//     },
//   });

//   const categoryList = computed(() => {
//     const set = new Set<string>();
//     state.list.forEach((item) => {
//       item.categories.forEach((category) => set.add(category));
//     });
//     return Array.from(set);
//   });

//   const tagList = computed(() => {
//     const set = new Set<string>();
//     state.list.forEach((item) => {
//       item.tags.forEach((tag) => set.add(tag));
//     });
//     return Array.from(set);
//   });

//   const renderList = computed(() => {
//     const { page, pageSize } = state.pagination;
//     const start = (page - 1) * pageSize;
//     const end = start + pageSize;
//     return state.list.slice(start, end);
//   });

//   const onPageChange = (page: number) => {
//     state.pagination.page = page;
//   };

//   return {
//     state,
//     renderList,
//     categoryList,
//     tagList,
//     onPageChange,
//   };
// });

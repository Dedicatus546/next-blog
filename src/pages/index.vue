<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const router = useRouter();

const store = useRootStore();

const { state } = store;
const { renderList } = storeToRefs(store);
const postListContainerRef = useTemplateRef("postListContainerRef");

const onPageChange = (page: number) => {
  router.push("/pages/" + page);
};

onMounted(() => {
  // 让摘要的 anchor 不要触发
  useEventListener(postListContainerRef, "click", (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");
    if (
      !e.defaultPrevented &&
      link &&
      e.button === 0 &&
      link.target !== "_blank" &&
      link.rel !== "external" &&
      !link.download &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
    }
  });
});
</script>

<template>
  <div flex gap-2 items-start>
    <MujikaAuthorAside un-hidden lg:block />
    <div flex="~ col grow" gap-2>
      <div flex="~ col" gap-2 ref="postListContainerRef">
        <MujikaPostListItem
          :post="item"
          v-for="item of renderList"
          :key="item.hash"
        />
      </div>
      <MujikaCard>
        <MujikaPagination
          :page="state.pagination.page"
          :page-size="state.pagination.pageSize"
          :total="state.pagination.total"
          @page-change="onPageChange"
        />
      </MujikaCard>
    </div>
    <!-- <MujikaIndexAside /> -->
  </div>
</template>

<style scoped lang="scss"></style>

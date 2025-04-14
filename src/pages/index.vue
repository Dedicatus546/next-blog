<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const router = useRouter();

const store = useRootStore();

const { state } = store;
const { renderList } = storeToRefs(store);

const onPageChange = (page: number) => {
  router.push("/pages/" + page);
};
</script>

<template>
  <div flex gap-2 items-start>
    <MujikaAuthorAside un-hidden lg:block />
    <div flex="~ col grow" gap-2>
      <MujikaPostListItem
        :post="item"
        v-for="item of renderList"
        :key="item.hash"
      />
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

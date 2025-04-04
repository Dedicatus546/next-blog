<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const store = useRootStore();

const { onPageChange, state } = store;
const { renderList } = storeToRefs(store);
</script>

<template>
  <div flex="~ col" gap-2>
    <MujikaPostListItem
      :post="item"
      v-for="item of renderList"
      :key="item.key"
    />
    <MujikaPagination
      :page="state.pagination.page"
      :page-size="state.pagination.pageSize"
      :total="state.pagination.total"
      @page-change="onPageChange"
    />
  </div>
</template>

<style scoped lang="scss"></style>

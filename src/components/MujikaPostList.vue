<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

import MujikaPagination from "./MujikaPagination.vue";
import MujikaPostListItem from "./MujikaPostListItem.vue";

const store = useRootStore();

const { onPageChange, state } = store;
const { renderList } = storeToRefs(store);
</script>

<template>
  <MujikaPostListItem
    :post="item"
    v-for="item of renderList"
    :key="item.hash"
  />
  <MujikaPagination
    :page="state.pagination.page"
    :page-size="state.pagination.pageSize"
    :total="state.pagination.total"
    @page-change="onPageChange"
  />
</template>

<style scoped lang="scss"></style>

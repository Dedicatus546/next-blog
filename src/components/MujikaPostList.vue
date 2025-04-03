<script setup lang="ts">
import { useStore } from "@/stores/useStore";

import MujikaPagination from "./MujikaPagination.vue";
import MujikaPostListItem from "./MujikaPostListItem.vue";

const store = useStore();

const { onPageChange, state } = store;
const { renderList } = storeToRefs(store);
</script>

<template>
  <MujikaPostListItem :post="item" v-for="item of renderList" :key="item.id" />
  <MujikaPagination
    :page="state.pagination.page"
    :page-size="state.pagination.pageSize"
    :total="state.pagination.total"
    @page-change="onPageChange"
  />
</template>

<style scoped lang="scss"></style>

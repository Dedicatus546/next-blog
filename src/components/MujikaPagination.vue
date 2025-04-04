<script setup lang="ts">
const {
  total = 0,
  page = 1,
  pageSize = 10,
} = defineProps<{
  page?: number;
  pageSize?: number;
  total?: number;
}>();

const emits = defineEmits<{
  (e: "pageChange", page: number): void;
  (e: "update:page", page: number): void;
}>();

const pageCount = computed(() => {
  return pageSize === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
});

const pageChange = (page: number) => {
  if (page < 1 || page > pageCount.value) {
    return;
  }
  emits("pageChange", page);
  emits("update:page", page);
};
</script>

<template>
  <div flex gap-4 justify-center class="mujika-pagination">
    <button
      :disabled="page <= 1"
      class="mujika-pagination-button"
      @click="pageChange(page - 1)"
    >
      上一页
    </button>
    <button
      class="mujika-pagination-button"
      :class="{ active: page === item }"
      v-for="item of pageCount"
      :key="item"
      @click="pageChange(item)"
    >
      {{ item }}
    </button>
    <button
      :disabled="page >= pageCount"
      class="mujika-pagination-button"
      @click="pageChange(page + 1)"
    >
      下一页
    </button>
  </div>
</template>

<style lang="scss" scoped>
.mujika-pagination {
  .mujika-pagination-button {
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover,
    &.active {
      background-color: #fff;
    }

    &.active {
      border: 1px solid #e8e8e8;
    }
  }
}
</style>

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
const maxPageCount = 5;

const emits = defineEmits<{
  (e: "pageChange", page: number): void;
  (e: "update:page", page: number): void;
}>();

const pageCount = computed(() => {
  return pageSize === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
});

const pageCountRenderList = computed(() => {
  let res: Array<number> | undefined = undefined;
  if (pageCount.value >= maxPageCount) {
    res = [];
    // left 5
    // right 4
    const left = Math.ceil((maxPageCount - 2) / 2) + 1;
    const right = maxPageCount - left;
    if (page <= left) {
      for (let i = 1; i <= maxPageCount - 1; i++) {
        res.push(i);
      }
      res.push(-1, pageCount.value);
    } else if (page >= pageCount.value - right) {
      res.push(1, -1);
      for (
        let i = pageCount.value - maxPageCount + 2;
        i <= pageCount.value;
        i++
      ) {
        res.push(i);
      }
    } else {
      res.push(1, -1);
      for (let i = page - left + 2; i <= page + right - 1; i++) {
        res.push(i);
      }
      res.push(-1, pageCount.value);
    }
  } else {
    res = Array.from({ length: pageCount.value }).map((_, index) => index + 1);
  }
  return res;
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
  <div flex gap-2 justify-center lg:gap-4 class="mujika-pagination">
    <button
      :disabled="page <= 1"
      class="mujika-pagination-button"
      @click="pageChange(page - 1)"
    >
      <i class="i-mi:caret-left"></i>
    </button>
    <template v-for="item of pageCountRenderList" :key="item">
      <button
        v-if="item > 0"
        class="mujika-pagination-button"
        :class="{ active: page === item }"
        @click="pageChange(item)"
      >
        {{ item }}
      </button>
      <div v-else>...</div>
    </template>
    <button
      :disabled="page >= pageCount"
      class="mujika-pagination-button"
      @click="pageChange(page + 1)"
    >
      <i class="i-mi:caret-right"></i>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.mujika-pagination {
  .mujika-pagination-button {
    --uno: "px-2 lg:px-3 lg:py-1";
    border-radius: var(--mygo-border-radius-base);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:disabled {
      cursor: not-allowed;
      color: var(--mygo-c-text-2);
    }

    &:not([disabled]):hover,
    &.active {
      background-color: var(--mygo-c-bg-alt);
    }

    &.active {
      border: 1px solid var(--mygo-c-border);
    }
  }
}
</style>

<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <div flex gap-4 items-center>
    <div flex="~ col" gap-1 items-center>
      <div>文章</div>
      <div>{{ rootStore.state.list.length }}</div>
    </div>
    <div flex="~ col" gap-1 items-center>
      <div>分类</div>
      <div>{{ rootStore.categoryList.length }}</div>
    </div>
    <div flex="~ col" gap-1 items-center>
      <div>标签</div>
      <div>{{ rootStore.tagList.length }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

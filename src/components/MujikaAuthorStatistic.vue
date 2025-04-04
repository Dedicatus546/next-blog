<script setup lang="ts">
import { useStore } from "@/stores/useRootStore";

const store = useStore();
</script>

<template>
  <div flex gap-2 items-center>
    <div flex flex-col items-center>
      <div>文章</div>
      <div>{{ store.state.list.length }}</div>
    </div>
    <div flex flex-col items-center>
      <div>分类</div>
      <div>{{ store.categoryList.length }}</div>
    </div>
    <div flex flex-col items-center>
      <div>标签</div>
      <div>{{ store.tagList.length }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>

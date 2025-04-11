<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <div flex="~ wrap">
    <div v-for="tag of rootStore.tagList" :key="tag">#{{ tag }}</div>
  </div>
</template>

<style scoped lang="scss"></style>

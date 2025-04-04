<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <div flex="~ wrap">
    <div v-for="item of rootStore.tagList" :key="item">{{ item }}</div>
  </div>
</template>

<style lang="scss" scoped></style>

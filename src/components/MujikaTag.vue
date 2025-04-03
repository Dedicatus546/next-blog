<script setup lang="ts">
import { useStore } from "@/stores/useStore";

const store = useStore();
</script>

<template>
  <div flex="~ wrap">
    <div v-for="tag of store.tagList" :key="tag">#{{ tag }}</div>
  </div>
</template>

<style scoped lang="scss"></style>

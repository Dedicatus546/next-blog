<script setup lang="ts">
import MujikaToc from "./MujikaToc.vue";
</script>

<template>
  <aside
    class="mujika-aside"
    flex="~ col shrink-0"
    w="280px"
    gap-4
    self-start
    top-4
    sticky
    max-h="[calc(100vh-var(--spacing)*8)]"
  >
    <MujikaToc h-full />
  </aside>
</template>

<style lang="scss" scoped></style>

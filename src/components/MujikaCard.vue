<script setup lang="ts">
const {
  hasPadding = true,
  paddingLevel = 1,
  hasHover = true,
  hasBorder = true,
} = defineProps<{
  hasHover?: boolean;
  hasPadding?: boolean;
  hasBorder?: boolean;
  paddingLevel?: 1 | 2 | 3 | 4;
}>();
</script>

<template>
  <div
    class="mujika-card"
    :class="{
      'mujika-card--hover': hasHover,
      'mujika-card--border ': hasBorder,
    }"
    w-full
    overflow-auto
  >
    <div
      v-if="hasPadding"
      :class="{
        'p-2 lg:p-4': paddingLevel === 1,
        'p-4 lg:p-8': paddingLevel === 2,
        'p-6 lg:p-12': paddingLevel === 3,
        'p-8 lg:p-16': paddingLevel === 4,
      }"
    >
      <slot></slot>
    </div>
    <template v-else>
      <slot></slot>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mujika-card {
  border-radius: var(--mygo-border-radius-base);
  background-color: var(--mygo-c-bg);
  transition: box-shadow 0.3s ease;

  &.mujika-card--border {
    border: 1px solid var(--mygo-c-border);
  }

  &.mujika-card--hover:hover {
    box-shadow: var(--mygo-shadow-2);
  }
}
</style>

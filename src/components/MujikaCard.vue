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
      :class="{
        'p-0': !hasPadding,
        'p-4': hasPadding && paddingLevel === 1,
        'p-8': hasPadding && paddingLevel === 2,
        'p-12': hasPadding && paddingLevel === 3,
        'p-16': hasPadding && paddingLevel === 4,
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mujika-card {
  border-radius: 6px;
  background-color: var(--mygo-c-bg);
  transition: box-shadow 0.3s ease;

  &.mujika-card--border {
    border: 1px solid #e8e8e8;
  }

  &.mujika-card--hover:hover {
    box-shadow: var(--mygo-shadow-2);
  }
}
</style>

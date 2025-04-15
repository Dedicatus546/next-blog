<script setup lang="ts">
const { loading = false, disabled = false } = defineProps<{
  loading?: boolean;
  disabled?: boolean;
}>();

const emits = defineEmits<{
  click: [];
}>();

const onClick = () => {
  if (loading || disabled) {
    return;
  }
  emits("click");
};
</script>

<template>
  <button
    class="mujika-button"
    :class="{
      'mujika-button--loading': loading,
    }"
    :disabled="loading || disabled"
    @click="onClick"
  >
    <i class="i-ri:loader-2-fill" animate-spin v-if="loading"></i>
    <slot name="icon" v-else></slot>
    <slot></slot>
  </button>
</template>

<style scoped lang="scss">
.mujika-button {
  --uno: "px-2 py-.5 lg:px-3 lg:py-1";
  border: 1px solid var(--mygo-c-border);
  border-radius: var(--mygo-border-radius-base);
  transition: background-color 0.2s;

  &:disabled {
    cursor: not-allowed;
    color: var(--mygo-c-text-2);
  }

  &:not([disabled]):hover {
    background-color: var(--mygo-c-bg-alt);
  }

  &.mujika-button--loading {
    opacity: 0.8;
  }
}
</style>

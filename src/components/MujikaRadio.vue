<script setup lang="ts">
import { RadioInjectKey } from "@/constants/radio";
import type { RaidoModelValue } from "@/types/radio";

const modelValue = defineModel<RaidoModelValue>("modelValue");

provide(RadioInjectKey, {
  getModelValue: () => modelValue.value,
  onChange(_modelValue) {
    modelValue.value = _modelValue;
  },
});
</script>

<template>
  <div p-1 flex gap-1 rounded="6px" bg="[var(--mygo-c-bg-alt)]">
    <slot></slot>
  </div>
</template>

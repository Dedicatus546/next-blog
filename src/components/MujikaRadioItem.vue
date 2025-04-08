<script setup lang="ts">
import { RadioInjectKey } from "@/constants/radio";

const props = defineProps<{
  label?: string;
  value: string | number;
}>();

const { getModelValue, onChange } = inject(RadioInjectKey)!;

const onClick = () => {
  if (getModelValue() === props.value) {
    return;
  }
  onChange(props.value);
};
</script>

<template>
  <div
    leading="[1]"
    px-2
    py-1
    cursor-pointer
    rounded="6px"
    :class="{
      'bg-[var(--mygo-c-bg)]': getModelValue() === value,
    }"
    @click="onClick"
  >
    <slot>
      {{ label }}
    </slot>
  </div>
</template>

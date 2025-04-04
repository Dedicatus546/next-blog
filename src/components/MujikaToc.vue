<script setup lang="ts">
import { usePostTocList } from "@/composables/usePostTocList";

import MujikaCard from "./MujikaCard.vue";

const { tocList } = usePostTocList();
</script>

<template>
  <MujikaCard flex="~ col" gap-4 :has-padding="false">
    <div p="4 b-0" flex-shrink-0>文章目录</div>
    <div p="4 t-0" flex-grow min-h-0 overflow-y-auto>
      <MujikaTocList :list="tocList" />
    </div>
  </MujikaCard>
</template>

<style scoped lang="scss"></style>

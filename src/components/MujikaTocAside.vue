<script setup lang="ts">
import { usePostTocList } from "@/composables/usePostTocList";

import MujikaCard from "./MujikaCard.vue";

const { tocList } = usePostTocList();
</script>

<template>
  <aside
    class="mujika-aside"
    w="280px"
    flex="~ col shrink-0"
    top-2
    sticky
    max-h="[calc(100vh-var(--spacing)*4)]"
  >
    <MujikaCard flex="~ col" gap-4 :has-padding="false">
      <div p="4 b-0" flex-shrink-0>文章目录</div>
      <div p="4 t-0" flex-grow min-h-0 overflow-y-auto>
        <MujikaTocList :list="tocList" />
      </div>
    </MujikaCard>
  </aside>
</template>

<style lang="scss" scoped></style>

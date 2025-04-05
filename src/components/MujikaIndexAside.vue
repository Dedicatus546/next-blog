<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <aside
    class="mujika-aside"
    w="280px"
    flex="~ col shrink-0"
    gap-2
    top-2
    sticky
    max-h="[calc(100vh-var(--spacing)*4)]"
  >
    <MujikaCard :has-padding="false">
      <div p="4 b-0" flex="shrink-0">分类</div>
      <div p="4 t-0" mt-4 flex="~ wrap" gap-2>
        <div v-for="item of rootStore.categoryList" :key="item">
          {{ item }} 3
        </div>
      </div>
    </MujikaCard>
    <MujikaCard>2</MujikaCard>
    <MujikaCard>3</MujikaCard>
  </aside>
</template>

<style lang="sass" scoped></style>

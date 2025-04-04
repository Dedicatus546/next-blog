<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <div grid="~ cols-1" lg:grid="cols-2" un-2xl:grid="cols-3" gap-2>
    <MujikaCard v-for="item of rootStore.archiveList" :key="item.month">
      <h1 text-xl mb-2>{{ item.month }}</h1>
      <ul flex="~ col" gap-1>
        <li v-for="subItem of item.list" :key="subItem.hash">
          <RouterLink :to="subItem.path">{{ subItem.title }}</RouterLink>
        </li>
      </ul>
    </MujikaCard>
  </div>
</template>

<style lang="scss" scoped></style>

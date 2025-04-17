<script setup lang="ts">
import { useRootStore } from "@/stores/useRootStore";

const rootStore = useRootStore();
</script>

<template>
  <div grid="~ cols-1" lg:grid="cols-2" un-2xl:grid="cols-3" gap-2>
    <MujikaCard v-for="item of rootStore.archiveList" :key="item.month">
      <div class="kan-doc">
        <h1 mt="0!">{{ item.month }}</h1>
      </div>
      <ul flex="~ col" pl-4 list-disc gap-2 lg:gap-4>
        <li v-for="subItem of item.list" :key="subItem.hash" truncate>
          <RouterLink :to="subItem.path" :title="subItem.title">
            {{ subItem.title }}
          </RouterLink>
        </li>
      </ul>
    </MujikaCard>
  </div>
</template>

<style lang="scss" scoped></style>

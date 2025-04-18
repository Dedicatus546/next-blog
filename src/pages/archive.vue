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
      <div class="kan-doc">
        <ul mt="0!">
          <li v-for="subItem of item.list" :key="subItem.hash">
            <RouterLink
              :to="subItem.path"
              :title="subItem.title"
              max-w-full
              block
              truncate
            >
              {{ subItem.title }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </MujikaCard>
  </div>
</template>

<style lang="scss" scoped></style>

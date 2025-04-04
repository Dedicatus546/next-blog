<script setup lang="ts">
import MujikaFooter from "./components/MujikaFooter.vue";
import MujikaHeader from "./components/MujikaHeader.vue";
import { PageType } from "./types";
</script>

<template>
  <div class="mujika" min-h="100vh" flex="~ col" bg="#fafafa">
    <MujikaHeader />
    <main
      class="mujika-home"
      flex="grow"
      mx="auto"
      min-h="0"
      p-2
      w-full
      un-2xl:w="[calc(96rem-var(--spacing)*2)]"
    >
      <RouterView>
        <template #default="{ Component, route }">
          <MujikaPostDetail v-if="route.meta?.page.type === PageType.MD">
            <component :is="Component" />
          </MujikaPostDetail>
          <component v-else :is="Component" />
        </template>
      </RouterView>
    </main>
    <MujikaFooter />
  </div>
</template>

<style lang="scss" scoped></style>

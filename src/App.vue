<script setup lang="ts">
import MujikaFooter from "./components/MujikaFooter.vue";
import MujikaHeader from "./components/MujikaHeader.vue";
import { useFancyBox } from "./composables/useFancyBox";
import { PageType } from "./types";

const mainRef = useTemplateRef("mainRef");

useFancyBox(mainRef);
</script>

<template>
  <div class="mujika" min-h="100vh" flex="~ col" bg="[--mygo-c-bg-alt]">
    <MujikaHeader />
    <main
      class="mujika-home"
      flex="grow"
      mx="auto"
      min-h="0"
      p-2
      w-full
      un-2xl:w="[calc(96rem-var(--spacing)*2)]"
      ref="mainRef"
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

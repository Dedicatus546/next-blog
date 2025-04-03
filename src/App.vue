<script setup lang="ts">
// import MujikaAside from "./components/MujikaAside.vue";
import MujikaFooter from "./components/MujikaFooter.vue";
import MujikaHeader from "./components/MujikaHeader.vue";
</script>

<template>
  <div class="mujika" min-h="100vh" flex="~ col" bg="#fafafa">
    <MujikaHeader />
    <div
      class="mujika-home"
      mx="auto"
      min-h="0"
      my-4
      flex="~ grow"
      gap-4
      w="[calc(100vw-20px)]"
      xl:w="[calc(80rem-20px)]"
    >
      <main>
        <RouterView />
      </main>
      <!-- <MujikaAside /> -->
    </div>
    <MujikaFooter />
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { useData } from "vitepress";

import MujikaAuthorCard from "./MujikaAuthorCard.vue";
import MujikaToc from "./MujikaToc.vue";

const { frontmatter } = useData();
</script>

<template>
  <aside
    class="mujika-aside"
    flex="~ col shrink-0"
    w="280px"
    gap-4
    self-start
    top-4
    sticky
    max-h="[calc(100vh-var(--spacing)*8)]"
  >
    <MujikaToc v-if="!frontmatter.type" flex-grow />
    <MujikaAuthorCard flex-shrink-0 v-else />
  </aside>
</template>

<style lang="scss" scoped></style>

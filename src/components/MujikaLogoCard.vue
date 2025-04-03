<script setup lang="ts">
import MujikaCard from "./MujikaCard.vue";
</script>

<template>
  <MujikaCard :has-hover="false" :hasPadding="false">
    <div text="20px" bg="#333" text-white p-8 flex items-center justify-center>
      <a href="/">恋の歌</a>
    </div>
  </MujikaCard>
</template>

<style scoped lang="scss"></style>

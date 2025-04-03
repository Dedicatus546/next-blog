<script setup lang="ts"></script>

<template>
  <div flex="~ wrap">
    <div v-for="category of []" :key="category">#{{ category }}</div>
  </div>
</template>

<style scoped lang="scss"></style>

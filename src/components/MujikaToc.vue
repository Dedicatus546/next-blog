<script setup lang="ts">
import MujikaCard from "./MujikaCard.vue";
import MujikaTocList from "./MujikaTocList.vue";

const tocList: any[] = [];
</script>

<template>
  <MujikaCard flex="~ col" gap-4 :has-padding="false">
    <div p="4 b-0" flex-shrink-0>文章目录</div>
    <MujikaCard
      :has-border="false"
      :has-hover="false"
      pt-0
      flex-grow
      min-h-0
      flex="~ col"
      p="r-0"
    >
      <div pr-4 flex-grow min-h-0 overflow-y-auto>
        <MujikaTocList :list="tocList" />
      </div>
    </MujikaCard>
  </MujikaCard>
</template>

<style scoped lang="scss"></style>

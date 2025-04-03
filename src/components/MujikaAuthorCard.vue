<script setup lang="ts">
import MujikaAuthorAvatar from "./MujikaAuthorAvatar.vue";
import MujikaAuthorStatistic from "./MujikaAuthorStatistic.vue";
import MujikaCard from "./MujikaCard.vue";
</script>

<template>
  <MujikaCard>
    <div flex="~ col" gap-4 items-center>
      <MujikaAuthorAvatar />
      <div flex="~ col" gap-2 items-center>
        <div>Deidactus545</div>
        <div>Index-Librorum-Prohibitorum</div>
      </div>
      <MujikaAuthorStatistic />
    </div>
  </MujikaCard>
</template>

<style scoped lang="scss"></style>

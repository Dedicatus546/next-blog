<script setup lang="ts"></script>

<template>
  <aside
    class="mujika-aside"
    w="280px"
    top-2
    sticky
    max-h="[calc(100vh-var(--spacing)*4)]"
  >
    <MujikaCard :has-padding="false" px-4 py-8>
      <div flex="~ col" gap-4 items-center>
        <MujikaAuthorAvatar />
        <div flex="~ col" gap-2 items-center>
          <div>Deidactus545</div>
          <div text="[var(--mygo-c-text-2)]">Index-Librorum-Prohibitorum</div>
        </div>
        <MujikaAuthorStatistic />
      </div>
    </MujikaCard>
  </aside>
</template>

<style lang="sass" scoped></style>

<script setup lang="ts"></script>

<template>
  <footer
    class="mujika-footer"
    px-4
    py-6
    bg="[var(--mygo-c-bg)]"
    flex="~ col shrink-0"
    gap-2
    items-center
  >
    <div flex items-center>
      <span>Power by&nbsp;</span>
      <i class="i-logos:vue"></i>
      <span>&nbsp;+&nbsp;</span>
      <i class="i-logos:vitejs"></i>
    </div>
    <div text-center>
      <a
        target="_blank"
        href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
      >
        CC BY-NC-SA 4.0
      </a>
      2021 - PRESENT © Dedicatus545
    </div>
    <div text="[var(--mygo-c-text-2)]" text-center>
      如果我和狗一样有尾巴的话，一定会藏不住这份喜悦，而尾巴一直摇个不停吧。
    </div>
  </footer>
</template>

<style scoped lang="scss">
.mujika-footer {
  border-top: 1px solid var(--mygo-c-border);
}
</style>

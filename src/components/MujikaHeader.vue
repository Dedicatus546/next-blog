<script setup lang="ts"></script>

<template>
  <header
    class="mujika-header"
    flex="~ shrink-0"
    p-4
    bg="#fff"
    items-center
    justify-between
  >
    <a href="/" flex gap-4 items-center>
      <img w="40px" aspect-ratio-square src="/logo.svg" alt="恋の歌的logo" />
    </a>
    <div flex gap-6>
      <a href="/">
        <i class="i-mi:home"></i>
        首页
      </a>
      <a href="/archive">
        <i class="i-mi:archive"></i>
        归档
      </a>
      <a href="/category">
        <i class="i-material-symbols:category"></i>
        分类
      </a>
      <a href="/tag">
        <i class="i-mi:tag"></i>
        标签
      </a>
      <a href="/about">关于</a>
      <a href="https://github.com/Dedicatus546" target="_blank">
        <i class="i-logos:github-icon"></i>
      </a>
    </div>
  </header>
</template>

<style scoped lang="scss">
.mujika-header {
  border-bottom: 1px solid #e8e8e8;
}
</style>

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
    <RouterLink to="/" flex gap-4 items-center>
      <img w="40px" aspect-ratio-square src="/logo.svg" alt="恋の歌的logo" />
    </RouterLink>
    <div flex gap-6>
      <RouterLink to="/">
        <i class="i-mi:home"></i>
        首页
      </RouterLink>
      <RouterLink to="/archive">
        <i class="i-mi:archive"></i>
        归档
      </RouterLink>
      <RouterLink to="/category">
        <i class="i-material-symbols:category"></i>
        分类
      </RouterLink>
      <RouterLink to="/tag">
        <i class="i-mi:tag"></i>
        标签
      </RouterLink>
      <RouterLink to="/about">关于</RouterLink>
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

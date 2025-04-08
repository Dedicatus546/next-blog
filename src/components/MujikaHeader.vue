<script setup lang="ts">
const mode = ref(0);

const optionList = [
  { label: "自动", value: 0 },
  { label: "夜间", value: 1 },
  { label: "日间", value: 2 },
];
</script>

<template>
  <header
    class="mujika-header"
    flex="~ shrink-0"
    px-4
    h="70px"
    bg="#fff"
    items-center
    justify-between
  >
    <RouterLink to="/" flex gap-4 items-center>
      <img w="40px" aspect-ratio-square src="/logo.svg" alt="恋の歌的logo" />
    </RouterLink>
    <!-- <div flex gap-6>
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
    </div> -->
    <div>
      <MujikaRadio v-model:model-value="mode">
        <MujikaRadioItem :value="0" title="自动">
          <div leading-0 relative>
            <i class="i-ri:sun-line" opacity-1></i>
            <div w="1/2" h="1/2" left-0 top-0 absolute>
              <i h-full w-full class="i-ri:moon-line"></i>
            </div>
            <div w="1/2" h="1/2" bottom-0 right-0 absolute overflow-hidden>
              <i h-full w-full class="i-ri:sun-line"></i>
            </div>
          </div>
        </MujikaRadioItem>
        <MujikaRadioItem :value="1" title="日间">
          <i class="i-ri:sun-line"></i>
        </MujikaRadioItem>
        <MujikaRadioItem :value="2" title="夜间">
          <i class="i-ri:moon-line"></i>
        </MujikaRadioItem>
      </MujikaRadio>
    </div>
  </header>
</template>

<style scoped lang="scss">
.mujika-header {
  border-bottom: 1px solid #e8e8e8;
}
</style>

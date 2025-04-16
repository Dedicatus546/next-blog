<script setup lang="ts">
const mainToolList = [
  { name: "Vue", repoUrl: "https://github.com/vuejs/core" },
  {
    name: "Element-Plus",
    repoUrl: "https://github.com/element-plus/element-plus",
  },
];
const otherToolList = [
  { name: "Eslint", repoUrl: "https://github.com/eslint/eslint" },
  { name: "Prettier", repoUrl: "https://github.com/prettier/prettier" },
  { name: "husky", repoUrl: "https://github.com/typicode/husky" },
  {
    name: "lint-staged",
    repoUrl: "https://github.com/lint-staged/lint-staged",
  },
  { name: "unocss", repoUrl: "https://github.com/unocss/unocss" },
];
const repoList = [
  {
    repoName: "cors-server",
    description: "解决 gitalk 在国内由于网络问题无法使用问题",
  },
  {
    repoName: "jm-desktop",
    description: "一个第三方的 JMComic 客户端",
  },
  {
    repoName: "vuetify-message-vue3",
    description: "以 composable 方式创建 v-snackbar 组件",
  },
  {
    repoName: "hexo-tag-swiper",
    description: "在 hexo 中支持嵌入基于 Swiper 的轮播图",
  },
  {
    repoName: "hexo-robots",
    description: "在 hexo 中支持自动生成 robots.txt 文件",
  },
];
</script>

<template>
  <MujikaCard :padding-level="2">
    <div flex="~ col" gap-2 items-center lg:gap-4>
      <MujikaAuthorAvatar w-150px lg:w-200px />
      <div class="kan-doc">
        <h1 text-center mt="0!">Dedicatus545</h1>
        <h1>关于我</h1>
        <p>一个只会写后台管理系统的菜鸟切图仔，随便写写，没有特别的爱好。</p>
        <p>目前在一家<b>外包</b>公司工作，<b>外派</b>到其他公司。</p>
        <p>
          主要技术栈：
          <template v-for="(tool, index) of mainToolList" :key="tool.name">
            <template v-if="index > 0"> + </template>
            <a :href="tool.repoUrl" target="_blank" rel="noopener">
              {{ tool.name }}
            </a>
          </template>
        </p>
        <p>
          其他：
          <template v-for="tool of otherToolList" :key="tool.name">
            <a :href="tool.repoUrl" target="_blank" rel="noopener">
              {{ tool.name }}
            </a>
            +
          </template>
          ...
        </p>
      </div>
    </div>
  </MujikaCard>
  <MujikaCard mt-2 :padding-level="2">
    <div class="kan-doc">
      <h1 mt="0!">一些似乎用处不大的小东西</h1>
      <div grid="~" gap-2 grid-cols-1 lg:gap-4 lg:grid-cols-3 md:grid-cols-2>
        <MujikaCard
          :padding-level="2"
          :has-hover="false"
          v-for="repo of repoList"
          :key="repo.repoName"
        >
          <a
            :href="`github.com/Dedicatus546/${repo.repoName}`"
            target="_blank"
            rel="noopener"
          >
            <h2 mt="0!">{{ repo.repoName }}</h2>
          </a>
          <div>{{ repo.description }}</div>
        </MujikaCard>
      </div>
    </div>
  </MujikaCard>
</template>

<style lang="scss" scoped></style>

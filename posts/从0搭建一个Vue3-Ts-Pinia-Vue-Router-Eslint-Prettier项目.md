---
title: 从0搭建一个Vue3+Ts+Pinia+Vue-Router+Eslint+Prettier项目
key: 1660979365date: 2022-08-20 15:09:25
updated: 2023-02-13 18:28:44
tags:
- Vue3
- Vite
- TypeScript
- Eslint
- Prettier
- Vue-Router
- Pinia
- husky
- lint-staged
categories:
- 编程
---


# 前言

感觉许久没发帖子了，最近使用了 `Vue3 + Ts` 来写公司的一个项目

正好记录一下这个过程，方便以后没搞懂可以回过头来查看，毕竟我这记忆力，离老年痴呆应该是不远了😂

<!-- more -->

# 正文

最先开始，我们直接使用 `Vite` 脚手架创建一个 `Vue3 + Ts` 的项目

然后我们在这个项目上进行添砖加瓦

## 创建 Vue3 + Ts 项目

`Vite` 文档地址 [Scaffolding Your First Vite Project](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)

这里由于我们使用的是 `pnpm` 包管理工具，所以执行 `pnpm create vite`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201629891.avif)

输入项目名，选择 `vue` 和 `vue-ts` 即可，然后我们就成功创建了一个最简单的 `Vue3 + Ts` 的项目

然后我们进入项目执行 `pnpm i` 安装依赖

到这一步还是相当简单的，我们可以查看下项目的结构

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201805116.avif)

## 引入 Pinia 和 Vue-Router

`Pinia` 作为 `Vue3` 官方的全局状态管理库，使用上更加方便，对比 `Vuex` 来说拥有更好的类型推断，以及简单的 `Api` 导出

`Vue-Router 4` 是 `Vue3` 官方的路由库，相对于 `React` 的许许多多的路由实现，`Vue` 的选择就只有 `Vue-Router` ，毕竟是官方的，遇到问题也容易找到解决办法

安装 `Vue-Router` 很简单，直接执行 `pnpm add vue-router` 即可， 安装 `Pinia` 只需执行 `pnpm add pinia`

然后我们需要把它安装到 `Vue` 上

默认情况下的 `main.ts` 长下面这样

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201807808.avif)

这时候我们需要先修改下目录结构，增加 `router` 和 `store` 两个文件夹

并且分别在这两个文件夹下面建一个 `index.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201809932.avif)

之后我们来编写 `store` 下面的 `index.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201811983.avif)

接着我们编写 `router` 下面的 `index.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201814942.avif)

然后我们修改下 `main.ts` 的代码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201819421.avif)

然后我们可以执行 `pnpm run dev` 看一下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201821765.avif)

这时候我们发现 `Vue-Router` 报了一个警告，意思就是没有设置 `/` 对应的路由

我们可以把默认的 `HelloWorld` 组件作为路由映射出去

先修改 `App.vue` ，使用 `RouterView` 来定义一个路由入口

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201824307.avif)

然后我们添加一个路由

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201825324.avif)

这样子这个警告就会消失了，当然，这只是为了演示如何设置路由而已，实际情况下可能会比较复杂

`Vue-Router` 使用起来和在 `Vue2` 其实差不多，基本上是一模一样

这里写下 `Pinia` 的使用

对于很多的网站，我们都是要记录登录状态和当前登录用户的信息的，这个就可以用中心状态管理来做

我们新建一个 `useLoginStore.ts` （这里写的代码有点长，就不截图了...

```typescript
import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";

const useLoginStore = defineStore("LoginStore", () => {
  const state = reactive<{
    loginUser: Record<string, any> | null;
  }>({
    loginUser: null,
  });

  const isLogin = computed(() => state.loginUser !== null);

  const loginAction = async (username: string, password: string) => {
    // 这里是模拟登录
    const res = await Promise.resolve({
      username: "lwf",
      email: "xxx@qq.com",
    });
    state.loginUser = {
      username: res.username,
      email: res.email,
    };
  };

  return {
    ...toRefs(state),
    isLogin,
    loginAction,
  };
});

export default useLoginStore;
```

虽然 `Pinia` 也可以写成和 `Vuex` 一样，但是我觉得还是不够优雅，我还是更喜欢这种 `setup` 写法，没有 `this` 干扰

然后我们可以写个简答的登录页，新建一个 `Login.vue`

```html
<script setup lang="ts">
import { reactive } from "vue";
import useLoginStore from "./store/useLoginStore";

const loginStore = useLoginStore();
const model = reactive({
  username: "",
  password: "",
});

const login = () => {
  try {
    loginStore.loginAction(model.username, model.password);
  } catch (e) {
    // 处理错误
  }
};
</script>

<template>
  <div>是否登录: {{ loginStore.isLogin }}</div>
  <input type="text" v-model="model.username" />
  <br />
  <input type="text" v-model="model.password" />
  <br />
  <button @click="login">登录</button>
</template>
```

注册到路由中

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201839187.avif)

打开 `http://localhost:5173/login` 就可以看到效果

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201840206.avif)

当然这里不写账号密码是没问题的，只是用来做个例子，随便输入然后点击登录，`isLogin` 为 `true` 了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201845768.avif)

我们可以用 `dev-tools` 来查看 `Pinia` 的状态

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201847042.avif)

## 引入 Naive-UI 组件库

一般而言做一些 `ToB` 的系统，基本上都不会有 `UI` 图的，要求的就是一个成型快，所以需要一个组件库来帮助我们开发

我个人还是比较喜欢 `Naive-UI` 这个组件库的，`Ant-Design` 和 `Element-UI` 其实也不错，看个人喜好吧

这里我们直接使用 `pnpm add naive-ui` 安装

`Naive-UI` 默认就支持 `tree-shaking` ，所以我们只需要在需要用到的时候引入相应组件即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201901501.avif)

这里我们引入一个 `Button` 组件，刷新页面就可以看到效果了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208201902324.avif)

## 引入 unplugin-auto-import 和 unplugin-vue-components

每次我们写页面很多时候都需要引入 `reactive`, `ref`, `watchEffect` 等函数，一旦还引用了其他的资源

那么 `<script setup>` 部分看起来就会比较乱，一坨的 `import { } from vue`

为了解决这个问题，大神 `antfd` 开发了 `unplugin-auto-import` 的插件，支持 `vite`, `rollup`, `webpack`，非常的牛逼

使用这个插件，我们就不用写重复的 `import` 语句了

使用 `pnpm add unplugin-auto-import -D` 安装

然后修改 `vite.config.ts` 文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202123317.avif)

注意，这里我们主要配置两个属性，一个是 `imports` ，一个是 `dts`

`imports` 用来表明我们需要全局注册的 `import` 语句

我们可以点进去看 `imports` 的类型，支持的自动导入是非常多的 

```typescript
declare const presets: {
    ahooks: () => ImportsMap;
    '@nuxtjs/composition-api': ImportsMap;
    '@vue/composition-api': ImportsMap;
    '@vueuse/core': () => ImportsMap;
    '@vueuse/math': () => ImportsMap;
    '@vueuse/head': ImportsMap;
    mobx: ImportsMap;
    'mobx-react-lite': ImportsMap;
    pinia: ImportsMap;
    preact: ImportsMap;
    quasar: ImportsMap;
    react: ImportsMap;
    'react-router': ImportsMap;
    'react-router-dom': ImportsMap;
    'react-i18next': ImportsMap;
    svelte: ImportsMap;
    'svelte/animate': ImportsMap;
    'svelte/easing': ImportsMap;
    'svelte/motion': ImportsMap;
    'svelte/store': ImportsMap;
    'svelte/transition': ImportsMap;
    'vee-validate': ImportsMap;
    vitepress: ImportsMap;
    'vue-demi': ImportsMap;
    'vue-i18n': ImportsMap;
    'vue-router': ImportsMap;
    vue: ImportsMap;
    'vue/macros': ImportsMap;
    vuex: ImportsMap;
    vitest: ImportsMap;
    'uni-app': ImportsMap;
    'solid-js': ImportsMap;
    '@solidjs/router': ImportsMap;
    'solid-app-router': ImportsMap;
    jotai: ImportsMap;
    'jotai/utils': ImportsMap;
    recoil: ImportsMap;
};
```

这样子我们使用相关的 `api` 了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202134868.avif)

导出的 `api` 列表我们可以查看 `src/auto-import.d.ts`

当然，由于我们使用的是 `TypeScript` ，所以不报错的功劳是这个 `src/auto-import.d.ts` 文件

默认情况下是有生成 `d.ts` 文件的，但是不是在 `src` 目录下，这会导致一个问题

因为 `tsconfig.json` 并没有识别这个 `d.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202150886.avif)

当然你也可以不设置 `dts` 属性，然后把 `auto-import.d.ts` 加入到 `tsconfig.json` 的 `includes` 属性中

```json5
{
  // ...
  "include": [
    "auto-import.d.ts",
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ]
}
```

这样也可以顺利识别了

同样，由于我们使用组件库，每个页面也需要引入很多的组件库组件，一旦引入很多代码看起来也会很杂

所以大神又开发了 `unplugin-vue-components` 插件，它能够全局导出组件库组件，而且是支持 tree-shaking 的

使用 `pnpm add unplugin-vue-components -D` 安装

然后继续修改 `vite.config.ts` 文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202200338.avif)

这里配置了 `resolvers` 和 `dts` ，`dts` 的作用和上个插件一样

`resolvers` 配置了需要自动导入的组件库，这里我们使用了 `Naive-UI` ，所以使用 `NaiveUiResolver` ，主流的 `UI` 都能支持，比如 `Ant Design` ， `Element-UI` 等

默认情况下啊，他还会把 `src/components` 下的组件也设为自动导入

可以打开 `src/components.d.ts` 文件查看，发现 `HelloWorld` 和 `NButton` 已经被注册了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202209676.avif)

tips：如果你使用的是 `pnpm` ，那么此时会出现一个问题，虽然已经有 `d.ts` 文件了，但是 `vue` 文件并没有类型提示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202212376.avif)

这是由于生成的 `d.ts` 是在 `@vue/runtime-core` 模块下的，但是 `pnpm` 并不会存在幻影依赖，在 `node_modules` 下不会扁平依赖

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202220068.avif)

所以该 `d.ts` 就无效了，可以把 `@vue/runtime-core` 改成 `vue` 这时候你会发现提示就有了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202217226.avif)

但是由于这个文件是自动生成的，如果有新的组件需要生成定义，那么又会被插件改成 `@vue/runtime-core`

这时候我们就要用 `.npmrc` 来告诉 `pnpm` 把 `@vue/runtime-core` 提升到 `node_modules` 目录下

我们在项目根目录下建一个 `.npmrc` 文件

```text
# 修复 pnpm 安装无法获得提示问题
# issue https://github.com/antfu/unplugin-vue-components/issues/406
# 提升 @vue/runtime-core 这个依赖到 node_modules 下
public-hoist-pattern[]=@vue/runtime-core
```

然后我们重新运行 `pnpm i` ，这时候 `@vue/runtime-core` 就在 `node_modules` 下了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202224824.avif)

这时候就可以正确的识别类型了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202226833.avif)

## 引入 Axios

基本上创建项目都需要 `Axios` 来作为 `http` 请求库

当然，如果是单纯的引入其实不难，这里主要是写一下我的封装

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211439914.avif)

这里的 `baseURL` 参数主要看后端接口，像我司不搞跨域配置的，就需要我在 `Vite` 中开启一个 `proxy` 来代理接口，然后对 `api` 进行转发

拦截器主要是返回实体数据，不然每次都要 `res.data.data` 来取数据还是比较麻烦的，以及处理错误请求等

这个要根据具体情况来配置，当然，对于 `TypeScript` ，我们自然希望能够有完整的类型提示

所以我们可以封装下四个方法，这里以 `get` 举例

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211447228.avif)

然后我们可以写对应的 `api` ，比如获取用户列表

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211453695.avif)

这样子引入 `getUserListApi` 这个 `api` 执行就能有完整的类型提示了

请求参数

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211454343.avif)

返回结果

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211454751.avif)

## 引入 Eslint 和 Prettier 和 EditorConfig

前面的配置基本上都是功能类的，现在我们需要配置 `Eslint` 和 `Prettier` 来保证代码格式和代码质量

代码格式和代码质量是相当重要的，因为我看过公司之前的项目，那个代码看的我真的是头皮发麻，感到不适

但是没办法，该往上加功能还是要加的...

执行 `pnpm add eslint prettier -D` 安装这两个库

`prettier` 使用默认配置即可，这里主要是配置 `eslint` 

创建 `.eslintrc.json` 和 `.eslintignore` 两个文件

其中 `.eslintignore` 要排除 `node_modules` 以及 `src/auto-import.d.ts` 和 `src/component.d.ts`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202258323.avif)

因为 `prettier` 默认情况下使用双引号的，而这两个 `d.ts` 都是用单引号的，所以我们避免去格式化这几个文件

在[官方文档](https://staging-cn.vuejs.org/guide/scaling-up/tooling.html#linting)中，提示我们可以使用 `eslint-plugin-vue` 这个插件，所以我们安装上它，然后配置 `.eslintrc.json`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202325146.avif)

接着我们可以执行 `eslint src/App.vue`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202326089.avif)

可以看到 `eslint` 正确地提示了问题

我们用 `prettier` 格式化 `App.vue` ，但是问题并没有消失，这是因为 `eslint` 的规则和 `prettier` 冲突了

所以我们需要解决 `eslint` 和 `prettier` 的冲突

安装 `eslint-config-prettier` ，这个配置能够让关掉 `eslint` 中和 `prettier` 冲突的规则，修改配置文件如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202348980.avif)

这时候我们执行 `eslint src/App.vue` 就不会提示错误了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202349083.avif)

冲突解决之后，还有一个问题，就是 `eslint` 它不报 `prettier` 的错误

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202354833.avif)

这里我们使用了单引号，但是 `eslint` 没报错，接下来，我们就需要让 `eslint` 在格式不符合 `prettier` 的情况下报相关的错误

安装 `eslint-plugin-prettier` ，修改配置文件如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202357309.avif)

现在 `eslint` 就能正确地报错了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/20/202208202359369.avif)

当然，我们可以直接把配置修改为如下，等价于上边配置的 `eslint-plugin-prettier` 和 `eslint-config-prettier`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208210004132.avif)

当然，`eslint-plugin-prettier` 使用了 `vue-eslint-parser` 来解析 `vue` 文件，对于其他文件，会使用默认的 `espree` 解析器来解析

如果想替换其他解析器，必须在 `parserOptions` 下设置 `parser` ，而不能在根下设置，不然 `vue-eslint-parser` 会失效，这里官方的文档也有说明

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211147398.avif)

`VSCode` 安装 `Eslint` ， `Prettier` 插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211154467.avif)

然后我们打开 `settings.json` ，配置保存的时候自动使用 `eslint` 格式化

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211157649.avif)

最后我们通过 `.editorconfig` 文件来设置一些编辑器的规则

主要是为了防止不同的 `ide` 会有不同的设置，比如换行符号，从而影响编码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211511516.avif)

## 引入 husky 和 lint-staged

虽然设置了代码格式化，但是很多时候项目并不是一个人在开发，是很多人协同合作

你不能要求别人每次提交代码之前都执行一次 `eslint` ，同时这对于自己来说也很麻烦

所以我们需要使用 `git` 的 `pre-commit` 钩子配合 `lint-staged` 来对暂存区的文件进行自动格式化

执行 `pnpm add husky lint-staged -D` 安装这两个依赖

`husky` 需要该项目为 `git` 仓库，所以需要 `git init` 初始化，然后执行 `pnpx husky install` 开启钩子功能

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211211628.avif)

然后执行  `pnpx husky add .husky/pre-commit "pnpm run lint-staged"` 添加 `pre-commit` 钩子

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211216930.avif)

这里记得要在 `package.json` 中添加相应的 `script`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211217161.avif)

然后我们在 `package.json` 中添加 `lint-staged` 的配置

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211222852.avif)

然后我们可以测试一下，我们修改下 `main.ts` 代码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211230971.avif)

`git add` 之后提交，可以看到自动格式化了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/21/202208211233279.avif)
 
# 后记

到此我们基本上就搭建了一个功能比较完备的项目了，当然，可操作的地方还有很多

比如 `git commit` 规范，打包前 `eslint` 检查，代码分割等

这些以后在慢慢写吧，不急，慢慢来，细水长流嘛

相关的仓库已经上传到我的 `git` 上了，有需要的直接拉下来删除 `.git` ，再初始化 `git` 即可作为一个不错的模板项目

仓库地址：[Dedicatus546 / vue3-ts-template](https://github.com/Dedicatus546/vue3-ts-template)
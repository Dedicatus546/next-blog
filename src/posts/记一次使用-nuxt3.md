---
title: 记一次使用 nuxt3
tags:
  - Nuxt
  - Vue
  - 
categories:
  - 编程
key: 1679755657date: 2023-03-25 22:47:37
updated: 2023-03-29 21:42:22
---


# 前言

刚好最近公司的官网需要重写，基本上都交给我一个人负责了，所以使用 Nuxt3 来体验一把 SSR

<!-- more -->

# 正文

这次主要包含的技术栈包括 Nuxt

引用的库有 Swiper 、 VueUse 、 Iconify 、 高德地图的 SDK 、 Pinia

## Nuxt3

使用 Nuxt 的决定性的原因就是 Nuxt 开箱支持 SSR ，作为一个官网，我觉得服务端渲染还是相当重要的

虽然上级并没有提到这个需求，可能这个官网也只是交付其他软件的时候需要的资料吧...

SSR ，全称为 Server-side Rendering ，即服务端渲染

对于传统的 Vue 或者 React 应用，比如我做的最多的管理系统，一般我们不会采用这种模式

因为对于一个管理系统 ， SSR 并不是必要的，甚至可以说是不需要，在这种情况下，我们使用的是 CSR （ Client-side Rendering ），即客户端渲染

当然，这两种都属于 SPA （Single-page Application），即单页面应用

不同的是，SSR 会在服务端生成完整的 HTML 结构然后返回，客户端再配合这些结果继续渲染，而 CSR 只能通过 js 来生成整个 dom ，html 只提供入口而已

所以很多时候我们通过 Vite 初始化一个 Vue 项目都能看到如下的 index.html

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/25/202303252338983.avif)

完整的 HTML 结构有助于 SEO ，CSR 下由于 HTML 结构需要通过 JS 来渲染，而一般情况下页面的数据是要通过 AJAX 请求来获取的

而各大搜索引擎的爬虫并不会等待请求完成之后再进行爬取。

## 使用 Tailwind CSS

使用原子 CSS 类来构建应用，这也是我第一次使用这类 CSS 库。

官网地址：[Rapidly build modern websites without ever leaving your HTML.](https://tailwindcss.com/)

当然，使用下来我个人而言，有优点也有缺点

### 优点：

- 基本不用编写样式了，取而代之的是选择合适的类名，所见即所得
- 类名支持响应式，即 `md:flex` 表示在大于 `md` 的宽度上应用 `flex` 样式
- 支持按需生成所需的样式，加上本身原子化的形式，打包生成的样式文件大小取决于使用到的类的多少
- 支持扩展类名，虽然我用不到，不过灵活性还是相当高的

### 缺点

- 虽然样式文件体积小了，但是整体的 HTML 的样式就大了，当应用的类名很多的时候，看起来就会很杂（个人而言），这就很能印证那句话“笑（体）容（积）没有消失，只是转移罢了”
- 需要额外去记忆类名，比如 `items-center` 表示 `align-items: center` ，虽然不是很难记忆，但总归是一个额外的心智负担

--- 

当然，总体上用下来我还是相当喜欢的，毕竟不用说一次性记忆全部的类名，用到的也是一些布局类型的类名

这些类名一般都比较好记，比如 `flex` ， `items-center` ， `justify-center` 等等

## VueUse

一个 Vue 的组合式函数库，封装了常用的函数

比如事件监听 `useEventListener` ；节点 hover 监听 `useElementHover` ；断点监听 `useBreakpoints`

除了组合式函数，还提供了一些非常好用的指令以及组件

比如常见的点击某个节点外部时，提供了 `vOnClickOutside` 指令，`OnClickOutside` 组件 ，`onClickOutside` 函数

可以说，基本上写 Vue3 的项目时我都会引入这个库，即使只使用了很小的一部分功能，毕竟本身就是支持 Tree shaking 。

## Iconify

在最开始的时候，我是使用阿里的 iconfont 来为项目生成 icon 的

但是之后我找到了一个更好的库，即 Iconify

这里为了让 iconify 接入 nuxt ，我们还需要使用 `unplugin-icons` 这个插件

然后我们在 nuxt 的配置文件中新增下面的代码

```javascript
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-icons/nuxt', { /* options */ }]
  ],
})
```

当然，由于我们使用的是 TypeScript ，所以如果单单进行上面的配置，那么引入 icon 组件时会报错

![图片来自 unplugin-icons 的某个 issue 的用户截图](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261752274.avif)

这里我们还要引入一个定义文件，这里有几种形式

### 在 Nuxt 配置文件中设置 TypeScript 配置

```javascript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "unplugin-icons/nuxt",
  ],
  typescript: {
    tsConfig: {
      compilerOptions: {
        // 对 icon 导入的类型支持
        types: ["unplugin-icons/types/vue"],
      },
    },
  },
});
```

配置完成后需要启动一次服务器，然后才能看到效果，原因是 Nuxt 会把这里的配置生成到 .nuxt 文件夹下的 `tsconfig.json` 中

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261755775.avif)

在项目根目录下，我们可以看到根的 `tsconfig.json` 继承了 `.nuxt/tsconfig.json` 文件，所以 TypeScript 的类型检查能正确生效

```json
{
  // https://nuxt.com/docs/guide/concepts/typescript
  "extends": "./.nuxt/tsconfig.json"
}
```

### 配置到根 tsconfig.json 中

根据上一个方法，其实我们也可以直接配置到根的 `tsconfig.json` 中，只需要加上下面这段即可

```json
{
  "compilerOptions": {
    // ...
    "types": [
      "unplugin-icons/types/vue"
    ]
  },
}
```

### 手动编写 d.ts 文件

如果我们直接点进去 `unplugin-icons/types/vue` 这个文件，我们会发现其实内部就是定义了一个 module 而已

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261810518.avif)

所以，我们可以直接在根目录下建立一个 `types` 的文件夹，然后新建一个 `icon.d.ts` 文件，把上面的内容复制进去即可

这样做能生效的原因 `.nuxt/tsconfig.json` 中包含了这些文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261822006.avif)

而且这样子会更加的灵活，你可以根据你安装的 icon 包来使用更加详细的前缀，比如

```typescript
declare module '~icons/mdi/*' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
```

这样子 VSCode 在提示的时候就会直接把 mdi 也给提示出来了，非常地方便

--- 

安装完成之后，我们就可以在 [mdi icon set](https://icon-sets.iconify.design/mdi/) 上面搜索我们想要的 icon ，然后 import 导入即可

比如我们搜索下常见的 close 图标

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261831672.avif)

然后我们点击选中一个

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261832198.avif)

我们看到这个图标的名字是 `mdi:close` ，前面的 `mdi` 表示它是所属哪个图标集的，后面表示它在图标集里的名称

我们通过 `import CloseIcon from "~icons/mdi/close"` 即可引入

2023-03-27 更新：

今天打算把配置下，让 Icon 能自动导入，省去写 import 语句，但是发现官方的文档并没有这个 Nuxt 框架的支持

翻了翻 issue ，发现有人提了 [Icons auto-import for Nuxt 3](https://github.com/antfu/unplugin-icons/issues/219)

往后面看可以发现其实是有解决办法的，那就是通过暴露的 vite 参数来直接配置

```javascript
import { defineNuxtConfig } from 'nuxt'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig(async () => ({
  modules: [
    ['unplugin-icons/nuxt']
  ],
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('i-'),
      },
    },
  },
  vite: {
    plugins: [
      Components({
        resolvers: [IconsResolver()],
      }),
      Icons({}),
    ],
  },
}))
```

虽然这也能工作，但总觉得不是官方支持的，有点别扭...

所以我根据这个 issue ，最后选择了 `nuxt-icon` 这个库，支持自动导入，并且也是依赖 iconify 的图集包

在 Nuxt 配置文件的 `module` 参数注册之后，在代码中直接使用 `Icon` 组件来引入图标

```html
<template>
  <Icon name="mdi:close" />
</template>
```

如果使用的是 VSCode ，那么还可以下载 Iconify Intellisense 这个扩展，然后只要字符串符合规则，那么会直接显示对应的图标，相当地不错

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/27/202303271806731.avif)

## 使用中遇到的问题

### SSR 下 VueUse 某些函数报错

比如我在项目中使用到的 `useElementHover` 函数，如果开启 SSR 模式，那么会直接报错

原因是实现的代码中直接获取了 `window` 这个对象

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/03/26/202303261859445.avif)

最后我们只能通过 `import.meta.env.SSR` 来让服务端不报错

```javascript
const isHover = import.meta.env.SSR ? ref(false) : useElementHover(el);
```

这样子可以暂时解决这个问题，不过我看官方的文档，应该是支持 SSR 的，难道是我配置有问题？

不过我也在 issue 中找到了和我一样报错的老哥，传送门：[problem with vueuse and nuxt 3 in docker : window is not defined](https://github.com/vueuse/vueuse/issues/2874)

我也在下面评论了，不过目前还没有回复，只能先等一等了

### SSR 下高德地图 SDK 报错

这里其实没有必要在服务端渲染地图结构，所以我直接使用 `ClientOnly` 组件让它只在客户端渲染，这样就解决了

2023-03-27 更新：

不知道为啥今天突然启动开发服务器就开始报错了，高德的 SDK 我是通过 `@amap/amap-jsapi-loader` 这个包提供的 loader 来加载 SDK 的

类似下面这样

```html
<script setup lang="ts">
import AMapLoader from "@amap/amap-jsapi-loader";

onMounted(() => {
  AMapLoader.load({
    // ...参数
  }).then((AMap) => {
    // 进行操作
  }).catch(e => {
    console.error(e);
  });
});
</script>
```

然后我们通过 `ClientOnly` 把这个组件包起来，不知道为啥今天就报错，奇怪

然后我就看了下控制台的错误，说是 `@amap/amap-jsapi-loader` 里面调用了 `window` 而导致的 window is not defined 错误

最后我发现是 `@amap/amap-jsapi-loader` 在 import 时就执行了某段逻辑，而这段逻辑调用了 `window` 从而导致错误

最后我使用了异步 import 来解决这个问题，代码如下：

```html
<script setup lang="ts">
onMounted(() => {
  import("@amap/amap-jsapi-loader").then(({default: AMapLoader}) => {
    AMapLoader.load({
      // ...参数
    }).then((AMap) => {
      // 进行操作
    }).catch(e => {
      console.error(e);
    });
  });
});
</script>
```

首先在 node 环境下 `onMounted` 是不会执行的，所以我们可以在这里安全地使用 `window` （或者 `document` ）

其次虽然我可以直接插入通过 Nuxt 的配置文件中直接插入 script 标签来引入 SDK ，但其实只有联系我们这个页面才需要用到 SDK 来加载地图

在其他页面也夹在这个 Loader 是完全没必要的。

# 后记

整个项目差不多花了两周多一点吧，很开心有一个其他公司的 UI 来帮忙设计。

使用 JQ 是不可能使用 JQ 的，这辈子都不可能用 JQ

就算是静态页面，我也要上 Vue 哈哈哈哈哈
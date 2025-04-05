---
title: >-
  在 vue3 中动态引入 assets 内的图片
tags:
  - Vue
  - JavaScript
categories:
  - 编程
date: 2025-02-13 11:13:54
updated: 2025-02-13 11:13:54
key: 1739416435
---


# 前言

在 vue3 中动态引入 `assets` 内的图片。

<!-- more -->

最近公司要把一个旧系统的几个页面迁移到新的系统上，从 vue2 迁移到 vue3 ，原来的项目是基于 webpack 的，在引入图片的时候似乎可以通过动态的 `require` 来引入，而在新项目中，esm 环境下没有 `require` ，并且 vite 对 `img` 的 `src` 的解析也是基于静态的，如果动态构造 `src` 则会出现路径不正确问题。

# 正文

## vue2 中的引入

vue2 中，引入图片一般使用 `require` ，如下：

```html
<template>
  <img :src="require('./image.jpg')" />
</template>
```

启动之后， webpack 会生成一份路径对真实地址的映射代码，即类似如下：

```javascript
const map = {
  "image.jpg": "image.b43b3ab.jpg",
};
```

这样实际的 html 结构中，就会看到：

```html
<img src="./image.b43b3ab.jpg" />
```

## 在 vue3 中的引入

由于 esm 环境中没有 `require` ，vue2 的引入方式不再适用，如果只是静态的图片路径，那么 vite 可以很好地处理：

```html
<template>
  <img src="./image.jpg" />
</template>
```

在开发环境下， `src` 的值被处理为 `./src/image.jpg` ，而在生产环境下， `src` 的值被处理为 `/assets/image-Di8ve3U_.jpg` 。

但是如果 `src` 为一个动态的变量，那么这些处理就会失效：

```html
<template>
  <img :src="'./image.jpg'" />
</template>
```

在开发环境和生产环境， `src` 的值都被处理为 `./image.jpg` ，这不符合实际的路径，并且此时如果观察构建产物的话， `src/image.jpg` 这个文件是不会被打包进来的。

在 vite 文档中 [features - html](https://cn.vite.dev/guide/features.html#html) 提到了这一点。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/02/13/20250213094729746.avif)

从上图可以知道，这个特性只是对某些元素生效的，如果你是自定义一个组件的话，那么路径处理是不会生效的。

那么我们得如何引入图片呢，在 vue3 中，我们可以直接使用 `import` 来导入一张图片的路径

```html
<template>
  <img :src="IMAGE" />
</template>

<script setup>
import IMAGE from "./image.jpg";
</script>
```

当然，这并不符合我们这篇帖子的主题，我们希望的是能够动态构建一个图片的地址，并保证这个地址在任何地方可用。

在 esm 中，我们可以使用 `URL` 对象以及 `import.meta.url` 来动态构建资源路径。比如上面例子的代码可以重写为：

```html
<template>
  <img :src="image" />
</template>

<script setup>
const image = new URL("./image.jpg", import.meta.url).href;
</script>
```

这样子图片就能正确被引入，并且在开发环境和生产环境下都能正确处理。

在上面的例子中，`"./image.jpg"` 是一个静态的常量，我们也可以将其设置为含有动态变量的字符串。

想象一下在 `src/assets/images/` 下有 `0.jpg` 、 `1.jpg` 和 `2.jpg` ，然后还有个按钮，每次点击就从当前图片跳到下一张图片： 

```html
<template>
  <img :src="image" />
  <button @click="index = (index + 1) % 3">+1</button>
</template>

<script setup>
import { computed, ref } from "vue";

const index = ref(0);
const image = computed(() => new URL(`./assets/images/${index.value}.jpg`, import.meta.url).href);
</script>
```

这样的代码在 vue3 中可以很好的工作，打包后也能正确地将相关的文件引用进来，在开发环境中，我们可以看到它是将 `./assets/images/` 下的所有 jpg 图片都导入了：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/02/13/20250213103036157.avif)

当然这个动态也是有一些限定的东西，比如这个路径必须是“静态”的，如果直接传入一个动态的变量，那么开发环境可能不会出现问题，但打包后不会引入相关的图片。

纯动态变量不会生效：

```html
<script setup>
import { computed, ref } from "vue";

const url = ref("");
const image = computed(() => new URL(url.value, import.meta.url).href);
</script>
```

转换后代码如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/02/13/20250213104909530.avif)

多字符串拼接，也不会生效：

```html
<script setup>
import { computed, ref } from "vue";

const url = ref("");
const image = computed(() => new URL("./assets/" + url.value, import.meta.url).href);
</script>
```

转换后代码如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2025/02/13/20250213105621831.avif)

这一点在 vite 的[静态资源处理 | Vite 官方中文文档](https://cn.vite.dev/guide/assets.html#new-url-url-import-meta-url)文档中有提及。

# 后记

使用 `URL` 配合 `import.meta.url` 的好处是可以动态的处理一些图片导入，坏处就是对应路径下的图片都会被导入，所以做好一些路径分割很重要，将动态路径的图片分配到单独的文件夹，再通过 `URL` 引入，这样产物就不会包含太多无关的文件了。
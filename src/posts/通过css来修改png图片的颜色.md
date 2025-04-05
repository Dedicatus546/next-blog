---
title: 通过css来修改png图片的颜色
key: 1635997293date: 2021-11-04 11:41:33
updated: 2023-02-13 18:28:45
tags:
 - css
categories:
 - 编程
---


# 前言

以 `css` 的方式来自定义 `png` 图片的颜色

<!-- more -->

# 正文

技术总监丢了个 `icon` 图给我，黑色底的 `png` 图片，如下

![](https://z3.ax1x.com/2021/11/04/IenUzt.png)

但是给的 `ui` 图是要白色底的，瞬间就麻了

没办法，只能问他能不能给张白底的 `icon`

然后他说，`css` 能改的啊

我一脸懵逼

直到我进行了一番知识的探索之后

卧槽，他🐴的真的能改，这也太牛逼了吧

留下了无知的泪水

原理就是使用 `mask-*` 的相关css来实现

> CSS 属性 mask 允许使用者通过遮罩或者裁切特定区域的图片的方式来隐藏一个元素的部分或者全部可见区域。 - MDN

可能学过 ps 的同学就能很容易理解，不过我没学过，完全不理解😂

所以需要有一些示例来帮助我们理解这个属性

首先 `mask` 和 `background` 相似，都有很多的二级属性

- `mask-image`
- `mask-mode`
- `mask-repeat`
- `mask-position`
- `mask-clip`
- `mask-origin`
- `mask-size`
- `mask-composite`

是不是感觉很熟悉，那就对了， `background` 也有这样的属性

先贴上一个简单的代码段（使用Vue3）

```html
<script setup lang="ts"></script>

<template>
  <div class="mask"></div>
</template>

<style scoped>
.mask {
  width: 100px;
  height: 100px;
  /* assets 目录下存放了这张图片 */
  mask-image: url("./assets/icon.png");
  /* 需要设置大小为适应盒子的长和宽 */
  mask-size: cover;
  /* 目前为实验性质，需要通过-webkit-前缀 */
  -webkit-mask-size: cover;
  -webkit-mask-image: url("./assets/icon.png");
  /* 这行一定要加，不然看不出效果 */
  background-color: black;
}
</style>
```

运行之后可以发现图片确实是黑色的

![](https://z3.ax1x.com/2021/11/04/Imcpo8.png)

但是这里的黑色并不是图片本身的颜色，二十我们设置的 `background-color` 的颜色

我们可以修改一下 `background-color` 的颜色

![](https://z3.ax1x.com/2021/11/04/Imcc0P.gif)

可以看到，确实是根据 `background-color` 的值变化的

这是为什么呢

其实 `mask` 可以理解为给盒子盖了一个某处镂空的画布

这个镂空的意思，指图片中的非透明部分，这部分最终会被镂空，然后显示出底下的样式

这个png图片，黑色的部分是非透明的，其余的部分都是透明的

![](https://z3.ax1x.com/2021/11/04/Imgtjs.png)

透明的部分被镂空，显示除了 `background-color` 的颜色

当然不只是设置背景颜色，还可以设置一张图片

这里用我的头像来试一试

![](https://z3.ax1x.com/2021/11/04/Im2iKs.png)

完全ok，再试一试直接使用 `img` 标签

![](https://z3.ax1x.com/2021/11/04/Im2sdP.png)

弄普肉不冷! 纯纯的破费！

再试下嵌套子元素的情况

![](https://z3.ax1x.com/2021/11/04/ImRSdx.png)

🐂！

# 后记

虽然很牛逼，不过依然是实验特性，`webkit` 内核的浏览器要添加前缀，火狐不用

不过这次依然使用了，因为项目不用兼容那么多的浏览器，只要安卓平台下 `webkit` 内核即可，能用就用

写前缀还是很烦的，使用了 `autoprefixer` 来自动添加前缀

因为用的 `create-vite` 创建的 Vue3 项目，所以配置下 `vite.config.js` 即可

```js
import vue from "@vitejs/plugin-vue";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default (mode) => {
  return defineConfig({
    plugins: [vue()],
    css: {
      postcss: {
        plugins: [
          // autoprefixer自动增加样式前缀，增加兼容性
          autoprefixer(),
        ],
      },
    },
    // ...其他配置
  });
};
```
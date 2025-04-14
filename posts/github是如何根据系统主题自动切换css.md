---
title: github是如何根据系统主题自动切换css
key: 1636336661date: 2021-11-08 09:57:41
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
 - css
categories:
 - 编程
---

 
# 前言

最近发现 `github` 能够根据系统的主题来自动调整整个站点的样式，很神奇

决定查查看到底是如何实现的

<!-- more -->

# 正文

使用的电脑环境为 `windows11` 以及最新的 `chrome` ， 版本如下

![](https://z3.ax1x.com/2021/11/08/I3xOMV.png)

![](https://z3.ax1x.com/2021/11/08/I3zZZD.png)

首先我们先要看看 `github` 实现的效果是怎么样的

在windows11 中的个性化 - 颜色中，我们先切换到**浅色**模式，如下图

![](https://z3.ax1x.com/2021/11/08/I3zHTe.png)

然后我们打开 `github`，发现和平常基本没区别

![](https://z3.ax1x.com/2021/11/08/I8SJ6x.png)

然后我们切换到**深色**模式

![](https://z3.ax1x.com/2021/11/08/I8imo8.png)

此时可以发现，背景已经变成深灰色了，任务栏，右键菜单也统统成为了深灰色

右键菜单如下

![](https://z3.ax1x.com/2021/11/08/I8idW4.png)

任务栏如下

![](https://z3.ax1x.com/2021/11/08/I8iJe0.png)

这时我们返回到刚才浏览器打开的那个 `github` 页面，发现已经变成深色模式了

![](https://z3.ax1x.com/2021/11/08/I8FbuR.png)

一个字形容，神奇！

那究竟是怎么实现的呢

没错，使用到的就是 `css` 的媒体查询

在媒体查询中，有一个查询属性为 `prefers-color-scheme` ，它的值为 `light` 或者 `dark` ，表明用户倾向于选择亮色还是暗色的配色方案

通过编写相关的代码，我们可以在相关场景下使用不同的样式

这里我们写个小 demo （使用 Vue3）

```html
<template>
  <div class="text">我是一段文字</div>
</template>

<style scoped>
@media (prefers-color-scheme: light) {
  .text {
    color: black;
    background-color: white;
  }
}

@media (prefers-color-scheme: dark) {
  .text {
    color: white;
    background-color: black;
  }
}
</style>
```

![](https://z3.ax1x.com/2021/11/08/I8Z3y4.png)

可以发现，这个时候使用的是 `light` 的样式

然后我们把系统切换到**深色**模式

![](https://z3.ax1x.com/2021/11/08/I8ZTmj.png)

这个时候就是应用 `dark` 的样式了

在 `github` 中，使用 `css` 变量定义了两套 `css` 规则，来适配 `light` 和 `dark` 模式

`dark` 模式对应 `css` 样式（部分）

![](https://z3.ax1x.com/2021/11/09/ItF7bd.png)

`light` 模式对应 `css` 样式（部分）

![](https://z3.ax1x.com/2021/11/09/ItkZxU.png)

由于我这里系统开的是深色模式，所以浅色模式的样式就被覆盖了

而且从上面可以看出， `github` 使用了浅色模式的样式作为其默认的样式，通过 `:root` 这个选择器就可以看出来

从上面两个还可以看出，这里使用了 `css` 的属性选择器

`[data-color-mode=auto]` ， `[data-dark-theme*=dark]` ， `[data-dark-theme*=light]` 就设置在 `html` 标签上面

![](https://z3.ax1x.com/2021/11/09/ItkWZj.png)

# 后记

媒体属性说实话用的确实少，能用到的地方大多是适配响应式布局

对其他属性了解很少

在 MDN 中，很好地为我们列出来所有的媒体查询属性

[使用媒体查询 - MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Media_Queries/Using_media_queries)

不过看起来似乎都不是很常用...

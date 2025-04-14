---
title: 记一次 safari 下使用 css3 动画导致的动画穿透问题
tags:
  - null
categories:
  - null
key: 1668410233date: 2022-11-14 15:17:13
updated: 2023-02-13 18:28:45
---



# 前言

记一次 `safari` 下使用 `css3` 动画导致的动画穿透问题

<!-- more -->

# 正文

最近公司在做一个和区块链相关的项目，主要是一些臻品的展示兑换页面，类似于[臻品详情 - 元启](https://yuanqi.scaniov.com/h5/#/pages/collectionDetail/collectionDetail?id=651)，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/11/14/202211141450393.avif)

这上面这个类似相框一样的东西可以左右 `360` 度，旋转，并且支持触摸修改角度

刚开始实现时我们使用了 `animate` ，但是由于要支持触摸时修改角度，而 `animate` 暂停的时候无法获取当前的动画状态，在这里是 `rotateY`

所以最终使用 `requestAnimateCallback` 已经动态设置 `rotateY` 的方式来实现

这里额外需要使用 `transform-style: preserve-3d` 来表明改元素是处于 `3D` 视角下的，这样子 `translateZ` 设置远近才能生效

改属性的 `MDN` 页面： [transform-style](https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform-style)

对应 `flat` 和 `preserve-3d` 的效果如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/11/14/202211141507305.avif)

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/11/14/202211141507212.avif)

最后我们实现的效果如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/11/14/202211141459423.avif)

在安卓上显示没问题的，但是在 `IOS` 上出现了动画元素和弹出框穿透问题，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/11/14/202211141502017.avif)

最后通过百度，定位到问题为 `safari` 下必须在设置了 `transform-style: preserve-3d` 的元素的父元素上设定 `overflow` 为非 `visible` 才能解决问题

因为我们的弹层是使用 `Van` 提供的 [Overlay](https://vant-ui.github.io/vant/#/zh-CN/overlay) 组件来构建的，他会挂载到 `body` 下，所以这里我们不能给 `body` 设置 `overflow` ，必须给下一级的设置了 `transform-style: preserve-3d` 的元素的父元素上设置 `overflow` 才能生效

由于这个组件并不会渲染到外部，所以我给父元素添加了一个 `overflow: hidden` ，即可修复穿透的问题
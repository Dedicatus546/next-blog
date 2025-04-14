---
title: 移动端下click延迟问题
key: 1635299278date: 2021-10-27 09:47:58
updated: 2023-02-13 18:28:45
tags:
 - JavaScript
 - 移动端
categories:
 - 编程
---


# 前言

对移动端下 `click` 延迟问题的分析以及解决方案

<!-- more -->

# 正文

## 问题发现

某个项目做的差不多了，但是测试说按钮灵敏度不高，提了 bug 在工单上

项目为 web 项目，最终会套壳，生成 apk

由于我是在 pc 上开发的，模拟安卓浏览器是通过 chrome 浏览器模拟的，开发的时候基本上没感觉出来

之后拿了个 pad 试了试，发现确实有这么个现象

然后就跑去网上查找原因

最后查到的原因为：移动端下 `click` 事件有 `300ms` 的延迟

移动设备上的浏览器将会在 `click` 事件触发时延迟 `300ms` ，以确保这是一个**单击**事件而非**双击**事件

然后又去查了查，发现这个 `300ms` 可以扯出几个问题

## 去除 `300ms` 限制

由于每次点击都会有短暂的延迟，会让人觉得很不爽，（至少我们这边的测试很不爽

代码如下（使用Vue3）：

```html
<script setup lang="ts">
const button1Click = () => {
  console.log("button-1 click.");
};
</script>

<template>
  <div>
    <button class="button button-1" @click="button1Click">button-1</button>
  </div>
</template>

<style scoped>
.button {
  display: inline-block;
  width: 200px;
  height: 40px;
  font-size: 20px;
}
</style>
```

现象如下：

![](https://z3.ax1x.com/2021/11/04/IeC4l4.gif)

可能由于录制原因不是很看的出来，自己写个小 demo 跑一下就明白了

**解决方案 1：使用 `touchstart` 事件来代替 `click` 事件**

`touchstart` 事件可以说是移动端下特有的事件，pc 上不生效

配套的事件还有 `touchmove`，`touchend` 和 `touchcancel`

当手机一触碰到屏幕，那么 `touchstart` 事件就直接触发

会按照 `touchstart` -> `touchmove` -> `touchend` -> `click` 的顺序进行触发

**解决方案 2：设置 `viewport` 的 `content` 值为 `user-scalable=no`**

由于 `300ms` 的限制是为了识别单机还是双击，那么只要我们禁止用户缩放即可。

```html
<html>
<head>
    <!-- 禁止用户缩放 -->
    <meta name="viewport" content="user-scalable=no"/>
</head>
<body>
</body>
</html>
```

**解决方案 3：设置 `viewport` 的 `content` 值为 `width=device-width`**

```html
<html>
<head>
    <!-- 禁止用户缩放 -->
    <meta name="viewport" content="width=device-width"/>
</head>
<body>
</body>
</html>
```

## 点击穿透

现象：由于存在延迟，如果此时有两个叠在一起的按钮（假设为 `position` 为 `absolute`），点击上边的按钮（可以理解为 `z-index` 大

这里我们使用了两个绝对定位的按钮来复现这一个现象（这里使用的 Vue3 ,记得要在控制台切换成移动设备）

```html
<script setup lang="ts">
import { ref } from "@vue/reactivity";

const button1Click = () => {
  console.log("button-1 click.");
};
const button2Show = ref(true);
const button2TouchStart = () => {
  button2Show.value = false;
  console.log("button-2 touchstart.");
};
</script>

<template>
  <div>
    <button class="button button-1" @click="button1Click">button-1</button>
    <button
      class="button button-2"
      @touchstart="button2TouchStart"
      v-show="button2Show"
    >
      button-2
    </button>
  </div>
</template>

<style scoped>
.button {
  display: inline-block;
  width: 200px;
  height: 40px;
  font-size: 20px;
  position: absolute;
}

.button-1 {
  left: 20px;
  top: 20px;
}

.button-2 {
  left: 30px;
  top: 30px;
}
</style>
```

![](https://z3.ax1x.com/2021/11/04/IZzXs1.gif)

当 button2 触发 `touchstart` 事件而隐藏时，由于 `300ms` 的延迟，它下面的 button1 的 `click` 事件就被触发了，也就是我们所说的点击穿透。

注意，此时在去除 `300ms` 的方案中 设置方案2或者方案3的 `meta` 头都依然会触发点击穿透，刚开始还以为只要设置了相关的 `meta` 头就能解决，还是太天真了

也就是说 `300ms` 解决的办法并不适用点击穿透

搜了下网上了，有如下几种方法

- 全部使用 `touchstart` 事件来模拟 `click` 事件
- 全部使用 `click` 事件
- 使用 `fastclick` 三方库
- 点击上面的按钮之后给下面的按钮加一个 `300ms` 透明div，阻挡住 `click` 事件触发

2022年了，全部使用 `click` 我觉得应该也没什么大问题，`300ms` 通过 `meta` 来解决即可

但是，测试说，你这个按钮它不够灵敏啊，我轻微的滑动他就不算点击了，这不行

我晕...

# 后记

最后还是混用了 `touchstart` 和 `click`， `touchstart` 里面 `preventDefault` ，这样子 `pc` 和 移动端就都可以使用了
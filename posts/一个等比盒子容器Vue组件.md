---
title: 一个等比盒子容器Vue组件
key: 1627610781date: 2021-07-30 10:06:21
updated: 2021-07-30 10:06:21
tags:
  - JavaScript
  - Vue
  - 组件
  - 响应式
categories:
  - 编程
---

一个等比盒子容器`Vue`组件。

<!-- more -->

有个需求需要有个固定宽高比的盒子

可以使用`padding-top`的百分比值和绝对定位`position: absolute`来进行编写。

在`CSS`中：

- `margin-left`
- `margin-right`
- `margin-top`
- `margin-bottom`
- `padding-left`
- `padding-right`
- `padding-top`
- `padding-bottom`

这`8`个值的百分比都是按照父元素的宽度进行计算的。

所以我们可以根据这个特性编写出一个简单的`DEMO`

`HTML`如下：

```html
<div class="parent">
  <div class="child"></div>
</div>
```

`CSS`如下：

```css
.parent {
  width: 50%;
  margin: 0 auto;
}

.child {
  padding-top: 50%;
  background-color: pink;
}
```

效果如下：

![](https://z3.ax1x.com/2021/07/30/WLAWh6.png)

动态图如下：

![](https://z3.ax1x.com/2021/07/30/WL3aq0.gif)

可以看到整个盒子的宽高都是保持一定的比例的。

这时如果我们在`child`里面直接写的话是不行的。如下：

![](https://z3.ax1x.com/2021/07/30/WL8tYD.png)

我们发现内容放在了盒子底部，因为`padding-top`占用的区域为`padding`，只有`content`区才能放置我们的内容。

所以这时候就要使用我们的绝对定位，通过新增一个内部盒子来把`content`区扩展到父元素的`padding`区。

`HTML`如下：

```html
<div class="parent">
  <div class="child">
    <div class="absolute"></div>
  </div>
</div>
```

`CSS`如下：

```css
.parent {
  width: 50%;
  margin: 0 auto;
}

.child {
  position: relative;
  padding-top: 50%;
  background-color: pink;
}

.absolute {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: black;
}
```

效果如下：

![](https://z3.ax1x.com/2021/07/30/WLJCbq.png)

这时`.absolute`盒子的`content`就以及可以正常的写内容了，如下：

![](https://z3.ax1x.com/2021/07/30/WLJzFK.png)

最后我们可以封装成一个通用`vue`组件，供业务使用。

```html
<template>
  <!-- 绑定宽度 -->
  <div class="aspect__ratio__wrapper" :style="{ width }">
    <div
      class="aspect__ratio__container"
      :style="{
        'padding-top': getPaddingHeight + '%',
      }"
    >
      <div class="aspect__ratio__absolute">
        <!-- 通过slot来分发内容，使得盒子具有普适性 -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // 长宽比，来计算padding-top
    ratio: {
      type: Number,
      default: 1,
    },
    // 宽度
    width: {
      type: String,
      default: "100%",
    },
  },
  computed: {
    getPaddingHeight() {
      // 计算padding-top的值，单位百分比
      return (1 / this.ratio) * 100;
    },
  },
};
</script>

<style lang="less" scoped>
.aspect__ratio__wrapper {
  .aspect__ratio__container {
    position: relative;
    height: 0;

    .aspect__ratio__absolute {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }
}
</style>
```

---
title: CSS两左一右布局
key: 1627567322date: 2021-07-29 22:02:02
updated: 2021-07-29 22:02:02
tags:
  - CSS
categories:
  - 笔记
---

`CSS`两左一右布局

<!-- more -->

今天做 UI 的时候有这样一个需求，即两个 box 靠左，一个 box 靠右。

直觉上使用`flex`布局来解决，很容易可以写出如下代码：

```html
<div class="parent">
  <div class="left">
    <div class="child child-1"></div>
    <div class="child child-2"></div>
  </div>
  <div class="right">
    <div class="child child-3"></div>
  </div>
</div>
```

`CSS`样式简单，如下：

```css
.parent {
  display: flex;
  justify-content: space-between;
}

.child {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: red;
}
```

然后我们就能看到如下的效果了：

![](https://z3.ax1x.com/2021/07/29/Wqr9dH.png)

但是这样的代码很丑，每次想要这样的布局都需要嵌套两个`left`和`right`的盒子，有点影响`css`的`class`语义化。

今天从网上学到一个更好的`css`方式，即使用`margin`的`auto`来进行布局。

`HTML`如下：

```html
<div class="parent">
  <div class="child child-1"></div>
  <div class="child child-2"></div>
  <div class="child child-3"></div>
</div>
```

我们只想让第三个`child`往右，可以给这个盒子设置`margin-left: auto`。

`CSS`如下：

```css
.parent {
  display: flex;
  /* 不使用justify-content */
  /* justify-content: space-between; */
}

.child {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: red;
}

.child-3 {
  margin-left: auto;
}
```

效果如下：

![](https://z3.ax1x.com/2021/07/29/WqsOKK.png)

可以看到由于第三个盒子设置了`margin-left: auto`，盒子自动使用最大的`margin-left`，也就达到了我们想要的效果。

![](https://z3.ax1x.com/2021/07/29/WqyC8I.png)

这样子盒子的`class`类名就可以按照内容的语义化来了，而且减少盒子嵌套。

同样在垂直的方向上也是适用的，效果如下：

![](https://z3.ax1x.com/2021/07/29/Wq6neO.png)
---
title: 使用 flex 布局实现左边自适应右边高度可滚动功能
key: 1654160583date: 2022-06-02 17:03:03
updated: 2023-02-13 18:28:44
tags:
- CSS
- Flex
categories:
- 编程
---


# 前言

使用 `flex` 布局实现左边自适应右边高度可滚动功能

<!-- more -->

# 正文

最近切图有这样一个需求

两个 `div` 并列放，右侧的内容很长，要出现滚动，如下图

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021712623.avif)

我想，辣不是简简单单？

三下五除二我就写出了第一版的代码

```html
<div class="flex">
  <div class="h-300px w-600px bg-green-500/50">
    左边
  </div>
  <div class="max-h-300px flex-grow overflow-y-auto">
    <div class="h-1200px">
      模拟内容很长
    </div>
  </div>
</div>
```

（这里使用了 `windiCSS` ，没用过的我觉得看类名你也知道是什么样式了）

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021729233.avif)

没啥问题，提交准备下班

传来一声嘀嘀嘀，是 boss 来消息了

**boss**：小林啊，这个右侧这个滚动条是不是短了点

**我**：？？？

然后 boss 发了个图过来

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021731569.avif)

**我**：伢~~~~，boss，不是说左边是固定高度的吗

**boss**：不一定啊，高度不会相差太大，左侧展示的有些信息很长会换行，能不能把这个滚动条保持和左侧一样的高度？

我：我试一下

---

至此，这个需求就完全展示出来了

如果使用 `js` 的话，这个功能起始不难实现，动态获取左侧高度，赋给右侧即可

但是如果能摆脱 `js` 就好了，能不能用纯 `css` 实现？

我们知道，在使用 `flex` 布局时，默认情况下， `align-items` 的产生的效果为 `stretch`

此时 `flex` 内的项目高度会占满父盒子，例子如下：

```html
<div class="flex">
  <div class="w-500px h-500px bg-gray-500"></div>
  <div class="flex-grow bg-pink-500"></div>
</div>
```

此时我们给左盒子设置了 `500px` 的高，右盒子没有设置高度，但是由于默认的 `align-items` 下，此时右盒子的高度也为 `500px`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021750729.avif)

此时如果我们动态改变左侧高度，右侧也会跟着改变：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021753387.gif)

于是乎借着这个特性我写出了下面这一版代码

```html
<div class="flex">
  <div class="h-400px w-600px bg-green-500/50">
    左边
  </div>
  <!-- 现在右侧不设置高度了 -->
  <div class="flex-grow overflow-y-auto">
    <div class="h-1200px">
      模拟内容很长
    </div>
  </div>
</div>
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021738144.avif)

很明显，失败了，右侧的盒子高度被撑开了

但是我想起了之前的帖子 {% post_link 解决嵌套flex布局子容器内容超出父容器 解决嵌套flex布局子容器内容超出父容器 %}

默认情况下，`flex` 项目的宽高是根据内容来决定的，此时我们需要让它用父元素的宽高来确定

我们使用 `height: 0` 来限定，于是，我们写出了下面的代码

```html
<div class="flex">
  <div class="h-400px w-600px bg-green-500/50">
    左边
  </div>
  <div class="h-0 flex-grow overflow-y-auto">
    <div class="h-1200px">
      模拟内容很长
    </div>
  </div>
</div>
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021805121.avif)

很明显不行，这是为啥呢

默认情况下，`flex` 布局是水平放置的，`height: 0` 只能在垂直放置下生效

那要怎么办了？

可以嵌套一个 `flex` ，让它成为垂直放置

```html
<div class="flex">
  <div class="h-500px w-500px bg-gray-500"></div>
  <div class="flex-grow flex flex-col bg-pink-500">
    <div class="h-0 flex-grow overflow-y-auto">
      <div>
        <!-- 这里是 vue 的语法 -->
        <div v-for="n in 60" :key="n">test</div>
      </div>
    </div>
  </div>
</div>
```

这里我们让右盒子也成为一个 `flex` 盒子，然后把它的 `flex-direction` 设置为 `column` ，这样它就变成垂直放置的了

再给它的 `flex` 项目设置高度为 `0` ，并且 `flex-grow` 为 `1` ，这样它就不会按内容的高度来计算，而且它会占据父元素的高度，而父元素此时的高度会和左侧保持一样

`flex` 项目设置 `overflow-y` 为 `auto` ，让它适时的出现滚动条

这样，我们的需求就完成了，效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/06/02/202206021817918.gif)

# 后记

CSS 实在是太神奇了

虽然字体省略我用了许多次，但每一次我都要去百度，麻了...
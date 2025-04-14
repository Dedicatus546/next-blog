---
title: CSS样式权重
key: 1602468235date: 2020-10-12 10:03:55
updated: 2023-02-13 18:28:44
tags:
  - CSS
categories:
  - 笔记
---


# 前言

CSS 样式权重

<!-- more -->

# CSS 样式权重

之前做的两个项目，写一些组件时会出现样式无法覆盖的情况，所以写写，来增加理解。

CSS 中的样式有一套规则，来判断样式的权重，对一个元素，权重最大的生效，也就是其他的样式都此样式被覆盖。

对于权重，分了几个等级，依次递减为。

- `!important` 此样式的权重最高，为`1|0|0|0|0`；
- `style="..."` 内联样式，此样式权重次高，为`1|0|0|0`；
- `#idname` id 选择器，此样式权重次次高，为`1|0|0`；
- `.classname`|`:hover`|`input[disable]` 类选择器，伪类选择器，属性选择器，此样式权重次次次高，为`1|0`；
- `h1`|`::after` 标签选择器，伪元素选择器，此样式权重倒数第二，为`1`；
- `*`|`+`|`~`|`>`|`:not` 通用选择器，相邻选择器，同胞选择器，子选择器，以及否定伪类，此样式权重最低，为`0`，即这几个不参与样式权重的计算。

## `!important`

每次当我不知道为啥无法覆盖当前的样式时，我就会使用此来覆盖样式 😂。

不过这样做并不好，因为写不出覆盖效果大概率是没懂 css 的权重计算，理解了并使用才是最好的。

给某个 css 属性值末尾加上`!important`之后，那么这个样式的优先级就变得最高了，无论是先写还是后写（对于权重相同的样式，后写的会覆盖先写的）。

```html
<div class="div1" style="background-color: pink!important;"></div>
<div class="div1"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: #1890ff;
}
```

效果图

![](https://i.loli.net/2020/10/15/oN374g1TAyJ8GQi.png)

发现写在内联的样式中的`!important`背景色覆盖了类名`.div1`的样式

不过这么些并没有什么说服力，因为刚开始我们就说**内联样式权重**是大于**类名样式权重**的。

所以**内联样式**就是会覆盖**类名样式**的

所以我们换个思路

```html
<div class="div1" style="background-color: pink;"></div>
<div class="div1"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  /*无!important修饰*/
  /*background-color: #1890ff;*/
  background-color: #1890ff !important;
}
```

我们在类里面使用`!important`设定背景色，然后在内联样式中也设定背景色。

按照之前的排行，**内联样式**是会覆盖**类名样式**的。

我们不加`!important`看看效果。

![](https://i.loli.net/2020/10/15/GZUqzkBCIocRheN.png)

图中展示确实是内联覆盖了类名。

然后我们在类名中加上`!important`，看看效果。

![](https://i.loli.net/2020/10/15/6uO5cVAHi2BjFDz.png)

类名的样式覆盖了内联样式了，有点意思 😏。

当然这里的覆盖只会应用于背景色这个样式，其他没设置的依然是内联覆盖类名的。

```html
<div
  class="div1"
  style="width:150px;height:150px;background-color: pink;"
></div>
<div class="div1"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: #1890ff !important;
}
```

效果图

![](https://i.loli.net/2020/10/15/sQXRduKvEImGrZM.png)

内联的高度和宽度还是覆盖了类名的，只有背景色`background-color`是类名覆盖内联的，因为加上了`!important`。

前面说过，有几种选择器是不参与权重计算的，他们的权重为`0`。

那么我们试试如果把`!important`写到这些选择器里面会是什么效果，就以通用符`*`来作例子。

```html
<body></body>
```

```css
* {
  background-color: #1890ff !important;
}

body {
  background-color: white;
}
```

按照前面的说法，如果`*`不参与权重计算，那么页面应该是白色，但是在`*`里面使用`!important`之后。

![](https://i.loli.net/2020/10/15/MeDtUFoCvT2SPwV.png)

整个页面都变成蓝色了，也就是`!important`覆盖了标签名的样式。

## `style="..."`

内联样式大部分的时候都是在想动态的计算 css 属性值时才会使用。

像 Bilibili 首页的轮播图就是使用了内联的`transform`来动态的控制`translate3d`中水平 X 坐标的位置（第一个参数）。

![](https://i.loli.net/2020/10/15/xYaWmjrtfGXezKy.png)

内联样式是仅次于`!important`的，优先级很高，但是很多的时候都不会写大量的内联样式。

### 内联 VS ID

```html
<div id="div1" style="background-color: pink;"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
}

#div1 {
  background-color: #1890ff;
}
```

效果图：

![](https://i.loli.net/2020/10/15/MuopHBTn3bWNmyX.png)

内联的粉色覆盖了`id`的蓝色。

### 内联 VS 类名

```html
<div class="div1" style="background-color: pink;"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
}

.div1 {
  background-color: #1890ff;
}
```

效果图：

![](https://i.loli.net/2020/10/15/moRa3QLD4S57Zcs.png)

内联的粉色覆盖了类名的蓝色。

### 内联 VS 标签

```html
<div style="background-color: pink;"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: #1890ff;
}
```

效果图：

![](https://i.loli.net/2020/10/15/qzDgRZYJfbn9KO7.png)

内联的粉色覆盖了标签的蓝色。

## \#idName

id 选择器，怎么说呢，我做的两个项目都只在根上使用了 id 选择器，主要是设置字体大小和颜色等一些基本的样式。

id 选择器的优先级次于`!important`和内联。

### ID VS 类名

```html
<div id="div1" class="div"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
}

.div {
  background-color: #1890ff;
}

#div1 {
  background-color: pink;
}
```

效果图

![](https://i.loli.net/2020/10/15/OwynTjeZsXuJKgA.png)

ID 的粉色覆盖了类名的蓝色。

### ID VS 标签

```html
<div id="div1"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: #1890ff;
}

#div1 {
  background-color: pink;
}
```

效果图

![](https://i.loli.net/2020/10/15/yqlOACDacr3R5nF.png)

ID 的粉色覆盖了标签的蓝色。

## .className

类名选择器，这个可以说是最常用的了，一般不会写很多内联，也不会写很多 id 选择器，而是通过类名来分组，通过类的名字来表示类的作用。

之前在做学校新的官网的时候，使用了一点'语义化'的`css`（应该可以这么比喻）。

项目中很多地方使用了`flex`布局，以及间距等，所以写了一些公共的样式来直接的使用，比如：

```css
.mt-10 {
  margin-top: 10px;
}
.pt-10 {
  padding-top: 10px;
}
.flex {
  display: flex;
}
.t-center {
  text-align: center;
}
/*etc...*/
```

总体而言效果还不错，可能是项目比较小的缘故 🤣。

### 类名 VS 标签

```html
<div class="div1"></div>
```

```css
div {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-color: #1890ff;
}

.div1 {
  background-color: pink;
}
```

效果图：

![](https://i.loli.net/2020/10/15/Viq3zgRMxTfp9ea.png)

# 如何计算权重？

前面我么写的都是些简单的比较，而实际上可能我们的选择链会很长，比如：

```css
.button .button__icon .button__icon--color {
  /*写样式..*/
}
```

那么应该如何计算选择链条的权重呢？

前面已经把每种选择器的权重都写出来了，比如对于下面这个选择链：

```css
li > a[href="#achor1"] > .inline-warning {
  /*写样式...*/
}
```

我们可以根据之前的说明，发现这个里面存在了两个标签选择器`li`和`a`。

此时的权重应该是`0|0|0|0|2`。

接着又发现了里面存在一个类选择器`.inline-warning`和属性选择器`[href="#achor1"]`。

此时的权重应该是`0|0|0|2|2`。。

由于直接子元素选择权重为 0，所以无需计算。

所以此时的权重为`0|0|0|2|2`。

那么此时如果出现了另一个选择器，为如下：

```css
#l1 > a[href="#achor1"] > .inline-warning {
  /*写样式...*/
}
```

那么同样根据计算，这个的权重应该为`0|0|1|2|1`。

那么此时下面这个的权重是大于上面那个的，可以实验一下。

```html
<ul>
  <li>
    <a href="#achor1">
      <span class="inline-warning">我是一个链接</span>
    </a>
  </li>
  <li id="l1">
    <a href="#achor1">
      <span class="inline-warning">我是一个链接</span>
    </a>
  </li>
</ul>
```

```css
#l1 > a[href="#achor1"] > .inline-warning {
  /*写样式...*/
  color: blue;
}
li > a[href="#achor1"] > .inline-warning {
  /*写样式...*/
  color: red;
}
```

效果图

![](https://i.loli.net/2020/10/15/WafNwcvY6EPGbMp.png)

发现使用 id 选择器开头的覆盖了使用标签开头的。

OK，权重大的覆盖权重小的，完全没什么问题，但是如果两者权重相同呢？

比如下面这两个选择链

```html
<div class="div1">
  <span class="span">
    <span class="icon">我是一个icon</span>
  </span>
</div>
```

```css
.div1 > span > .icon {
  color: red;
}
.div1 > .span > span {
  color: blue;
}
```

这两个选择链都是两个类选择器和一个标签选择器，所以权重是一样的，都是`0|0|0|2|1`

效果图

![](https://i.loli.net/2020/10/15/ul2GD6YeyJ1swSK.png)

发现后面一个样式链生效了，难道是先写类名的权重高吗？？

不急，我们调换 css 的书写顺序

```css
.div1 > .span > span {
  color: blue;
}
.div1 > span > .icon {
  color: red;
}
```

效果图

![](https://i.loli.net/2020/10/15/QZXqBEvYy1ugDxk.png)

发现变成红色了。

其实没有那么的复杂，由于权重相同，所以后写就会覆盖先写的，就是这么的简单。

## 注意点

### 权重计算

网上比较多的文章以 `10000`，`1000`，`100`，`10`，`1` 来表示每类的权重，并通过相加来计算权重。

这么做其实有个问题，那就是权重它并不是按`10`进`1`的，也就是说：

**1000 个标签选择器也比不过 1 个类选择器**。

比如

```css
div > div > div > div > div > div > div > div > div > div > div {
  color: red;
}

.div1 {
  color: blue;
}
```

如果按照上面权重相加来计算的话。

此时第一条的权重为`00011`，第二条为`00010`。

那么应该显示红色才对。

![](https://i.loli.net/2020/10/15/i5Ut6kErybAMLqK.png)

但其实是显示的蓝色 🤣。

所以我在写的时候，用了一个`|`来隔开，只要单纯把每个位置当成计数位，而不是通过相加，即：

第一条权重应该为`0|0|0|0|11`。

第二条权重应该为`0|0|0|1|0`。

所以就不会出现相加误判的情况了。

### `!important`

网上有些帖子`!important`为绝对的优先，后面的覆盖前面。

其实它也是可以计算出权重的，而权重会影响到覆盖的。

比如下面两个带`!important`的样式应该是哪个覆盖哪个。

```css
#d1 > .div {
  color: blue !important;
}
.div {
  color: red !important;
}
```

按照绝对优先的说法应该是显示红色的

![](https://i.loli.net/2020/10/15/ty8spv94CrqDmAH.png)

但其实是蓝色，也就是上面的权重大于下面，下面的无法覆盖上面

第一个的权重`1|0|1|1|0`

第二个的权重`1|0|0|1|0`

第一个权重大于第二个，所以显示第一个。

这也引申出了如何去覆盖一个定义的`!important`样式，

比如它在一个标签上定义了

```css
h1 {
  color: red !important;
}
```

那么此时想要覆盖，就得使得权重比上面这个大，上面这个的权重为`1|0|0|0|1`

比如可以写一个权重为`1|0|0|0|2`的，比如

```css
section > h1 {
  color: blue !important;
}
```

覆盖成功（并且此时带`section`的是先写的，也就是不存在覆盖的推断，实打实的权重高）

![](https://i.loli.net/2020/10/15/UCqIF8aH3pAJ5Ke.png)

或者可以写一个权重为`1|0|0|1|1`的，比如

```css
.section > h1 {
  color: blue !important;
}
```

也可以成功覆盖

![](https://i.loli.net/2020/10/15/PtrhObRpME2WQLy.png)

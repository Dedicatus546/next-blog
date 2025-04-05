---
title: a标签的那些伪类
key: 1602340876date: 2020-10-10 22:41:16
updated: 2023-02-13 18:28:43
tags:
  - CSS
categories:
  - 笔记
---


a 标签的那些伪类。

<!-- more -->

# `a`的那些伪类

`a`标签常见的伪类有四个：

- `a:link` 用户没有访问过的链接；
- `a:visited` 用户已经访问过的链接；
- `a:focus` 链接获得焦点；
- `a:hover` 鼠标指上去；
- `a:active` 鼠标按下不松开；

## `a:link`

MDN 上解释`:link`为：

> 将会选中所有尚未访问的链接，包括那些已经给定了其他伪类选择器的链接。

刚开始我是有些懵逼的，未访问的链接？？？是什么意思？

然后我就在火狐下尝试了下，其实很容易理解，就是如果你的浏览器从来没开过这个`a`标签指向的网址，那么`link`的样式就会生效。

我们先把浏览器的历史记录全部删除，然后访问一个网页。

```html
<div>
  <a href="https://www.baidu.com" target="_blank">我是一个链接</a>
  <a href="https://www.elegy.top:8889" target="_blank">我是一个链接</a>
</div>
```

```css
a:link {
  color: red;
}
```

由于此时浏览器没有记录，此时两个链接的`link`样式都生效了，链接的颜色都变成红色。

![](https://s1.ax1x.com/2020/10/10/06s1dx.png)

然后我们尝试访问第一个链接，也就是百度，发现百度的链接`link`样式已经不生效了。

![](https://s1.ax1x.com/2020/10/10/06yf3D.png)

这时再清除下浏览器的记录，再刷新这个页面，发现第一个链接重新的生效了`link`的样式。

![](https://i.loli.net/2020/10/10/IT8ZK3vcR64UQ5N.gif)

## `a:visited`

MDN 上解释`:visited`为：

> 表示用户已访问过的链接。

可以很容易的想到，他和`:link`是一对的，一个表示未访问过，一个表示访问过了。

可以修改 css 来查看效果。

```css
a:link {
  color: red;
}
a:visited {
  color: blue;
}
```

还是先把记录全部删除，这时两个链接都是红色，表示都还没访问过。

![](https://i.loli.net/2020/10/10/NKYw3kU5WX1QhOm.png)

然后访问第一个链接之后，发现百度的链接变成了蓝色，`visited`的样式生效了。

![](https://i.loli.net/2020/10/10/p3Nd5QsgoM7aHxI.png)

由于它和`:link`的关系是**互斥**的，也就是一个页面要么被访问过，要么还没被访问过。

所以这两个的**先后顺序对页面无影响**。

## `a:focus`

`:focus`指通过 tab 键来聚焦到`a`链接上时的样式。

```css
a:focus {
  color: red;
}
```

![](https://i.loli.net/2020/10/11/7aY4Vtyed2KrAJE.gif)

## `a:hover`

`:hover`指通过鼠标指针，也就是光标指向连接时的样式

```css
a:hover {
  color: orange;
}
```

![](https://i.loli.net/2020/10/11/5MdTvBEDfbUVt7c.gif)

那么这个和`:focus`的权重哪个重呢？

我们先写`:focus`再写`:hover`，看看效果：

```css
a:focus {
  color: red;
}
a:hover {
  color: orange;
}
```

![](https://i.loli.net/2020/10/11/4KZFtWOGVo6b15S.gif)

发现`:hover`和`:focus`都可以按照预期显示出来。

调换一下顺序看看。

![](https://i.loli.net/2020/10/11/WQs6S2TJPmH7rK1.gif)

发现只有`:focus`的样式生效了，但是`:hover`样式没了，也就是被`:focus`覆盖了。

总结下来就是如果想要两者都可以生效的话，应该先写`:focus`再写`:hover`。

## `a:active`

`:active`表示用户按下鼠标不松开时的样式。

```css
a:active {
  background-color: darkred;
  color: white;
}
```

![](https://i.loli.net/2020/10/11/Y6dobiv4HfkZEID.gif)

那么这个和前面两个的顺序应该是怎么样的呢。

先试试先`:focus`再`:active`。

```css
a:focus {
  background-color: black;
  color: white;
}
a:active {
  background-color: darkred;
  color: white;
}
```

![](https://i.loli.net/2020/10/11/2BNIWaXErgMhtbZ.gif)

发现可以按照预期显示。

反过来看看。

![](https://i.loli.net/2020/10/11/v93dAEq2WTOaJDi.gif)

发现`:focus`覆盖了`:active`，无法显示`:active`的样式。

所以如果要使得两者正常显示，应该先先`:focus`再写`:active`。

接下来比较下`:hover`和`:active`的情况。

先写`:hover`再写`:active`。

```css
a:hover {
  background-color: black;
  color: white;
}
a:active {
  background-color: darkred;
  color: white;
}
```

![](https://i.loli.net/2020/10/12/TApeq2fZO8iLIXr.gif)

发现可以正常显示两者的样式。

反过来试试。

![](https://i.loli.net/2020/10/12/FQunP3AHXz6bTpZ.gif)

发现无法显示`:active`的样式。

综上，这三者的书写顺序为`:focus` -> `:hover` -> `:active`，才能够正常地显示出样式。

那么这三者和`:link`和`:visited`的顺序有无关系呢。

还是一样，先写`:link`然后写`:focus`。

```css
a:link {
  background-color: darkred;
  color: white;
}
a:focus {
  background-color: black;
  color: white;
}
```

![](https://i.loli.net/2020/10/12/BZ6qzYLenkroJOh.gif)

发现可以正常地显示两者的样式。

反过来测试。

![](https://i.loli.net/2020/10/12/hYHQ8KDj1M4LpEA.gif)

你可能觉得上面是张静态图片，其实是一张 gif（看左边中间那里有地址在闪动），通过 tab 来聚焦不同地地址时，并没有出现样式的切换。

所以`:link`要写在`:focus`前面，才能确保两者的样式可以展示出来。

然后以此的用这种方法测试`:link`,`:visited`和其他两者的先后关系。

最后可以得出，以`:link`/`:visited`->`:focus`->`:hover`->`:active`的顺序来书写`css`

才能很好地保证样式可以生效（**不被后者覆盖**）。

不过在 MDN 上推荐`:link`->`:visited`的顺序编写，因为`:visited`可能会被后写的`:link`覆盖，不过在测试中没有出现这种情况...

所以总结到最后，`:link`->`:visited`->`:focus`->`:hover`->`:active`就是书写 a 标签伪类的顺序了。

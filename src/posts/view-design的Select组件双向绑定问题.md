---
title: view-design的Select组件双向绑定问题
key: 1634348186date: 2021-10-16 09:36:26
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
 - Vue
 - view-design
 - element-ui
categories:
 - 编程
---


# 前言

view-design 中 `Select` 组件在 `mounted` 中双向绑定失效问题。

<!-- more -->

# DEMO

这里列出了三个 DEMO，分别是

- element 的 `Select` 组件，直接在 `mounted` 钩子内修改 `v-model` 绑定的值
- view-design 的 `Select` 组件，直接在 `mounted` 钩子内修改 `v-model` 绑定的值
- view-design 的 `Select` 组件，在 `mounted` 钩子内使用 `nextTicket` 修改 `v-model` 绑定的值

首先可以看下 element 里面的 `Select` 组件

![](https://z3.ax1x.com/2021/10/16/5GVIqU.png)

codesandbox: [element-demo](https://codesandbox.io/s/zen-sanderson-bxdgo)

虽然返回的 `data` 的 `model` 值为`val-1`，但是在 `mounted` 中的修改为`val-2`也一致的对应到了 dom 中

接着是 view-design 里面的 `Select` 组件

![](https://z3.ax1x.com/2021/10/16/5Gei0U.png)

codesandbox: [view-design-demo](https://codesandbox.io/s/intelligent-knuth-0dh71)

`mounted` 上对 `model` 的修改并没有同步到 dom

解决方法是在更改的位置包一个`nextTicket`

![](https://z3.ax1x.com/2021/10/16/5GeUjP.png)

codesandbox: [view-design-demo-fix](https://codesandbox.io/s/empty-brook-6x9m5)

# 后记

个人觉得从心智模型上说，element 的方式才是正确的，view-design 应该是内部存在逻辑错误，漏掉了值的更新

话说 view-design 的 `Select` 组件 bug 是真的多啊，github 上一堆的 issues

上面写到的这个情况在最新的 `4.6.1` 依然存在，甚至在 `4.7.0-beta.10` 也存在

所以，选择 UI 框架真的太重要了

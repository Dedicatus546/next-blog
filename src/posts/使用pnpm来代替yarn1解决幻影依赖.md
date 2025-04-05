---
title: 使用pnpm来代替yarn1解决幻影依赖
key: 1639102971date: 2021-12-10 10:22:51
updated: 2023-02-13 18:28:44
tags:
 - npm
 - yarn
 - pnpm
 - node_modules
categories:
 - 编程
---


# 前言

之前在使用 `vue` 的 `pinia` 的时候出现的问题

使用 `pnpm` 来代替 `yarn1` 解决幻影依赖

<!-- more -->

# 正文

## 什么是 `Phantom dependencies` 幻影依赖

> 一个库使用了不属于其 `dependencies` 里的 `Package` 称之为 `Phantom dependencies`（幻影依赖、幽灵依赖、隐式依赖）

## 为什么会产生 `Phantom dependencies` 幻影依赖

在之前，我个人都是使用 `yarn1` 来进行依赖安装

而 `yarn1` 有个特性， 他会把依赖扁平到 `node_modules` 中

举个例子，如果现在我安装了依赖 `A` ， 依赖 `A` 依赖了依赖 `B` ，

那么，依赖 `B` 并不会安装到依赖 `A` 文件夹的 `node_modules` 中，即 `node_modules/A/node_modules/B`

而是安装到根 `node_modules` 中，即 `node_modules/B`

## `Phantom dependencies` 幻影依赖带来的问题

在 `package.json` 中并没有安装依赖 `B`， 但是在代码中却可以引用到 `B` 导出的功能

并且打包并不会造成错误，因为依赖 `B` 确实存在 `node_modules` 目录下

但是如果此时删除依赖 `A` ，那么项目中使用到依赖 `B` 的代码就会报错， 因为依赖 `B` 一同被删除了

## 代码复现

我们新建一个 `vite + vue3` 的项目，然后把初始的依赖给安装了

这时 `node_modules` 长这样

![](https://s4.ax1x.com/2021/12/12/oHbdSO.png)

可以看到这时候已经出现幻影依赖了，像 `rollup` ， `postcss` ， `esbuild` 等都是不存在 `package.json` 中

但是代码中却可以引用到

![](https://s4.ax1x.com/2021/12/12/oHqx8f.png)

并且运行正常

![](https://s4.ax1x.com/2021/12/12/oHLPbj.png)

## 问题解决

知道出现这个问题的原因是 `yarn1` 本身扁平依赖之后

我们需要换一个包管理器，这里选择了 `pnpm` 

`pnpm` 依然会扁平化依赖，但是却不会直接出现在根 `node_modules` 下

而是 `node_modules/.pnpm`

![](https://s4.ax1x.com/2021/12/12/oHOo0H.png)

在安装完依赖之后，我们可以看到 `node_modules` 下非常干净

![](https://s4.ax1x.com/2021/12/12/oHOQl8.png)

重新运行项目，发现已经无法启动了，提示找不到特定的依赖，幻影依赖这个问题，就被解决了

![](https://s4.ax1x.com/2021/12/12/oHOgt1.png)
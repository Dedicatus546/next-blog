---
title: 使用 patch-package 来修改 node_modules 里的代码
tags:
  - patch-package
  - node_modules
categories:
  - 编程
key: 1720663516date: 2024-07-11 10:05:16
updated: 2024-07-11 10:05:16
---

# 前言

使用 patch-package 来修改 node_modules 文件夹里的代码。

<!-- more -->

搬砖的过程中，如果我们需要修改某些库的一些行为，一般的情况下我们会通过包装（代理）来实现。

但这么做能修改的范围就比较小了，一般都是在库的逻辑执行后，或者在执行前写一些代码。

而想要修改执行过程就显得捉襟见肘了。

而默认下我们又不能直接去修改 node_modules 的代码，因为 node_modules 一般不会包含在 git 仓库中，在多人协同时无法很好地同步对 node_modules 的修改。

而 patch-package 这个库，则让修改源码成为了可能。

# 正文

前面我们说过，我们无法修改 node_modules 代码的原因是它一般不被包含到 git 仓库中。

一般 node_modules 都是由工友拉下仓库然后通过 `npm i` 来生成的。

而 patch-package 的做法是，为修改的 node_modules 文件生成一个 patch 文件，来描述修改的内容，这个文件不在 node_modules 内，会被包含到 git 仓库中，在工友拉下代码后，执行某些操作来将这个 patch 应用到 node_modules 中，从而实现对 node_modules 的修改。

## 安装

```shell
pnpm add patch-package -D
```

## 使用

- 修改 node_modules 中某个包的内容。
- 执行 `npx patch-package [修改的包名]` ，这时会在根目录的 patch 目录下生成一个对应包的 patch 文件。
- 将这个文件提交到 git 仓库中。

当另一个工友拉取代码后，只需要在安装好依赖后，执行：

```shell
npx patch-package
```

即可将所有的 patch 文件应用到 node_modules 内。

## 例子

这里我们用 view-design 的 `DatePicker` 组件作例子。

在默认的源代码中， `DatePicker` 支持使用默认的插槽来替换日期的显示。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/11/20240711062439973.avif)

但是我们却无法简单的复用内部计算好的值，比如 `visualValue` 和 `itemDisabled` 等，因为它并没有把这些变量通过插槽抛出。

所以这里我们可以稍微改动下代码，这里我们注入 `visualValue` 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/11/20240711063313447.avif)

然后我们执行 `patch-package view-design` ，会发现生成了一个 patch 文件夹和一个 patch 文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/11/20240711063424839.avif)

而这个 patch 文件，其实就是通过 `git-diff` 将两者的差距保存下来了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/07/11/20240711063459960.avif)

最后，我们可以把改动去掉，然后执行 `patch-package` ，会发现改动会重新生效。

# 后记

对于 CI 的话，需要在 `package.json` 中将 `postinstall` 设置为 `patch-package` ，这样当 `npm i` 执行后，就会自动执行这段逻辑了。

```json
// package.json
{
  // ...
  "scripts": {
    // ...
    "postinstall": "patch-package"
  }
  // ...
}
```
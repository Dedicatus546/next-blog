---
title: VSCode 远程调试 Node 程序 Rg 进程 CPU 占用过高问题
key: 1658226718date: 2022-07-19 18:31:58
updated: 2023-02-13 18:28:45
tags:
- VSCode
- Docker
- Node
categories:
- 编程
---


# 前言

记录一次 `VSCode` 远程调试 `Node` 程序 `Rg` 进程 `CPU` 占用过高问题

<!-- more -->

感觉很长时间没写帖子了，一方面不知道要写什么了，一方面工作上开始写 `Node` 和 `Java` 

刚开始连代码都看的不是很懂，心里憔悴，所幸还是渐渐能看懂代码了，也解决了一些 `bug` 和开始着手一些后端上的需求

# 正文

在 `VSCode` 上，对 `Node` 程序的调试有两种

- 一种是启动时就指定以调试模式启动，这种模式为 `launch`
- 一种是在启动程序之后把调试程序注入到对应程序中，这种模式为 `attach`

由于公司的项目不只是 `Node` ，还有 `Java` ，比较复杂，所以技术总监那边让我用 `attach` 方式来调试

步骤很简单，`Ctrl + Shift + p` 然后搜索 `attach` 选择 

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232211211.avif)

然后就能看到对应的 `node` 程序

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232212380.avif)

调试步骤其实不难，但是问题是当时我调试的时候电脑 `CPU` 占用一直 `100%`

而且断点没生效，我就用 `top` 看了下进程，发现是 `VSCode` 的 `Rg` 一直在占用 `CPU`

我就去百度了一下，很多的文章都是说关掉 `setting` 里面的 `Follow Symlinks` ，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232205578.avif)

但是没有效果

最后测试出来是工作区的问题，我选择了 `/` 作为工作区

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232206976.avif)

当调试的时候，`VSCode` 应该是会监听这些文件来进行某些操作

而 `/` 下包含了系统所有文件，导致 `Rg` 进程就一直占用 `100%` 了

结局办法是，限制工作区间的范围，`Ctrl + Shift + p` ，然后输入 `add folder`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232207223.avif)

然后限制到项目文件夹即可，这时候我们有两个工作区

我们把 `/` 这个工作区删除即可，右键工作区就可以看到相应的选项

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232208631.avif)

再次调试之后，占用就正常了

# 后记

虽然 `Rg` 不占用 `CPU` 了，但是看起来我的笔记本性能不是很行了，`CPU` 很容易占用 `70% - 80%`

好想买个新的...
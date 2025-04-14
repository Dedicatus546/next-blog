---
title: 记一次github分支合并没有新建节点问题
key: 1637660118date: 2021-11-23 17:35:18
updated: 2023-02-13 18:28:45
tags:
- git-branch
- git
categories:
- 编程
---


# 前言

记一次 `github` 分支合并没有新建节点问题

<!-- more -->

# 正文

## 场景复现

虽然基本上是我一个人开发，但是还是要养成建分支的习惯

一方面熟悉命令行操作，一方面也可以养成自己的一套工作流

现在我个人的工作流是：

主分支 `master`

修复 `bug` 直接在 `master` 上进行 `commit`

新的需求的话就创建新的分支 `feat/XXX需求`

然后在这个分支上进行开发，开发完成之后，在 `master` 分支上执行 `git merge feat/XXX需求`

前几次基本没什么问题，但是最近的一次出现了 `merge` 没有额外的节点问题

我们可以创建一个项目来复现这个现象

![](https://z3.ax1x.com/2021/11/23/o9kRzD.png)

从图里可以看到，我们进行了第一次提交

接着我们创建一个新的分支 `git checkout -b feat/01需求`

然后修改 `README.md`

![](https://z3.ax1x.com/2021/11/23/o9AkSU.png)

从图上可以看到

此时还没有提交，那么现在我们执行 `git add . && git commit -m "feat: 完成01需求"`

这时候我们执行 `git log --oneline --graph` 来查看提交情况，如下（这里使用 `vscode` 的插件可视化查看）

![](https://s4.ax1x.com/2021/12/11/oHK9mQ.png)

然后我们切换为 `master` 分支，执行 `git merge feat/01需求`

然后再执行 `git log --oneline --graph` 查看提交情况

![](https://s4.ax1x.com/2021/12/11/oHuOYt.png)

此时的提交记录是扁平的

但是我们想要的样子是想入如下图所示的

![](https://s4.ax1x.com/2021/12/11/oHKZlT.png)

那这是为什么呢，在 `merge` 操作的时候我们可以看到命令行输了了 `Fast-forward` 这个字符串

这是 `merge` 的一个模式

在 `git` 中有这么几种 `merge` 模式

- `--ff` `fast-forward` 默认的合并模式
- `--no-ff` `no-fast-forward` 也就是 `fast-forward` 的相反模式
- `--ff-only` 只允许 `fast-forward` ，如果无法使用则报错
- `--squash` 压缩 `commit` 信息， 和 `no-ff` 互斥

## 什么是 `fast-forward` 模式

简单点讲：就是如果 `merge` 可以直接移动指针的话，此时就是 `fast-forward` 模式

可以通过一个简单的例子来说明

- 此时存在一个 `master` 分支
- 在 `master` 分支上新建了一个 `dev` 分支
- 在 `dev` 上进行提交
- 回到 `master` 
- 把 `dev` 合并到 `master` 上

此时 `master` 并没有新的提交，可以直接把 `master` 的指针直接指向 `dev` 的最后一次 `commit` 的节点

此时就是 `fast-forward` 模式

这种模式不会生成一个 `commit` 信息，意味着如果删除 `dev` 分支，那么提交信息会消失

我们可以用之前那个复现的 demo 来测试

执行 `git branch -D feat/01需求` 来删除 `feat/01需求` 分支

![](https://s4.ax1x.com/2021/12/11/oH1N8I.png)

此时分支信息已经不见了

如果我们不适用 `ff` ，那么删除分支不会影响到提交信息，因为合并产生了一个节点

删除分支可以理解为只是删除一个指针而已

不使用 `ff` 删除 `feat/01需求` 分支后如下

![](https://s4.ax1x.com/2021/12/11/oH3Sde.png)

此时依然可以看出来是从哪个分支进行合并的，分支的删除不影响提交的信息

## 什么是 `squash` 模式

有时候我们新开一个 `fix` 分支，修复了一些 `bug`

但这个分支其实我们并不想提交到远端，我们只想把修改的代码提交到 `master` 上，然后生成一次提交而已

`--squash` 就可以完成这种功能

`--squash` 并不会进行指针的移动（`--ff`），也不会进行分支的合并（`--no-ff`）

它只是把 `fix` 分支上的代码 `add` 到 `master` 上而已

然后在 `master` 上就可以使用 `git commit` 来进行提交

我们可以用之前的 `demo` 来测试这个参数

此时的 `graph` 如下

![](https://s4.ax1x.com/2021/12/12/oHdsX9.png)

在 `master` 上执行 `git merge feat/01 --squash`

![](https://s4.ax1x.com/2021/12/12/oH0p8O.png)

此时生成一个未 `commit` 的状态

此时就可以使用 `git commit` 来进行提交了

![](https://s4.ax1x.com/2021/12/12/oH0kqA.png)

# 参考文章

- [使用git merge --squash，让commit变得优雅 - CSDN](https://blog.csdn.net/coder1994/article/details/80639404)
- [git-merge完全解析 - 简书](https://www.jianshu.com/p/58a166f24c81)
- [一个成功的Git分支模型 - 简书](https://www.jianshu.com/p/b357df6794e3)

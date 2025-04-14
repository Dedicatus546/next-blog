---
title: git中忽略文件且不添加到.gitignore文件
key: 1641372699date: 2022-01-05 16:51:39
updated: 2023-02-13 18:28:44
tags:
 - git
 - .gitignore
categories:
 - 编程
---


# 前言

记一次添加 `git` 忽略文件不添加到 `.gitignore` 中

<!-- more -->

# 正文

写一些需求的时候，有时会随手创建一些 `test.js` 来跑一些代码

`git add` 然后 `commit` 提交的时候，很容易忘记把它排除掉

但是又不想因为这个文件污染 `.gitignore` 文件

这时候，就要使用另一种方式来添加要排除的文件

在 `git` 中，每个项目的根目录下都会有 `.git` 文件夹

![](https://s4.ax1x.com/2022/01/10/7VFPdP.png)

由于这个文件夹是隐藏的，所以可能你会看不到

这时候就要设置资源管理器显示隐藏目录了（这里我使用的是window11）

![](https://s4.ax1x.com/2022/01/10/7VkVk6.png)

找个 `.git` 文件夹之后，进入这个文件夹

在这个文件夹里面，找到 `info/exclude`

![](https://s4.ax1x.com/2022/01/10/7Vk37t.png)

然后用记事本打开它，发现是个空文件

不过顶部有一些注释

```text
# git ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~
```

可以看到，最后两行给了我们两个例子

- `*.[oa]`
- `*~`

在注释中提到这是 `C` 项目可能会用到的注释

当然，我是个切图仔，所以添加的一般是一些 `test` 的 `js` 文件

所以我们可以加一行

- `*.test.local.js`

![](https://s4.ax1x.com/2022/01/10/7VATqs.png)

然后 `ctrl + s` 保存后关闭

回到 `vscode` 中，我们建一个 `1.test.local.js` ，随便写点内容

![](https://s4.ax1x.com/2022/01/10/7VE1FP.png)

然后使用 `git status` 查看工作区的状态

发现此时工作区是干净的，也就是 `git` 没有对 `1.test.local.js` 这个文件进行追踪

当然目前这种添加是项目级别的

那我要是想全部的项目都排除某个文件，那要如何操作呢

这时候需要配置 `git config` 在 `git config` 中，我们可以指定全局的 `.gitignore` 文件

`git-config`文档：[git-config](http://git-scm.com/docs/git-config)

进上面的地址然后 `ctrl + f` 搜索 `core.excludesFile` ，然后就可以找到下面这段内容

> Specifies the pathname to the file that contains patterns to describe paths that are not meant to be tracked, in addition to `.gitignore` (per-directory) and `.git/info/exclude`. 
> Defaults to `$XDG_CONFIG_HOME/git/ignore`. 
> If `$XDG_CONFIG_HOME` is either not set or empty, `$HOME/.config/git/ignore` is used instead.

指定一个除了每个项目下的 `.gitignore` 和 `.git/info/exclude` 之外的不被 `git` 跟踪的文件
默认的位置为 `$XDG_CONFIG_HOME/git/ignore`
如果 `$XDG_CONFIG_HOME` 环境变量不存在，则使用 `$HOME/.config/git/ignore`

由于我电脑上 `git` 是在 `window10` 的时候装的，然后期间我又格盘装了 `window11`

所以 `git` 的环境变量基本没了，这里就试着指定一个绝对路径来试试

在控制台下输入 `git config --global core.excludesFile E:\ignore` 

为全局的 `git` 配置 `core.excludesFile`

然后我们在 `E:\ignore` 随便写个规则

就写 `index.js` ，可恶的 `index.js` 今天定让你有来无回！

先通过 `git config -l` 看看当前的配置

![](https://s4.ax1x.com/2022/01/10/7VueQf.png)

没问题 `E:\ignore` 已经在配置中的

然后写个 `index.js`，然后依然执行 `git status` 查看工作区的状态

![](https://s4.ax1x.com/2022/01/10/7VugOO.png)

一个干净的工作区，哈哈哈哈哈

# 后记

记得要去掉配置，不然代码没提交上去不关我事啊

删掉配置的指令 `git config --global --unset core.excludesFile`

然后再次 `git status` ， `index.js` 现在就可以被添加了

![](https://s4.ax1x.com/2022/01/10/7VubX8.png)
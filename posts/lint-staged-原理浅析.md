---
title: lint-staged 原理浅析
key: 1661308814date: 2022-08-24 10:40:14
updated: 2023-02-13 18:28:44
tags:
- lint-staged
categories:
- 编程
---


# 前言

没有经过格式语法校验的代码，就跟电子烟不抽悦柯5是一样的，没有灵魂

<p style="text-align: right">——————节选自《纯真的代码》，作者：鲁迅</p>

<!-- more -->

前面我们有讲过使用笨方法来完成对 `hexo` 帖子的 `updated` 字段进行更新

如果你不知道这个笨方法，你可以点击{% post_link 使用-husky-来为帖子增加更新时间 此处 %}一键起飞到该帖子

当然，对于编程来说，我们可以使用 `lint-staged` 以及 `eslint` 完成只对暂存区文件进行格式化

所以，这篇主要浅析一下 `lint-staged` 是如何只对暂存区文件进行格式化的

了解完之后，我们就可以编写和 `eslint` 一样的工具来对 `hexo` 的帖子的 `updated` 字段进行更新了，不必再关心 `git` 操作方面的逻辑

# 正文

首先，我们当然要把代码拉下了，项目地址：[lint-staged](https://github.com/okonet/lint-staged)

在 `lib` 文件夹下面就是全部的源代码文件了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/26/202208261612323.avif)

当然，我们只需要重点关注以下几个文件

- `execGit.js`
- `getStagedFiles.js`
- `gitWorkflow.js`
- `parseGitZOutput.js`

这几个文件可以说涵盖了核心的逻辑，其他的文件很多都是在处理控制台输出相关的逻辑

当然，我们会一个个文件来讲

## execGit.js

不同于之前我们使用的 `shelljs` ， `lint-staged` 使用了 `execa` 库来作为在 `node` 上执行 `git` 命令的工具

```javascript
export const execGit = async (cmd, options = {}) => {
  debugLog('Running git command', cmd)
  try {
    const { stdout } = await execa('git', GIT_GLOBAL_OPTIONS.concat(cmd), {
      ...options,
      all: true,
      cwd: options.cwd || process.cwd(),
    })
    return stdout
  } catch ({ all }) {
    throw new Error(all)
  }
}
```

这段的核心就是 `const { stdout } = await execa('git')` ，意思就是执行一个 `git` 命令，然后返回命令输出的内容

## parseGitZOutput.js

对比之前，我们使用 `git status --porcelain` 按行来处理， `lint-staged` 就简单多了，直接 `git status -z` 然后根据空字符分割

```javascript
export const parseGitZOutput = (input) =>
  input
    ? input
        .replace(/\u0000$/, '') // eslint-disable-line no-control-regex
        .split('\u0000')
    : []
```

这里确实学到了，之前确实不知道怎么通过空字符 `split` ，原来空字符的 `unicode` 编码为 `\u0000` ，好吧，是我太菜了

这里要主要通过 `replace` 来把最后一个空字符替换掉，然后再通过空字符分割

`git status -z` 会在最后一个文件后面跟上空字符，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/26/202208261647946.avif)

如果不替换，会产生空的项，即 `'1|2|3|'.split('|')` 会返回 `['1', '2', '3', '']`,

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/26/202208261703772.avif)

## getStagedFiles.js

相比于之前我们使用 `git status` 来根据头两个字符标记来判断当前在暂存区的文件， `lint-staged` 使用了 `git diff`

```javascript
export const getStagedFiles = async ({ cwd = process.cwd(), diff, diffFilter } = {}) => {
  try {
    const lines = await execGit(getDiffCommand(diff, diffFilter), { cwd })
    if (!lines) return []

    return parseGitZOutput(lines).map((file) => normalize(path.resolve(cwd, file)))
  } catch {
    return null
  }
}
```

上面执行的 `git` 命令默认情况下其实就是 `git diff --name-only -z --diff-filter=ACMR --staged`

这条命令就是输出当前暂存区的文件列表

其中 `--name-only` 只输出文件名，并且输出是 `UTF-8` 的编码的，也就是支持非英文文件名，不用像之前一样去设置 `core.quotepath = false`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280043839.avif)

`--staged` 就是告诉 `git` 我要比较的是暂存区与 `Head` 的差异，而不是工作区与暂存区的差异，如果不加，那么比较的就是工作区与暂存区的差异

`--diff-filter` 指定需要过滤的文件， `ACMR` 就对应了四种文件， `Added`, `Copied`, `Modified`, `Renamed` ，这里没有 `D` ，因为对删除文件没必要去更改它的内容

当然，也可以指定小写，那么这个选项就会变成排除选项，即 `--diff-filter=acmr` 就是排除这四类的文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280052189.avif)

这里可以看 `git` 的文档，有更详细的介绍，这里就简单的讲这行命令的功能

我们可以测试一下，这里我们 `add` 了 `1.txt` 这个文件，然后再往 `1.txt` 里面添加了一行，此时 `git status` 如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280113924.avif)

执行 `git diff --name-only -z --diff-filter=ACMR --staged` ，只输出了 `1.txt`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280100168.avif)

执行 `git diff --name-only -z --diff-filter=ACMR` ，还是只输出了 `1.txt`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280127126.avif)

你可能会疑惑为啥会一样，我们只要去掉 `--name-only` 在输出，就可以明白了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280129357.avif)

## gitWorkflow.js

看这个文件之前，我们需要先去看 `runAll.js` 这个文件，这个文件表明了 `gitWorkflow.js` 内方法的调用顺序

我们只需关心如下的代码

```javascript
export const runAll = async () => {
  // ...
  
  const git = new GitWorkflow({
    allowEmpty,
    gitConfigDir,
    gitDir,
    matchedFileChunks,
    diff,
    diffFilter,
  })

  const runner = new Listr(
    [
      {
        title: 'Preparing lint-staged...',
        task: (ctx) => git.prepare(ctx),
      },
      {
        title: 'Hiding unstaged changes to partially staged files...',
        task: (ctx) => git.hideUnstagedChanges(ctx),
        enabled: hasPartiallyStagedFiles,
      },
      {
        title: `Running tasks for staged files...`,
        task: (ctx, task) => task.newListr(listrTasks, { concurrent }),
        skip: () => listrTasks.every((task) => task.skip()),
      },
      {
        title: 'Applying modifications from tasks...',
        task: (ctx) => git.applyModifications(ctx),
        skip: applyModificationsSkipped,
      },
      {
        title: 'Restoring unstaged changes to partially staged files...',
        task: (ctx) => git.restoreUnstagedChanges(ctx),
        enabled: hasPartiallyStagedFiles,
        skip: restoreUnstagedChangesSkipped,
      },
      {
        title: 'Reverting to original state because of errors...',
        task: (ctx) => git.restoreOriginalState(ctx),
        enabled: restoreOriginalStateEnabled,
        skip: restoreOriginalStateSkipped,
      },
      {
        title: 'Cleaning up temporary files...',
        task: (ctx) => git.cleanup(ctx),
        enabled: cleanupEnabled,
        skip: cleanupSkipped,
      },
    ],
    listrOptions
  )

  await runner.run()
  // ...
}
```

其中我们最关心的就是如何把工作区和暂存区的区别保存以及恢复，也就是上图代码中的

- Hiding unstaged changes to partially staged files...
- Restoring unstaged changes to partially staged files...

这两个过程

我们先看 `hideUnstagedChanges` 这段代码

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280158420.avif)

可以发现他只是把工作区的改变丢弃了而已

可能你会疑惑，执行这个命令工作区的改变不就丢失了吗，到时候怎么恢复呢？

没错，在 `prepare` 方法中，有对工作区的改变进行保存

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280202650.avif)

没错，这里的核心就是执行的这段 `git` 命令，这段命令为 

`git diff --binary --unified=0 --no-color --no-ext-diff --src-prefix=a/ --dst-prefix=b/ --patch --submodule=short --output .git/lint-staged_unstaged.patch`

这个命令生成了一个 `patch` 文件，保存了当前工作区与暂存区的区别

这里面最重要的参数就是 `--unified=0` ，这个参数官方文档的解释如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280210852.avif)

生成指定上下文行数的 `diff` ，emmm，有点难懂

我们可以做个小测试，我们先往版本库里面提交一个文件，内容如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280219135.avif)

然后我们往中间插入一行，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280220646.avif)

这里不输出 `patch` 文件，我们直接打印到控制台

执行 `git diff --unified=0`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280222925.avif)

执行 `git diff --unified=3`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280223005.avif)

这里我们发现，区别就是增加的行上下会出现文件原本的行

那这有什么用呢？

其实这跟后面要讲到的 `git apply` 命令有关，这里我们先不管，我们只要知道，我们已经保存了工作区与暂存区的区别了

那么 `hideUnstagedChanges` 函数中，我们就可以使用 `checkout --force` 来把工作区的改变给丢掉

接下来的步骤我想你也应该懂了

丢掉工作区的改变之后，对文件进行 `eslint`（或者其他的命令），然后把文件 `add` 进暂存区（ `eslint` 可能会改变文件）

然后再把生成的 `patch` 文件通过某种方式恢复到工作区中，接着就是我们执行的 `commit` 命令了（一般我们都是在 `pre-commit` 中执行 `lint-staged` ）

接下来我们就要看 `restoreUnstagedChanges` 这个函数了，从名字上看我们就知道它重新把之前工作区的改变恢复到了工作区（之前执行 `checkout --force` 丢弃了，但是使用了 `git diff` 生成了 `patch` 文件），代码如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280235579.avif)

这里的 `catch` 内容都不用看，不是重点，重点是这个 `git` 命令

这个命令为 `git apply -v --whitespace=nowarn --recount --unidiff-zero .git/lint-staged_unstaged.patch`

没错，这个命令就是把我们之前的保存下来的 `patch` 文件给恢复到工作区

这里面最重要的参数就是 `--unidiff-zero` ，官方文档解释如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/08/28/202208280240210.avif)

这段的意思通俗点讲就是，`git apply` 在合并的时候，会至少查找一行原本就存在的代码来作为依据来应用这个改变，因为这样子做安全，但如果你使用了 `git diff --unified=0` 生成 `patch` ，那么应用会失败，因为这样的 `patch` 没有这些依据行，为了绕过这个检查，使用 `--unidiff-zero` 即可

那为什么我们要关掉这个验证呢，其实很容易理解，我们可能会改变暂存区文件的某些行，而如果生成的 `patch` 刚好依赖了这些行，那么 `apply` 操作就会失败，根本上我们不必在意暂存区文件的改变，我们仅仅只是需要保存当前工作区的改变，所以不要依赖额外的行来进行 `apply` 

到这，我们基本就理清了 `lint-staged` 的原理，如下

- 使用 `git diff` 获取暂存区文件列表
- 如果暂存区文件列表中存在还未 `add` 的修改，使用 `git diff` 生成 `patch` ，这里生成的 `patch` 不要附带没被修改的行
- 对存在还未 `add` 的修改的文件使用 `git checkout --force` 丢弃工作区的修改
- 应用用户设置的命令，比如 `eslint` ， `prettier`
- 重新 `add` 文件到暂存区（ `eslint` ， `prettier` 可能会对文件进行修改）
- 把生成的 `patch` 文件通过 `git apply` 重新应用到工作区中，这里的 `apply` 要关掉行验证

# 后记

之前我有想过使用 `git stash` 来保存工作区与暂存区的区别，不过 `git stash` 只能保存**工作区+暂存区**或**暂存区**的改变，很明显无法符合**只保存工作区的改变**这一需求

当然本文并没有很详细的介绍 `lint-staged` 的整个实现原理，比如子模块的处理，`apply` 失败的处理，以及命令行输出的处理

嘛，我觉得这些都不是重要的部分，很多时候其实大家的操作都是很简单的，明白最核心的原理即可

最后，请允许我对该工作作者进行一个轰轰烈烈地赞美，“牛逼”，强烈建议每个项目都引入，没统一风格的代码坚决不要放入版本库中，两三种风格就已经很讨厌了，有些人写代码还随心所欲，一会缩进，一会不缩进，维护起来跟吃了屎一样难受...
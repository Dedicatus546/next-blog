---
title: 基于 husky lint-staged 自动更新帖子 date 和 updated 字段
key: 1662217142date: 2022-09-03 22:59:02
updated: 2023-02-13 18:28:44
tags:
- husky
- lint-staged
- hexo
categories:
- 编程
---



# 前言

基于 `husky`, `lint-staged` 自动更新帖子 `date` 和 `updated` 字段

<!-- more -->

# 正文

前面我们浅析了 `lint-staged` 的原理，现在，我们就可以利用 `lint-staged` 来在 `commit` 前对贴字进行更新了

这里我们新建一个项目，然后发布到 `npm` 上

首先，我们需要生产一个命令行的文件，这样我们就能使用 `npx XXXX` 来执行这个命令

我们在项目中建立一个 `bin` 文件夹，然后新建一个 `hexo-update-time.js` 文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032209328.avif)

之后我们需要在 `package.json` 文件中声明 `bin` 的位置，以及把 `bin` 文件添加到 `files` 字段中

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032211730.avif)

这样当我们安装之后，会在 `node_modules/.bin` 下生成一个可执行的文件（这里我是安装到我的博客项目中了）

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032212582.avif)

这里我们使用 `src` 作为源码的目录，所以也要包含在 `files` 字段下

到这里，前置步骤完成，接下来我们需要解决如何解析 `node` 后面携带的参数

这里我们使用的是 `commander` 库，它提供了一个非常方便的方式来解析参数，仓库地址：[tj/commander.js](https://github.com/tj/commander.js)

这里其实是库帮我们解析了 `process.argv` 这个参数列表，我们可以新建一个文件，内容如下

```javascript
console.log(process.argv);
```

然后使用 `node` 执行这个文件，附带一些参数

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032224033.avif)

可以发现 `process.argv` 就包含了 `node` 路径，执行文件地址，以及附带的参数

其实这里也可以不用 `commander` 的，因为实际上并不会用到命令行参数，实际上我们直接附带文件列表即可，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032226511.avif)

但是万一以后要用到参数了再改就麻烦了，所以这里引入 `commander` ，`hexo-update-time.js` 内容如下

```javascript
import { program } from "commander";

program.parse();

program.args.forEach(async (filepath) => {
  // TODO 这里处理文件逻辑
});
```

这里由于我们不使用参数，所以要通过 `program.args` 获取剩余的参数列表

到这里我们就可以编写核心的逻辑了，当然，核心逻辑和我们之前并没有什么不同

同样是读取文件，使用正则获取头部信息，替换头部信息的 `date` 和 `update` 字段，然后重新写回文件

这里我们新增逻辑来判断是否为第一次添加或者是否没有被 `git` 跟踪

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032236465.avif)

因为我们可能不配合 `lint-staged` 使用，所以需要判断

其他的逻辑就和之前的一样了

在写完之后我们需要 `publish` 到 `npm` 上，这里注意，如果之前使用了淘宝源，那么要切回 `npm` 源才能发布

这里我们需要注册一个 `npm` 的账号，执行 `npm publish` 之后会提示你输入账号密码，就可以成功上传了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032241566.avif)

然后我们在博客项目中安装 `husky`, `lint-staged` 以及 `hexo-update-time.js` 这三个依赖

执行 `npx huksy install` 注册钩子

执行 `npx husky add .husky/pre-commit "npm run lint-staged"` 添加一个 `pre-commit` 钩子

在 `package.json` 添加 `script`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032255770.avif)

在 `package.json` 配置 `lint-staged` 配置

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/03/202209032242130.avif)

这里我的逻辑是如果你是第一次 `add` ，那么 `commit` 时 `date` 和 `updated` 会更新到当前同一时刻，否则只有 `updated` 会添加到同一时刻

如果文件没有被 `git` 追踪（单独使用 `hexo-update-time` 命令），那么 `date` 和 `updated` 会更新到当前同一时刻

仓库地址：[Dedicatus546/hexo-update-time](https://github.com/Dedicatus546/hexo-update-time)

# 后记

如果你是本地生成静态文件之后提交到 `github` ，那么你完全没有必要使用这个插件，但是你就要承担仓库丢失的风险

即使你把 `md` 的仓库也放到了 `github` 上，但是重新拉取仓库会影响文件的 `modifyTime` 信息，导致 `updated` 字段错误显示

所以这个小工具只适用于开启了手动更新 `updated` 字段，解放每一次 `commit` 前需要手动更新 `updated` 字段的操作
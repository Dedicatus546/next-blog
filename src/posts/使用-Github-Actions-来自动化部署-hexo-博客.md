---
title: 使用 Github Actions 来自动化部署 hexo 博客
key: 1648026072date: 2022-03-23 17:01:12
updated: 2023-02-13 18:28:44
tags:
- hexo
- github actions
categories:
- 编程
---


# 前言

使用 `Github Actions` 来自动化部署 `hexo` 博客

<!-- more -->

之前的工作流为

- `hexo new "xxx"` 生成一个 `md` 文件
- 编写 `md` 文件
- `hexo generate` 生成 `docs` 文件夹
- `git add .` 添加所有文件
- `git push` 推送到 `github` 仓库

由于 `github` 仓库上设置 `docs` 文件夹为 `git-page` 的文件夹

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/23/202203231741803.gif)

所以推送结束之后也就完成了一次网站的更新

缺点

- 不够 `high level` （~~不是~~
- 每次都需要本地执行 `hexo generate` 进行帖子生成，严重浪费我的电脑性能 （~~不是~~
- 在 `git push` 之前容易忘记先 `hexo generate`

本着折腾的精神，就在网上找了下 `github actions` 相关的内容，然后就开始了这一次改造（捣鼓）

# 正文

首先我们要知道什么是 `github actions` 

在[官方文档](https://docs.github.com/cn/actions)中的解释如下：

> 在 GitHub Actions 的仓库中自动化、自定义和执行软件开发工作流程。 您可以发现、创建和共享操作以执行您喜欢的任何作业（包括 CI/CD），并将操作合并到完全自定义的工作流程中。

这里就要扯到 `CI/CD` 的内容了

## CI/CD

### CI

全称为 `continuous integration` ，中文表达为**持续集成**

简单点来解释就是：不断对提交到仓库的代码进行可配置化的自动的操作，比如测试，编译等等

### CD(delivery)

全称为 `continuous delivery` ，中文表达为**持续交付**

`CD` 可以理解为 `CI` 的后续，或者理解为 `CI` 的一种扩展

当 `CI` 走完流程（成功）之后， `CD` 会和 `CI` 一样，通过配置自动进行操作，而作为程序员，你需要的就只是点击“按钮”进行部署。

### CD(development)

全称为 `continuous development` ，中文表达为**持续部署**

这个 `CD(development)` 可以理解为 `CD(delivery)` 的一种特化

`CD(development)` 意味着无需程序员无需对部署流程进行干预了，也就是上文我们所说的按下“按钮”进行部署这个操作

一切都是自动的，当某个新特性完成之后， `CI` 进行自动测试，`CD(development)` 进行自动部署，然后用户就能够使用到有新特性的软件了。

这里放两个帖子的链接，我觉得讲的非常好：

- [理解 CI 和 CD 之间的区别（翻译）](https://www.cnblogs.com/tiantianbyconan/p/9713989.html)
- [CI/CD 的差异](https://zhuanlan.zhihu.com/p/64174663)

总而言之，无论是 `CI` ， `CD(delivery)` ， 还是 `CD(development)` ，其目的都是一样的。

就是解放程序员的双手，让程序员尽量降低参与可自动化的步骤的程度，一方面人就是容易犯错误的，另一方面可以让程序员更加专注于功能的实现。

## github actions

知道了 `CI/CD` 之后， `github actions` 理解起来就容易多了

也就是说， `github actions` 使得我们能够定义工作流（或者理解为脚本），然后自动地执行，这样能够实现 `CI` 或者 `CD` ，理解为一种工具即可。

## 编写 deploy.yml 文件

在 `github` 中，为了创建一个 `github actions` 工作流，需要在项目的根目录下建立一个 `.github` 文件夹

然后在里面建立 `workflows` 文件夹，在 `workflows` 就可以新建 `yml` 文件来创建一个工作流了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241154969.gif)

我这里建了一个 `deploy.yml`

然后我们就开始编写内容

首先要明白 `yml` 的语法

这里推荐菜鸟教程的 [YAML 入门教程](https://www.runoob.com/w3cnote/yaml-intro.html) ，大致看一下即可

以及 `github actions` 的官方文档：[GitHub Actions 快速入门](https://docs.github.com/cn/actions/quickstart)

了解大概之后，就可以开始编写工作流了

首先，我们期望的效果是每次 `push` 一个新的 `md` 

`github actions` 就帮我们执行 `hexo generate` 和 `hexo deploy`

然后把生成的 `docs` 文件夹提交到一个远程仓库

明白了这个过程之后，首要步骤就是告诉 `github actions` ，我要在 `push` 的时候做一些事情

```yaml
# name 随便起
name: deploy
# 在 master 分支 push 的时候
on:
  push:
    branches:
      - master
```

接着需要定义 `jobs` 来告诉 `github actions` 我要干什么

```yaml
jobs:
  # deploy 为一个任务的名字，可以随意的取
  deploy:
    # 运行在最新的 ubuntu 容器中
    runs-on: ubuntu-latest
    steps:
      # 定义这个任务的步骤
      - name: checkout repo
        # 使用封装好的一些 actions
        # 这里的 actions/checkout@v3 的作用为拉取代码到工作区
        uses: actions/checkout@v3
      
      # 缓存 pnpm 的包，提升构建速度
      - name: cache pnpm modules
        uses: actions/cache@v3
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-
      # 安装 pnpm
      - name: install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 6.32.3
      # 安装 node
      - name: setup node
        uses: actions/setup-node@v2
        # action 可提供的配置写在 with 下
        with:
          node-version: 16
      # 安装依赖
      - name: install deps
        # 这里为运行脚本，所以使用 run ，而不是 uses
        run: |
          pnpm install hexo-cli -g
          pnpm install
      # 生成文件
      - name: generate file
        run: |
          pnpm run clean
          pnpm run build
      # 配置 git 主要是使用 ssh 的方式来推送文件到远端仓库
      - name: set git config
        # 注入环境变量
        env:
          # 注入 ssh 的私钥
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh/
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          git config --global user.name 'Dedicatus546' 
          git config --global user.email '1607611087@qq.com'
      # 推送到远程
      - name: deploy
        run:
          pnpm run deploy
```

这里比较重要的是 `set git config` 这个步骤（这个名字是随便起的，主要用于描述这个步骤的功能）

因为我们在 `hexo` 的 `_config.yml` 中使用 `ssh` 的方式来对仓库进行操作的

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241507850.gif)

如果你已经使用了 `ssh` 来进行用户验证的话，所需要的配置就很简单

首先是找到当初生成的 `ssh` 文件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241517516.avif)

当初是通过在个人设置里面配置 `id_rsa.pub` （公钥），然后本地的 `id_rsa` （私钥）就可以配合完成 `ssh` 验证

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241521041.avif)

对于上述 `yml` 文件中的这一段脚本

```yaml
run: |
  mkdir -p ~/.ssh/
  echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
  chmod 600 ~/.ssh/id_rsa
  ssh-keyscan github.com >> ~/.ssh/known_hosts
```

可以理解为在容器里面配置了我们的私钥，这样就有了和本机一样的环境了

所以这里需要解决的就是如何把私钥安全的暴露给 `github actions` 了

直接写在脚本里面？当然可以，但是不安全，如果你的项目忘记设置为私有，那么别人就可以通过直接在 `yml` 拿到你的私钥

这样意味着就能控制你的 `github` 仓库了，后果非常的恐怖

所以这里正确的解决办法是进入项目的 `settings` 中，在 `secrets` 中添加一些变量，如下图所示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241525121.avif)

其中 `name` 可以随便起，但是要记住，这里我起的是 `DEPLOY_KEY` ， `value` 就对应你的 `ssh` 的私钥

然后回到 `yml` 代码中，就可以通过 `secrets.DEPLOY_KEY` 拿到对应的值了

```yml
- name: set git config
  # 注入环境变量
  env:
    DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

都配置完成之后，我们就可以提交 `.github` 目录到远端仓库，这样 `github actions` 就会自动读取并运行了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241533270.avif)

点击去就能够查看每个步骤的运行情况了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241556005.avif)

PS：如果之前未使用过 `hexo` 的 `deploy` 功能的，需要先安装 `hexo-deployer-git` 依赖，配置的 `deploy` 才能够生效

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/24/202203241557613.avif)

# 后记

经过一番折腾，现在我们的工作流就变成如下了：

- 编写 `md` 文件
- 提交这个 `md` 文件到远端 `blog` 仓库
- `github actions` 自动部署，提交到 `Dedicatus546.github.io` 这个仓库
- `Dedicatus546.github.io` 为 github-page 仓库，也会通过 `github actions` 部署

这样就完成了一次网站的更新，可以看到我真正参与的只有前面两个步骤，也是核心的步骤，即写 `md` 文件

原来我是一个仓库同时存放 `md` 源码以及生成的 `docs` 文件夹的

这次给拆成了两个仓库，其中一个就是 `github-page` ，而 `md` 源码的仓库重新建了一个

这样提交的时候就不会和生成的 `html` ， `css` 等混在一起，对于查看每次提交的 `md` 的 `diff` 情况来说是非常友好了

而且 `md` 仓库可以设为私有，或者多分支写帖子等，都对 `github-page` 仓库没有影响 （由于设置了只在 `master` 分支上执行，所以其他的分支提交到远端不会触发 `github actions` ）

总而言之，提升还是非常明显的， 白嫖 `github` 的机器来打包，何乐而不为呢？
---
title: 记一次通过github创建自己的图床以及压缩图片
key: 1642994672date: 2022-01-24 11:24:32
updated: 2023-02-13 18:28:45
tags:
  - 图床
  - 图片压缩
  - PicGo
  - sharp
categories:
  - 编程
---


# 前言

记一次通过 `github` 创建自己的图床以及压缩图片

<!-- more -->

之前一直有这个想法，之前帖子的图床为

- [sm.ms](https://sm.ms)
- [路过图床](https://imgtu.com)

两个混用，本来应该是只用 `sm.ms` 的，但是有一阵子图片加载巨慢

就换成路过图床了，其实不是很想折腾

但是路过图床有一些问题，对于 `ACG` 之类的图片，很容易被检测，然后被删除

上次换了个头像，下面这个，一天就给我删了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242324821.avif)

这图也不是 `18+` 图片吧，不过路过图床也是规定了的，没啥好说的

由于是 `AI` 检测，图存在误杀，人工感觉不实际，为了大部分用户，这么做**理解**

如果不是和 `ACG` 相关的图片，路过图床绝对是不错的选择

所以，由于以后可能要写一些 `ACG` 类的帖子

用三方的图床可能会麻烦，而且不好备份，故搞个 `github` 的图床

这样子定时往本地拉一拉即可，而且也不会被无故删除，当然前提是不要传色图，不然大概率也是无

# 正文

## 图床搭建

网上关于 `github` 的图床一大堆了，这里简单写下即可

这里用的是 `PicGo` 这个软件，一个基于 `electron` + `Vue` 的图床工具，可以配置各种类型的图床，比如上面的 `sm.ms` 和路过图床，它都支持

当然它也支持 `github` 的图床，只需简单的配置即可

[PicGo官网](https://molunerfinn.com/PicGo/)

下载的话要去 [PicGo github仓库](https://github.com/Molunerfinn/picgo/releases)

目前最新的版本为 `2.3.0`，目前有 `beta` 版，不过没必要，稳定版即可

下载安装完成之后，打开后的界面如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241410527.avif)

界面非常简单，然后这里我们不用内置的 `github` 图床

因为删除的时候没有同步仓库，会造成仓库冗余

直接找 `githubPlus` 插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241424757.avif)

安装完会提示你重启，按提示就行了

然后进入图床设置里的 `githubPlus`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241425098.avif)

然后就先放着，去github创建个 `token `和图床仓库

先进入个人 `setting`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241433139.avif)

左侧列表找到 `developer settings`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241435826.avif)

进入之后点击左侧的 `personal access tokens`，在点击右上角的 `generate new token`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241436054.avif)

`Note` 随便写，第二个过期日期，可以选永久，不过 `github` 不推荐，我是选了 `90` 天

下面的 `repo` 要勾上，其他不用管

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241439921.avif)

然后拉到最下面，点击 `generate` 即可

成功之后会给你一个 `token` ，要记住，因为配置要用到

然后我们创建一个 `repo`，这部分就不截图了，很简单

建完之后回到 `PicGo`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241425098.avif)

- `repo` 填写 `${github用户名}/${仓库名}` ，比如我们仓库叫 `image` ，我的用户名叫 `Dedicatus546`，那么我就要填 `Dedicatus546/image`
- `branch` 分支名，使用 `main` 主分支即可
- `token` `github api token` 刚才创建的那个，黏贴进去
- `path` 不管
- `customUrl` 这里可用 `jsdelivr` 的公共 `cdn` ，填写格式 `https://fastly.jsdelivr.net/gh/${github用户名}/${仓库名}@${分支名}` ，我的是 `https://fastly.jsdelivr.net/gh/Dedicatus546/image@main`
- `origin` 选 `github` 即可

然后记得点确定，成功的话右下角会有提示设置成功

最后一步，设置一下 `PicGo`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241454432.avif)

个人推荐开时间戳重命名以及上传后自动复制 `url` 这两个选项

点击上传区就可以开始愉快的传图片了，我使用的是微信的截图，所以需要点击右下角的剪切板图片来上传

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201241452507.avif)

成功之后，会自动复制相关的格式到剪切板

然后黏贴到文章里就完成了

## 图片压缩

其实搞完图床就差不多了，但是真正的搬砖工是不会止步于此的

接下来我们来搞图片压缩

实现图片压缩，我们需要为 `PicGo` 写一个插件，在拿到图片后上传前进行压缩

本来想看有没有现成的插件可用的，搜了一下，真有

[picgo-plugin-sharp](https://github.com/imbillow/picgo-plugin-sharp)

遗憾的是，这个插件已经不维护了，而且是 `cli` 插件，有点不足

`sharp` 版本有点老了, `PicGo` 的版本还是 `1.4.0`

所以，我们直接在这个插件上二次开发即可

第一步就是把依赖更新一下，主要是 `sharp` 和 `PicGo`

然后就是改动核心文件 `index.ts` 了

代码简单，我直接把仓库放 `github` 上了，直接拉下来即可

[Dedicatus546/picgo-plugin-sharp](https://github.com/Dedicatus546/picgo-plugin-sharp)

拉下来之后，点击插件页面的右上角导入本地的插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242248269.avif)

导入完就有第二个插件 `sharp` 了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242251033.avif)

点击插件的右下角的设置按钮，最后一个选项如果关闭了就把它打开，如上图

点击倒数第二个选项，就可以设置压缩格式了，默认为 `avif`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242253805.avif)

默认情况下使用 `sharp` 的默认压缩参数，如果想要自定义的话，需要配置 `PicGo` 的配置

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242254380.avif)

然后找到如下的配置，按格式配置即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242255179.avif)

比如上图 `avif` 的配置，`quality`为 `100` ，表示压缩质量最高

`lossless` 为 `true`，表示开启无损压缩

`speed` 为 `0` ，表示使用更长的 `CPU` 时间生成更小的文件

**PS：配置完记得重启 `PicGo`**

相关的配置可以查找 `sharp` 的官方文档进行查看

[sharp - High performance Node.js image processing](https://sharp.pixelplumbing.com/api-output)

比如 `avif` 的官方的配置

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242315309.avif)

经过压缩之后，图片小了很多，相当的nice 

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/01/24/202201242317955.avif)

# 后记

其实还可以再做一个插件直接进行本地备份的，难度不大，就是在上传之前存到指定目录即可

有空再搞搞吧
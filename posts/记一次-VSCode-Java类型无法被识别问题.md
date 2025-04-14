---
title: 记一次 VSCode Java类型无法被识别问题
tags:
  - Java
  - VSCode
categories:
  - 编程
key: 1671028890date: 2022-12-14 22:41:30
updated: 2023-02-13 18:28:45
---


# 前言

记一次 `VSCode` `Java` 类型无法被识别问题

<!-- more -->

这个问题其实已经出来挺长时间了，不过由于在公司里面我并不长期写 `Java` 代码，所以一直没有管它

不过最近由于有新的需求，后端有些部分需要我来负责，这个问题的情况就比较难受了。

# 正文

我这里的环境是本地 `Docker` ，然后用 `VSCode` 连接到 `Docker` 内，运行公司给的开发镜像进行开发

在 `VSCode` 中，如果我们想支持 `Java` 语法，需要安装插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/14/202212142347093.avif)

对于在 `VSCode` 上使用 `Docker` ，需要安装以下插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/18/202212181050834.avif)

对于 `Java` 的插件包，里面有一个

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/18/202212181056527.avif)

当我们连接到 `Docker` 的时候，上面这个插件也会在 `Docker` 内安装，在配置一栏我们可以看到

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/18/202212181117430.avif)

这个插件要在 `Java 17` 的环境才能跑成功，刚好我们公司那 `Docker` 镜像 `Java` 是 `1.8` 的

所以我们可以在某个目录下载 `Java 17` ，然后在项目的 `setting.json` 里面设置这个配置，如下

```json
{
  "java.jdt.ls.java.home": "jdk_home_path"
}
```

`jdk_home_path` 就是 `jdk 17` 版本以上的路径

如果容器里面的 `jdk` 是 `1.8` 的话，那么会出现引用 `jdk` 内部的包没法引入问题，比如 `String` 、`List` 等

# 后记

这破问题高了我好久，一打开代码一堆红，但是引用 `Springboot` 的类又没事，真的操蛋

之前写 `Java` 不多，主要是修修逻辑上的 `bug` ，还能凑合一下，这次写需求是真的绷不住了哈哈哈哈
---
title: 解决 Gitalk 无法获取 Github Token 问题
key: 1658799213
date: 2022-07-26 09:33:33
updated: 2023-10-10 14:09:13
tags:
  - Gitalk
  - Github API
  - Hexo
  - Vercel
  - JavaScript
  - Nodejs
categories:
  - 编程
top: 1
---

# 前言

记一次 `Hexo Next` 主题下 `Gitalk` 无法获取 `Github Token` 问题

<!-- more -->

目前博客采用的 `Gitalk` 来作为帖子的评论系统

其原理是通过帖子名来生成一个唯一 `id` ，用这个在 `Github` 仓库下开一个 `issue` ，这个 `issue` 就成为帖子的评论仓库了

由于要操作到 `Github` 仓库，所以是需要借助 `Github` 的开放 `API` 来完成的

其中有一步需要获取一个 `access_token` ，操蛋的是，这个 `API` 是不支持跨域访问的

`https://github.com/login/oauth/access_token`

所幸 `Gitalk` 使用了亚马逊的云服务代理里这个接口 

`https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token`

看起来没问题了，更操蛋的又来了，这个地址被墙了，意味着现在没法代理接口了，要么自己买服务器代理接口，要么科学上网

科学上网不现实，你不能指望大家开着飞机来看你的帖子

所以只能在自己写代理服务器上做文章了

作为一个抠门抠到家的码农，要我花钱，你这是要我的命🤯

果断百度 “免费 `VPS`” 

一看搜索结果...

额，还是算了，免费的就是最贵的...

正在我思来想去如何解决的时候，我想起了之前 `fork` 的一个网易云 `API` 项目，这个项目部署在了一个公共的服务上，好像还是免费的

我就直接冲进我的仓库列表中进行一个地毯式地查找

没错，就是它，`Vercel`
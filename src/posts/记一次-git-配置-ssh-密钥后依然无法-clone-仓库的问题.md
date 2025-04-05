---
title: 记一次 git 配置 ssh 密钥后依然无法 clone 仓库的问题
tags:
  - ssh
  - git
  - rsa
  - sha
categories:
  - 编程
key: 1670318890date: 2022-12-06 17:28:10
updated: 2023-02-13 18:28:45
---



# 前言

记一次 `git` 配置 `ssh` 密钥后依然无法 `clone` 仓库的问题

<!-- more -->

最近刚好广州这边疫情严重，电脑又放公司了，所以得在一台新的电脑上配环境

首先就是这个 `git` 了，配了 `git` 才能拉代码，然后开始划水（~~不是~~

# 正文

虽然我们公司是自己搭的 `gitea` 来存储代码的，但是 `ssh` 配置和 `github` 基本一样

都是在本地生成 `ssh` 密钥，然后把公钥放到 `gitea` 配置里即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/06/202212061628803.avif)

生成 `ssh` 密钥的操作还是很简单的，在 `window` 下执行

```text
ssh-keygen -t rsa -C "1607611087@qq.com"
```

然后一路回车即可，密钥就放在了 `C:\Users\${user}\.ssh` 下

公钥为 `id_rsa.pub` ，私钥为 `id_rsa`

然后吧 `id_rsa.pub` 的内容放 `gitea` 配置里即可

默认情况下，生成的密钥是 `RSA` 类型的，但是当我尝试拉取代码的时候，报了一个 `permission denied (publickey)` 

但是奇怪的是我使用 `ssh -v` 进行测试的时候是完全正常的，如下

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/06/202212061524469.avif)

后来百度之后才发现，应该是高版本的 `openSSH` 不再支持依赖 `sha1` 的 `rsa` 算法，默认情况下使用 `rsa-sha2-512` 算法

应该是服务端不支持该算法导致无法拉取仓库（但是为啥 `ssh -v` 能成功呢，好奇怪）

从 `openSSH 8.2` 开始， `release` 中就说明了该情况 [Release 8.2 Notes - openSSH](https://www.openssh.com/txt/release-8.2)

> It is now possible to perform chosen-prefix attacks against the SHA-1 hash algorithm for less than USD$50K. For this reason, we will be disabling the "ssh-rsa" public key signature algorithm that depends on SHA-1 by default in a near-future release.

简单点讲，就是官方发现，五万美元就能攻破 `sha1` 散列算法，认为这个算法不安全了，所以废弃掉

下面还有一段

> ssh(1), sshd(8), ssh-keygen(1): this release removes the "ssh-rsa"(RSA/SHA1) algorithm from those accepted for certificate signatures(i.e. the client and server CASignatureAlgorithms option) and will use the rsa-sha2-512 signature algorithm by default when the ssh-keygen(1) CA signs new certificates.

即这个版本删除依赖 `sha1` 的 `rsa` 算法，对于 `ssh-keygen` ，现在会默认使用 `rsa-sha2-512`

当然使用 `sha2` 的 `rsa` 不仅仅只是本地支持就行，服务端也需要在高于某个版本下才能正常工作

在 `openSSH 8.5 release notes` 中，提及了 `rsa-sha2-256/512` 需在 `openSSH 7.2` 及以上版本才能支持 [Release 8.5 Notes - openSSH](https://www.openssh.com/txt/release-8.5)

>  The RFC8332 RSA SHA-2 signature algorithms rsa-sha2-256/512. These algorithms have the advantage of using the same key type as "ssh-rsa" but use the safe SHA-2 hash algorithms. These have been supported since OpenSSH 7.2 and are already used by default if the client and server support them.

讲了这么多，解决办法很简单，就是使用另一个加密算法，比如 `ed25519` 算法，`ecdsa-sha2-nistp256/384/521` 算法

前者从 `6.5` 开始支持，后者从 `5.7` 以上开始支持，根据服务端的 `openSSH` 版本来确定即可

我去问了下公司其他人服务器上的 `openSSH` 版本，说是 `7.5` 的？？？？那为啥 `rsa-sha2-256/512` 不行？？？

无法理解，最后我改用了 `ed25519` 生成密钥

```text
ssh-keygen -t ed25519 -C "1607611087@qq.com"
```

配置公钥，`git clone` 一起喝成，成功拉下了代码，然后开始发呆...

当然 `github` 平台是完全没问题的，可能是我司的 `gitea` 平台它有自己的想法吧...

严重怀疑就是服务端 `openSSH` 有问题...

# 后记

这里我也找了相关的新闻，应该是谷歌通过碰撞能够使得两个文件产生相同的 sha1 值，文章地址 [Announcing the first SHA1 collision](http://security.googleblog.com/2017/02/announcing-first-sha1-collision.html)

`17` 年的新闻了，不过 `openSSH` 是在 `20` 年才废弃了 `sha1` ，在一些对安全性不是特别敏感的场合，其实使用 `sha1` 是完全足够的

比如说像下载文件时的散列校验，直到现在，也都还能看到 `md5` 和 `sha1` 的身影，不过我是没怎么校验（😂）
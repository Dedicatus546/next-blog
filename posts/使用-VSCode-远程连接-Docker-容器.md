---
title: 使用 VSCode 远程连接 Docker 容器
key: 1658140360date: 2022-07-18 18:32:40
updated: 2023-02-13 18:28:44
tags:
- Docker
- VSCode
categories:
- 编程
---



# 前言

使用 `VSCode` 远程连接 `Docker` 容器

<!-- more -->

`Docker` 之前也有听过，但是工作中一直没有场景需要用到，加上我懒，也就没有去学了

这次需求刚好需要我去跑公司的容器来作为开发环境，所以就趁这次机会来使用 `Docker`

# 正文

`Docker` 我个人的理解，最大的优势是把执行的环境一起打包了，这在 `Docker` 中称之为镜像

在 `Docker` 还没出现之前，部署的时候我们要通过 `SSH` 登录到远程的部署环境，然后修改远程的环境配置

而远程主机的环境可能还部署了其他的应用，不同应用之前可能就会存在冲突

而 `Docker` 通过虚拟化出一个子系统来和主机进行隔离，这样在子系统里面的操作不会影响到主机的环境，类似于沙箱

这样子交付软件的时候就可以交付一个完整的“系统”，然后通过 `Docker` 直接启动即可，非常方便

在 `windows` 上，我们需要安装 `Docker Desktop` 来管理 `Docker` 容器

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232253227.avif)

当然，本文主要是将如何通过 `VSCode` 来连接容器

我们可以通过两种方式

- 通过 `Remote SSH` 扩展连接（ `SSH` 方式）
- 通过 `Remote Container` 扩展直接连接

在这之前，我们需要安装两个插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232259826.avif)

当然，如果你的 `windows` 上有 `linux` 子系统，那么还可以安装 `Remote-WSL` 那个插件，也可以直接连接到 `WSL` 子系统

如果 `windows` 上有 `WSL` 子系统，那么 `Docker` 会基于 `WSL` 来虚拟化容器（应该是这样）

在设置中可以看到对应的提示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232307452.avif)

## `Remote SSH` 方式

在安装完 `Remote SSH` 之后，左侧会有一个小电视的图片，点击然后我们切换到 `SSH Targets`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232309045.avif)

点击 `+` 号，就会弹出一个框让你新建一个 `SSH` 连接，当然，我们一般是以 `root` 连接

所以我们填入 `ssh root@localhost -p 8083` ，`-p` 的意思是指定端口

点击之后会选择保存到哪个配置文件，这里我们选择第一个即可

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/23/202207232318565.avif)

点击之后就会提示保存成功，左侧也会出现我们的新建的连接

这里我们使用了 `8083` 作为连接端口，我们需要通过 `Docker` 映射到容器内的 `22` 端口（ `SSH` 的默认端口）

那你可能会问了，我启动容器的时候忘记映射了怎么办

没关系，这里有两个办法

- 把当前的容器保存为镜像，然后通过这个镜像启动，附加上端口映射的参数
- 通过修改容器的配置参数来新增端口映射

这里我们主要讲第二种

在 `linux` 下，我们可以很容易在网上找到容器对应的配置文件夹，在 `/var/lib/docker` 下

而在 `windows` 下，我发现网上并没有帖子指出容器的存放位置，最后还是在其他的 `Docker` 帖子下面找到的

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241215647.avif)

要怎么确定你的容器是哪一个文件夹呢

可以打开 `Docker Desktop` 上看容器的 `Name` 字段

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241234766.avif)

进入文件夹之后我们可以看到 `hostconfig.json` 文件，打开它

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241239996.avif)

有个 `PortBindings` 字段，这个字段保存了端口映射的信息

我们需要把容器的 `22` 端口映射到外部的 `8083` 端口，所以我们要添加下面这一行

因为 `SSH` 走的 `TCP` 协议，所以我们需要指定 `22` 端口为 `TCP` 类型

```json
{
  "PortBindings": {
    "22/tcp": [
      {
        "HostIp": "",
        "HostPort": "8083"
      }
    ]
  }
}
```

**重要：在修改这个文件之前要完全退出 `Docker Desktop` ，不然修改会失效！！！**

**重要：在修改这个文件之前要完全退出 `Docker Desktop` ，不然修改会失效！！！**

**重要：在修改这个文件之前要完全退出 `Docker Desktop` ，不然修改会失效！！！**

完成之后我们就可以重新启动容器了，接下来我们进入容器内

我们要确保容器内运行了 `ssh-server` 服务，通常情况下，`linux` 只安装了 `ssh-client` ，也就是支持本机去连接其他的机器，但是不支持其他的机器连接到本机

我们需要执行 `apt install openssh-server` 来安装

安装完成之后确保服务已经开启，可以使用 `/etc/init.d/ssh status` 来查看有没有启动

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241256792.avif)

启动我们使用 `/etc/init.d/ssh start` 即可

启动的时候我们可能会遇到 `sshd: no hostkeys available -- exiting` 的错误，我们只需要执行 `ssh-keygen -A` 生成一个 `SSH` 的密钥，之后便可以成功启动

然后我们需要修改 `SSH` 的配置文件，用 vi 打开 /etc/ssh/ssh_config 文件，加上 `PermitRootLogin yes` 意思是运行 `root` 登录，加上 `PasswordAuthentication yes` 意识是允许通过密码验证

修改完成保存之后，我们重启 `SSH` ，命令为 `/etc/init.d/ssh restart` 

然后我们要给 `root` 设置一个密码，通过 `passwd` 指令

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241310137.avif)

然后我们就可以通过 `VSCode` 来连接容器了，点击我们之前保存的 `SSH` 连接，右侧有个连接图标

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241311221.avif)

## `Remote Container` 方式

这个就相当简单了，我们在小电视 `tab` 上切换到 `Containers` ，`VSCode` 就会列出当前的容器列表

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241313981.avif)

然后我们只需要右键容器，选择 `attach in new window` 即可打开容器

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/07/24/202207241314925.avif)

# 后记

这两种第二种是比较简单的，但是这是 `Docker` 运行在本机上才能这么搞

如果容器泡在远程主机上，那么就只能老老实实通过 `SSH` 来连接了
---
title: >-
  记录一次在 windows 上安装 Rocky Linux
tags:
  - WSL
  - Rocky
  - Linux
  - Windows
categories:
  - 编程
date: 2024-12-02 17:05:53
updated: 2024-12-02 17:05:53
key: 1733130353
---


# 前言

记录一次在 windows 上安装 Rocky Linux 。

<!-- more -->

在 Windows 上使用 WSL 的 Linux 确实很不错，不管是学习还是开发，主要是可以和 Windows 的环境隔离开了，不想要了直接把相关的 Linux 删了就行。

之前重装了几次系统，这次就记录下来，方便以后翻阅。

# 正文

## Rocky Linux

Centos 8 后，红帽（Red Hat）就不再构建 Red Hat Enterprise Linux 下游的生产版本了， Centos Stream 为 Red Hat Enterprise Linux 的上游版本。 Rocky Linux 可以认为是 Red Hat Enterprise Linux 下游的构建，可以理解为 Centos 8 的延续。

## 安装 WSL

本文的环境为 Windows 11 ，Windows 10 应该通用。

执行以下命令安装 WSL ：

```bash
wsl.exe --install
```

这会安装最新的 WSL 。

安装成功后，最好**重启**一下电脑。

## 安装 Rocky Linux

网上的很多文章都需要通过 Docker 来将 Rocky Linux 的镜像导出为一个 tar 包，其实并不需要，Rocky Linux 本身就构建了相关的资源。

在最新的 9.5 的[镜像文件夹](https://dl.rockylinux.org/pub/rocky/9.5/images/x86_64/)下，可以看到 [Rocky-9-Container-Base-9.5-20241118.0.x86_64.tar.xz](https://dl.rockylinux.org/pub/rocky/9.5/images/x86_64/Rocky-9-Container-Base-9.5-20241118.0.x86_64.tar.xz) 的文件，这个文件就可以直接使用 WSL 命令导入

将这个文件下载下来用，使用 `wsl --import 系统名字 安装的位置 tar包位置` 命令导入到 WSL 中，我的安装脚本如下：

```bash
wsl --import Rocky9 E:\wsl\Rocky9 C:\Users\lwf16\Downloads\Rocky-9-Container-Base-9.5-20241118.0.x86_64.tar.xz
```

这里系统名称可以随意取，通过 `wsl -l` 可以查看所有安装的 linux 子系统。

如果速度太慢，可以使用阿里云的镜像地址：[Index of /rockylinux/9.5/images/x86_64/](https://mirrors.aliyun.com/rockylinux/9.5/images/x86_64/?spm=a2c6h.25603864.0.0.709f9612yxImMm)，相关文件地址为：[Rocky-9-Container-Base.latest.x86_64.tar.xz](https://mirrors.aliyun.com/rockylinux/9.5/images/x86_64/Rocky-9-Container-Base.latest.x86_64.tar.xz)

## 启动 Rocky Linux

执行 `wsl -l` ，会出现前面安装的 Rocky9 ，该 Linux 为默认的子系统：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202145141347.avif)

直接执行 `wsl` 即可启动（这里由于我启动了 V2rayN ，所以会有代理的提示，不用管）：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202145258101.avif)

## 启用 systemd 

我们需要在 `/etc` 下创建一个 `wsl.conf` 文件，然后写入以下内容：

```conf
[boot]
systemd=true
```

然后重启该子系统，可以使用 `wsl --shutdown` 停掉整个 wsl ，或者 `wsl -t Rocky9` 注销指定的子系统。

重启之后为了验证是否为 systemd 接管，执行 `pstree` 命令，效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202155036023.avif)

更多 WSL 的可配置项可以在微软的[文档](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config)中查看。

## 替换源

默认的源可能网速较慢，这里我们可以切换到阿里的源。

在阿里云 Rocky Linux 的[页面](https://developer.aliyun.com/mirror/rockylinux?spm=a2c6h.13651102.0.0.6bd71b11nsfXe4)下，提供了如下的替换命令，直接复制执行即可。

```bash
sed -e 's|^mirrorlist=|#mirrorlist=|g' \
    -e 's|^#baseurl=http://dl.rockylinux.org/$contentdir|baseurl=https://mirrors.aliyun.com/rockylinux|g' \
    -i.bak \
    /etc/yum.repos.d/Rocky-*.repo

dnf makecache
```

接着我们可以执行 `dnf update` 来更新一下系统软件。

## 装一些常见的软件

由于这个镜像为基础镜像，所以有些命令可能不全，我们需要手动安装。

### ps 命令

`ps` 命令由 `procps` 包提供，直接执行 `dnf install procps` 安装。

### clear 命令

`clear` 命令由 `ncurses` 包提供，直接执行 `dnf install ncurses` 安装。当然也可以通过 `win + l` 快捷键来清除当前窗口的信息。

### ip 命令

`ip` 命令由 `iproute` 包提供，直接执行 `dnf install iproute` 安装。

### vim 命令

镜像默认有 vi 命令，不过没有高亮，可以装一个 vim ，执行 `dnf install vim` 安装。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202151025657.avif)

### docker

docker 的官网给了我们相关的[教程](https://docs.docker.com/engine/install/rhel/)，依次执行以下命令即可：

```bash
dnf -y install dnf-plugins-core

dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo

dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

装完之后执行 `systemctl start docker` 启动 docker 。

#### 拉取镜像

国内 Docker Hub 基本无法访问，所以我们需要通过代理来连接 Docker Hub 。在 systemd 的管理下，我们需要在 `/etc/systemd/system/docker.service.d` 文件夹下创建一个 `http-proxy.conf` 文件，然后写入：

```conf
[Service]
# 这里要写你的代理对应的 ip 值
Environment="HTTP_PROXY=socks5://172.21.128.1:10808"
# 这里要写你的代理对应的 ip 值
Environment="HTTPS_PROXY=socks5://172.21.128.1:10808"
```

接着我们重启 systemd 和 docker ，执行：

```bash
systemctl daemon-reload
systemctl restart docker
```

接着就可以随便拉取一个镜像试试看了，比如拉取 mysql ，执行以下命令

```bash
docker pull mysql:9
```

为了确认是否加载了相关的配置文件，我们可以执行 `systemctl status docker` 来查看：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202163356397.avif)

可以看到 Drop-In 一栏显示了我们新增的配置文件

## 主机子系统互 ping

默认情况下，子系统可以 ping 通主机，但是主机无法 ping 通子系统。

为了查看子系统的 ip ，我们执行 `ip addr` 命令：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202163652941.avif)

可以看到这里 eth0 为默认 NAT 情况下的网卡，默认情况下 windows 会建立一个 NAT 网络来连接子系统，在 windows 上执行 `ipconfig` 可以看到对应的网卡：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202163916931.avif)

这里我们要把这个网卡加到防火墙中，在管理员权限下执行：

```bash
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL (Hyper-V firewall))" -Action Allow 
```

此时就可以互 ping 了。

{% swiper %}
  {% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202164725087.avif  %}
  {% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/02/20241202164752703.avif  %}
{% endswiper %}
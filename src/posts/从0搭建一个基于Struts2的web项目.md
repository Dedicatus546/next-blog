---
title: 从0搭建一个基于Struts2的web项目  
key: 1591885784date: 2020-06-11 22:29:44  
updated: 2023-02-13 18:28:44
tags: 
 - Java
---


      

# 写个帖子证明我还活着

Struts这个框架之前也是没怎么用到。
之前用的SpringMVC写过小项目，基本不用Sturts。
趁着有个可以记录的地方，写下整个项目的搭建过程

<!-- more -->

## 工具

* IntelliJ IDEA 2019.02
* Struts2

## 创建一个基本的Web项目

首先是基本流程
点击File -> New -> Project  (PS: 记得勾上创建web.xml)
![新建项目](https://i.loli.net/2019/10/22/5eDtVxsgRT7NWr8.png)

建完项目之后的目录如图所示
![项目目录](https://i.loli.net/2019/10/23/2XDvhYcFROUCqAo.png)

设置编译后的class文件的导入路径
在web/WEB-INF目录下新建一个classes目录
![新建classes目录](https://i.loli.net/2019/10/23/phM4aVe3JGom5Cv.png)
建完文件夹之后按住Ctrl+Shift+Alt+S进入项目的设置（或者File -> Project Structure 进入项目设置）
apply之后会发现classes文件夹编程橙色证明就是设置成功了
![设置成功](https://i.loli.net/2019/10/23/kiD3vwg5yN94FCd.png)

设置外部包的导入文件夹
在web/WEB-INF目录下新建一个lib目录
![新建一个lib目录](https://i.loli.net/2019/10/23/6FSh35tHqyDKIZl.png)
Ctrl+Shift+Alt+S进入项目的设置
![](https://i.loli.net/2019/10/23/RUcIe9MHPGkrDdo.png)
选择lib目录
![选择lib目录](https://i.loli.net/2019/10/23/QfPBa9jAwzbL3TE.png)
确定之后设置为Jar目录
![设置为Jar目录](https://i.loli.net/2019/10/23/QXPRShIsMNBC5v3.png)

## 导入相关的包

先导入Struts2的包

> Struts2官网下载 [起飞传送](https://struts.apache.org/download.cgi#struts2520)

下载 struts-2.5.20-all.zip 这个文件
![struts-2.5.20-all.zip](https://i.loli.net/2019/10/23/wgBvaR4T2oXbdHQ.png)
解压之后 找到如图的路径就是struts2的全部jar包了
![struts2-jar包](https://i.loli.net/2019/10/23/I8NZGXzhdBDyF1e.png)
当然我们不需要导入全部的jar包
有一些是和Spring相关的
有一些我也不知道干嘛的
只需要导入如图所示的包
![需要导入的包](https://i.loli.net/2019/10/23/xDaW4ZJGvcCjrdE.png)

# 编写web.xml和struts.xml

## 编写web.xml

Struts最重要的就是配置他的核心过滤器

```xml
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
     <!-- 定义一个过滤器 -->
    <filter>
        <filter-name>struts</filter-name>
        <filter-class>org.apache.struts2.dispatcher.filter.StrutsPrepareAndExecuteFilter</filter-class>
    </filter>
    <!-- 添加过滤器的映射 -->
    <filter-mapping>
        <filter-name>struts</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>
</web-app>
```

PS：最新的struts2的核心过滤器在
`org.apache.struts2.dispatcher.filter.StrutsPrepareAndExecuteFilter`
低版本的struts的核心过滤器在
`org.apache.struts2.dispatcher.ng.filter.StrutsPrepareAndExecuteFilter`
具体可以打开struts的`struts2-core-2.5.20.jar`包查看  

## 编写struts.xml

在src下新建一个struts.xml文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE struts PUBLIC
        "-//Apache Software Foundation//DTD Struts Configuration 2.5//EN"
        "http://struts.apache.org/dtds/struts-2.5.dtd">
<struts>
</struts>
```

# 启动项目

做完前面的步骤之后，就可以愉快的启动项目了
随便写一个Action并配置struts.xml
![](https://i.loli.net/2019/10/23/Q4qI6TuyHUapgl9.png)

# 其他

## 控制台错误

`ERROR StatusLogger Log4j2 could not find a logging implementation. Please add log4j-core to the classpath`
![](https://i.loli.net/2019/10/23/lKcv9LtOk1oiybm.png)
这个是因为没有找到记录日志的包
提示让我们导入`log4j-core`这个包
OK！百度启动  

> Apache Log4j 2下载地址 [传送起飞](https://logging.apache.org/log4j/2.x/download.html)

下载如图所示的压缩包
![下载Log4j2](https://i.loli.net/2019/10/23/hINyZ5FGjsgqbdr.png)
下载完解压找到对应的包导入错误提示就消失！
没有错误的控制台就是令人心情舒畅！
<del>就像穿着新内裤迎接新年的第一个早晨一样</del> （雾）

# 结束

到这里基本就结束了项目的创建了
接下来就是写写Action
配置Action
Struts可玩性感觉还是蛮高的  

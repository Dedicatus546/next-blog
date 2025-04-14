---
title: 使用 hexo-robots 来生成 robots.txt 文件
tags:
  - hexo
  - robots.txt
categories:
  - 编程
key: 1722567967
date: 2024-08-02 10:32:54
updated: 2024-08-02 11:12:40
---



# 前言

使用 hexo-robots 来生成 robots.txt 文件

<!-- more -->

# 正文

对于一个静态网站来说，在被搜索引擎收录的过程中，会有很多的来自爬虫程序请求，但某些文件没有被爬取的必要，比如 js 文件、 css 文件、图片文件等等。 robots.txt 可以通过声明来让爬虫程序忽略某些文件。

相关的定义可以查看 Google 关于 robots.txt 的解释：[robots.txt 简介](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn)。

对于 hexo 来讲，在不使用其他任何辅助工具的情况下，可以直接在 `_posts` 中创建一个 robots.txt 文件，向里面编写内容即可。

这里要注意，如果未将 robots.txt 文件写入配置中的 `skip_render` 情况下，需要在头部声明 `layout: false` ，不然会生成 html 标签，造成 robots.txt 无效

```text
---
layout: false
---

# 主体代码
# ...
```

这样配置之后，生成的 robots.txt 就是单纯的从 `source/_posts` 拷贝到输出目录中，但还有一个问题就是 `layout: false` 这一段并不会被删掉

这可能会导致搜索引擎在解析 robots.txt 的时候会报错，比如 Google Search Console 中：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/02/20240802021525284.avif)

所以我们可以去掉这个 `layout: false` ，然后把 robots.txt 加到 `skip_render` 配置中：

```yml
# _config.yml

skip_render: _posts/robots.txt
```

其实这样基本就可以了。

但是作为一个喜欢没事找事干的老孩，这不得用一个插件来实现实在是说不过去。

## hexo-robots

综上所属，我编写了一个 [hexo-robots](https://github.com/Dedicatus546/hexo-robots) 的插件，只需要在 `_config.yml` 添加相应的配置即可生成相应的 robots.txt 文件。

先安装 hexo-robots 这个包

```shell
npm install hexo-robots
```

接着在 `_config.yml` 添加如下配置：

```yml
robots:
  user_agent: "*"   # 如果要写通配符，请务必要加上双引号，不然解析会报错
  allow:
    - / 
  disallow:
    - /js/
    - /css/
    - /images/
    - /archives/
    - /page/
    - /schedule/
    - /tags/
  sitemaps:
    - https://prohibitorum.top/sitemap.xml
    - https://prohibitorum.top/baidusitemap.xml
```

上面的就是目前该网站所使用 robots.txt 。

# 后记

该插件的核心是为 hexo 注册一个 generator 。它的形式看起来如下：

```typescript
hexo.extend.generator.register(name, function (locals) {
  
    // 如何生成 data 的逻辑
    
    return {
        path: "robots.txt",
        data: "{{文件内容}}"
    }
});
```
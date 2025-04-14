---
title: 在 Hexo 中集成 Swiper
tags:
  - Hexo
  - Swiper
categories:
  - 编程
key: 1680533795
date: '2023-04-03 22:56:35'
updated: '2024-08-08 23:09:30'
---





# 前言

hexo-tag-swiper ，一个能够在 Hexo 中使用 `Swiper` 的插件。

<!-- more -->

# 正文

## 安装

```bash
npm install hexo-tag-swiper --save
```

## 配置

在 hexo 的 _config.yml 中配置：

```yml
swiper:
  js: "https://cdn.jsdelivr.net/npm/swiper@11.1.9/swiper-bundle.min.js"  // default is "https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.js"
  css: "https://cdn.jsdelivr.net/npm/swiper@11.1.9/swiper-bundle.min.css"  // default is "https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.css"
```

- `js` - 引用的 `Swiper` js 文件的地址。
- `css` - 引用的 `Swiper` css 文件的地址。

插件内置了对 `next` 主题的简单样式支持。

如果你的主题不是 `next` ，可以在 `scripts` 文件夹下自己编写相关的样式：

```javascript
// scripts/swiper.my-theme.js
hexo.extend.injector.register("body_end", () => {
  // 你的主题名称
  const { theme = "my-theme" } = hexo.config || {};
  if (theme === "my-theme") {
    return `<style>
      // 额外的样式
    </style>`;
  }
  return "";
});
```

这里的 `my-theme` 是你当前使用的主题，对应到 Hexo 的 _config.yml 中为 `theme` 。

## 普通使用

### 语法

```text
{% swiper %}
  {% swiperItem %}
    write your content here
  {% endswiperItem %}
{% endswiper %}
```

### 例子

```text
{% swiper %}
  {% swiperItem %}
    William Stoner is born on a small farm in 1891. One day his father suggests he should attend the University of Missouri to study agriculture. Stoner agrees but, while studying a compulsory literature course, he quickly falls in love with literary studies. Without telling his parents, Stoner quits the agriculture program and studies only the humanities. He completes his MA in English and begins teaching. In graduate school, he is friendly with fellow students Gordon Finch and Dave Masters. World War I begins, and Gordon and Dave enlist. Despite pressure from Gordon, Stoner decides to remain in school during the war. Masters is killed in France, while Finch sees action and becomes an officer. At a faculty party, Stoner meets and becomes infatuated with a young woman named Edith, who is staying with an aunt for a few weeks.
  {% endswiperItem %}
  {% swiperItem %}
    Stoner woos Edith, and she agrees to marry him. Stoner’s marriage to Edith is bad from the start. It gradually becomes clear that Edith has profound emotional problems. Significantly, she is bitter about having cancelled a trip to Europe with her aunt to marry Stoner. After three years of marriage, Edith suddenly informs Stoner that she wants a baby. She suddenly becomes passionate sexually, but this period is brief. When their daughter Grace is born, Edith remains bedridden for nearly a year, and Stoner largely cares for their child alone. He grows close with his young daughter, who spends most of her time with him in his study. Stoner gradually realizes that Edith is waging a campaign to separate him from his daughter emotionally.
  {% endswiperItem %}
{% endswiper %}
```

### 效果

{% swiper %}
{% swiperItem %}
William Stoner is born on a small farm in 1891. One day his father suggests he should attend the University of Missouri to study agriculture. Stoner agrees but, while studying a compulsory literature course, he quickly falls in love with literary studies. Without telling his parents, Stoner quits the agriculture program and studies only the humanities. He completes his MA in English and begins teaching. In graduate school, he is friendly with fellow students Gordon Finch and Dave Masters. World War I begins, and Gordon and Dave enlist. Despite pressure from Gordon, Stoner decides to remain in school during the war. Masters is killed in France, while Finch sees action and becomes an officer. At a faculty party, Stoner meets and becomes infatuated with a young woman named Edith, who is staying with an aunt for a few weeks.
{% endswiperItem %}
{% swiperItem %}
Stoner woos Edith, and she agrees to marry him. Stoner’s marriage to Edith is bad from the start. It gradually becomes clear that Edith has profound emotional problems. Significantly, she is bitter about having cancelled a trip to Europe with her aunt to marry Stoner. After three years of marriage, Edith suddenly informs Stoner that she wants a baby. She suddenly becomes passionate sexually, but this period is brief. When their daughter Grace is born, Edith remains bedridden for nearly a year, and Stoner largely cares for their child alone. He grows close with his young daughter, who spends most of her time with him in his study. Stoner gradually realizes that Edith is waging a campaign to separate him from his daughter emotionally.
{% endswiperItem %}
{% endswiper %}

## 只使用图片

### 语法

```text
{% swiperImageItem [url] [ratio = 1.77778] %}
```

- `url` - 图片地址
- `ratio` - 容器宽高比，通过 css 的 `aspect-ratio` 来控制

### 例子

```text
{% swiper %}
  {% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/04/02/202304022159088.avif 1.77778 %}
  {% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/04/02/202304022159851.avif 1 %}
{% endswiper %}
```

### 效果

{% swiper %}
{% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/04/02/202304022159088.avif 1.77778 %}
{% swiperImageItem https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/04/02/202304022159851.avif 1 %}
{% endswiper %}
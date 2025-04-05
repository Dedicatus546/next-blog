---
title: 学习vue2-elm项目笔记
key: 1628087999date: 2021-08-04 22:39:59
updated: 2023-02-13 18:28:45
tags:
 - Vue
 - JavaScript
categories:
 - 笔记
---


# 项目地址

[bailicangdu/vue2-elm](https://github.com/bailicangdu/vue2-elm)

<!-- more -->

# `orientationchange`事件

描述：事件在设备的纵横方向改变时触发。

这个事件只能在移动设备或者移动模拟器上触发。

和`resize`配合使用，一个电脑端，一个移动端。

用来确定根字体大小。

代码位置为：`src/config/rem.js`。

```javascript
// 立即执行函数 IIFE
(function(doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function() {
            var clientWidth = docEl.clientWidth;
            if (!clientWidth) return;
            // 设置根字体大小
            docEl.style.fontSize = 20 * (clientWidth / 320) + 'px';
        };
    if (!doc.addEventListener) return;
    // 绑定窗口变化事件。
    win.addEventListener(resizeEvt, recalc, false);
    // 文档加载完成设置一次根字体大小，即初始化。
    doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);
```

# `Swiper`移动端轮播图插件

官网地址：[Swiperv6.8.1 - Most Modern Mobile Touch Slider](https://swiperjs.com/get-started)

中文网地址：[Swiper中文网](https://www.swiper.com.cn/)

# 根据代码判断操作系统

代码位置：`src/page/download/download.vue`。

在`created`钩子中有如下代码：

```javascript
let u = navigator.userAgent;
let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //g
let isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
// ...其余代码
````

`navigator` 在 `MDN` 文档中的描述为：

> `Navigator`接口表示用户代理的状态和标识。 它允许脚本查询它和注册自己进行一些活动。

除了 `userAgent` 之外，还有一些常用的属性：

- `clipboard`：剪切板对象，可以获取剪切板的内容。
- `onLine`：网络的在线状态。
- `language`：浏览器语言，中文为 `zh-CN`。

该对象上的属性被废弃和实验性质的都不少，兼容性不是特别好。

# ...
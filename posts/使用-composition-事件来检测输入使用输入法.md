---
title: 使用 composition 事件来检测输入使用输入法
tags:
  - JavaScript
  - composition event
categories:
  - 编程
key: 1690641283date: 2023-07-29 22:34:43
updated: 2023-07-29 22:34:43
---


# 前言

使用 `composition` 事件来检测输入使用输入法。

<!-- more -->

这周正好写的一个字幕编辑器出了一个 bug 。

字幕编辑器有个功能就是自动换行，就是我在打字的时候可以根据字幕生成的宽度来自动加入 `\n` 。

测试小哥在测试的时候发现使用输入法打到换行的时候就会出现问题。

# 正文

## 复现

我们用一个简单的 demo 来复现提到的问题

```javascript
// HTML 很简单，为一个 <textarea id="textarea1" />
import jquery from "jquery";

jquery(function () {
  const wrap = function (text: string) {
    // 5 个字符分割，加入 \n
    const res: string[] = [];
    text = text.replaceAll("\n", "");
    for (let i = 0; i < text.length; i += 5) {
      res.push(text.substring(i, i + 5));
    }
    return res.join("\n");
  };
  $<HTMLTextAreaElement>("#textarea1").on("input", function (e) {
    this.value = wrap(e.target.value);
  });
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/29/202307292203700.gif)

可以看到在分割的时候出现了拼写错误的问题。

## 解决

作为一个合格的 CV 工程师，立马谷歌，然后搜到了 `composition` 事件。

`composition` 总共有三个事件，分别是：

- [compositionstart](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/compositionstart_event) 
- [compositionupdate](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/compositionupdate_event) 
- [compositionend](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/compositionend_event) 

在 MDN 页面上，对于 `compositionstart` 的解释是：

> 文本合成系统如 input method editor（即输入法编辑器）开始新的输入合成时会触发 compositionstart 事件。
> 例如，当用户使用拼音输入法开始输入汉字时，这个事件就会被触发。

没错，那么我们可以在这个 `compositionstart` 触发的时候加一个变量来表示一个锁，在输入法生效期间不检测换行就行，然后在 `compositionend` 的时候在检测换行即可。

代码如下：

```javascript
import jquery from "jquery";

jquery(function () {
  const wrap = function (text: string) {
    // 5 个字符分割，加入 \n
    const res: string[] = [];
    text = text.replaceAll("\n", "");
    for (let i = 0; i < text.length; i += 5) {
      res.push(text.substring(i, i + 5));
    }
    return res.join("\n");
  };
  let isComposition = false;
  jquery<HTMLTextAreaElement>("#textarea1").on("input", function (e) {
    if (isComposition) {
      this.value = e.target.value;
    } else {
      this.value = wrap(e.target.value);
    }
  });
  jquery<HTMLTextAreaElement>("#textarea1").on(
    "compositionstart",
    function (e) {
      isComposition = true;
    }
  );
  jquery<HTMLTextAreaElement>("#textarea1").on("compositionend", function (e) {
    isComposition = false;
    // 触发一次检测
    this.value = wrap(e.target.value);
  });
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/29/202307292228653.gif)

可以看到现在在分割出已经不会出现拼写错误了。

## 兼容性

由于我们的系统基本上只在 PC 上允许，这个事件在 PC 上的兼容性还是非常不错的。在移动端上会稍差一些。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/29/202307292230618.avif)

# 后记

这个事件我还是第一次见到，虽然解决的方法不是很有技术含量，不过也算是拓宽了知识面吧😂。
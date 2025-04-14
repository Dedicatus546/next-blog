---
title: 使用 apng-js 来播放 APNG 动图
tags:
  - JavaScript
  - APNG
categories:
  - 编程
key: 1688631835date: 2023-07-06 16:23:55
updated: 2023-07-06 16:23:55
---


# 前言

使用 apng-js 来播放 APNG 动图。

<!-- more -->

最近公司需要我来做一个直播间送礼物的功能，因为不涉及用户登录已经充值，做起来还是很简单的，素材什么的也是之前就有的，在送礼物之后需要做一个全屏蒙层来显示礼物的动图显示。

# 正文

在使用 apng-js 之前，我们需要了解什么是 APNG 。

## APNG

APNG 全称 Animated Portable Network Graphics ，即会动的 png 图片，在我的🐷🧠内一直以为只有 gif 才能是动图，这次也算是打开了眼界了。

APNG 实际上就是通过 PNG 格式来扩展的。

PNG 格式由一个 header 加若干个的 chunk 来组成，而在普通的 png 图片中，包含的 chunk 中由一个 `IHDR` 元信息块，若干个 `IDAT` 块，一个 `IEND` 块以及其他可选块组成。其中包含图片数据的是 `IDAT` 块。

而在 APNG 中，扩展了下面三种块，如下：

- `acTL`（The animation control chunk）：位于 `IDAT` 块之前，标记这是一个会动的 png 文件。这个块包含了帧数以及动画是否循环的信息。
- `fcTL`（The frame control chunk）：每个 `fdAT` 块之前都有一个 `fcTL` 块，这个快包含了这一帧的一些元信息，比如长宽，位置，这一帧显示的时长，是否设置了透明度等。
- `fdAT`（The frame data chunk）：fdAT 块类似 `IDAT` 块，不同点在于 `fdAT` 块会在开头包含一个序列号信息，然后接下来就是一个 `IDAT` 块了，即 `fdAT = 序号 + IDAT` 。

![来自 png 的 wiki 页面](https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Apng_assembling.svg/720px-Apng_assembling.svg.png)

这里有个很重要的一点就是通过 PNG 来扩展的格式都是可以兼容只支持 PNG 解析的工具的。

这是因为扩展的块不是必须的，如果解析工具不认识这些块，是会忽略掉的，而 APNG 的第一帧为 `IDAT` ，接下来的帧为 `fdAT` ，如果解析工具不支持，那么依然能读取到第一帧 `IDAT` 的数据，从而显示出图片。

宏观上来说，就是这张图是可以动的，但是由于软件只支持 PNG 格式，只能显示出第一帧了。

块是非必须的原因是 `acTL` 和 `fdAT` 的第一个字母是小写，而在 PNG 格式的规范中，第一个字母是小写，则意味着块是非必须的（非关键块），大写则意味着块是必须的（关键块）。

![来自 png 的 wiki 页面](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/05/202307051812215.avif)

所以我们可以看到 PNG 格式中定义的非必要块无一例外都是第一个字母小写的：

![来自 png 的 wiki 页面](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/05/202307051814154.avif)

## apng-js

### 背景

在了解完 APNG 格式之后，就需要解决如何展示的问题了，对于现代的浏览器来说， APNG 原生的兼容情况其实还可以。

{% caniuse apng %}

IE 就不谈了，都过了几个头七了， Opera Mini 用的人也是很少的，所以基本都可以忽略不计。

兼容性的问题其实不大，而无法控制播放才是一个问题。

在没使用 apng-js 之前，我直接使用了 `img` 标签来直接设置动图。

这里我们用 wiki 上的一个 apng 图片来做例子：

![](https://upload.wikimedia.org/wikipedia/commons/1/14/Animated_PNG_example_bouncing_beach_ball.png)

在我们送出礼物的时候，我们需要全局显示一个蒙层，然后在蒙层上显示上面这张图片。

html 结构可以简化为如下：

```html
<body>
  <style>
    .overlay {
      position: fixed;
      inset: 0;
      background: #555;
    }
  
    .overlay img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
  <div class="overlay">
    
  </div>
  <button class="btn">展示 apng</button>
</body>
```

然后写一段简单的 js 代码：

```javascript
import $ from "jquery";

$(function () {
  $(".overlay").hide();
  $(".btn").on("click", function () {
    $("<img />").prop("src", "/example.png").appendTo(".overlay");
    $(".overlay").show();
  });
});
```

看起来效果是下面的样子：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061115452.gif)

第一个问题就来了，我们不知道这张图片什么时候播放结束，意味着我们无法确定隐藏蒙层的时机，当然，这完全可以通过额外的信息字段来解决，比如跟 UI 说让他给计算每张图的时长给到开发，然后手动设置定时器来隐藏蒙层。

由第一个问题发散来的第二个问题，由于 apng 图片是可以设置动画是否循环播放的，定时器可能会造成轻微的延迟，而造成动画闪烁。

这里我们就假设这张图片播放一次要 2s ，那么我们手动设置一个定时器来隐藏蒙层。

```javascript
import $ from "jquery";

$(function () {
  $(".overlay").hide();
  $(".btn").on("click", function () {
    var $img = $("<img />").prop("src", "/example.png").appendTo(".overlay");
    $(".overlay").show();
    setTimeout(() => {
      $(".overlay").hide();
      $img.remove();
    }, 2000);
  });
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061127544.gif)

看起来好像不错，但如果你仔细观察的话，这里会有一个问题，就是动画并不是从头开始播放的。

这里我也说不上来原理，只能说如果一张图片已经加载到本地，那么它们就会共享一组播放规则。

具体讲就是，我们随机往页面中插入 src 相同的 img ，它们的动画是会一样的，和插入的时间没有关系，展示如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061136341.gif)

这就会带来第三个问题，我们控制不了动画的开始，这样我们重复送礼物就会造成动画错误。

为了解决这种错误，我们需要重新加载图片，即“重新加载一张内容相同的新图片”。

具体到代码上就是，我们可以给 `src` 上添加上时间戳。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061141100.gif)

这样子看起来可能不是特别清楚，我们换个例子：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061144132.gif)

这个看起来就清晰多了。

看起来好像很 ok 了，但是，这有一个致命的问题，就是每一次显示都需要一次网络请求，图片小还好，图片一大，这个网络消耗就很大了。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061146141.avif)

当然，我们可以使用一种取巧的方式，那就是使用 URL.createObjectURL 来创建一个指向资源的 URL ，这也可以避免这个问题。

但是本着折腾的精神，我最后还是使用 apng-js 来完成这项功能。

### 使用

什么是 apng-js ？ apng-js 其实就是一个由 js 实现的 APNG 格式解析器，并且提供了一个简单的播放器来供我们使用。

apng-js 的 github 地址：[点我直达](https://github.com/davidmz/apng-js) 。

apng-js 核心就是导出了一个 `parseAPNG` 的函数。这个参数需要传入一个图片的 buffer 对象

然后如果 buffer 解析成功，那么会返回一个 APNG 对象。失败则会返回一个 Error 对象，这里还是挺奇怪的，错误不是抛出而是返回的...

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061447686.avif)

由于需要通过 buffer ，所以我们只能通过 ajax 来读取图片了

```javascript
import $ from "jquery";

$.ajax({
  url: "/example.png",
  xhrFields: {
    responseType: "arraybuffer",
  },
  success(buffer) {
    // 读取到 buffer
  },
});
```

然后我们传入这个 buffer 到 `parseAPNG` 中，可以打印看看。

```javascript
import $ from "jquery";

$(function () {
  $.ajax({
    url: "/example.png",
    xhrFields: {
      responseType: "arraybuffer",
    },
    success(buffer) {
      const apng = parseAPNG(buffer);
      if (apng instanceof Error) {
        // 解析失败
        console.error(apng);
        return;
      }
      console.log(apng);
    },
  });
});
```

控制台显示如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061434820.avif)

对于这个对象，我们需要注意的一个属性就是 `numPlays` ，这个属性控制了动画是否循环播放的问题，如果为 0 ，代表循环播放，如果大于 0 ，则表示播放的次数。

这个参数影响了我们通过 `getPlayer` 方法来获取的播放器的行为。

`getPlayer` 方法帮我们封装了一个简易的播放器，它需要一个 canvas 的 2d 上下文，在内部，它会把图像画到这个 canvas 上。

我们可以写下代码来测试前面我们提过的 `numPlays` 参数

```typescript
import $ from "jquery";
import parseAPNG from "apng-js";

$(function () {
  $.ajax({
    url: "/example.png",
    xhrFields: {
      responseType: "arraybuffer",
    },
    success(buffer) {
      const generate = (numPlays: number) => {
        const apng = parseAPNG(buffer);
        if (apng instanceof Error) {
          // 解析失败
          console.error(apng);
          return;
        }
        const $canvas = $<HTMLCanvasElement>("<canvas></canvas>");
        $canvas.prop("width", apng.width);
        $canvas.prop("height", apng.height);
        $canvas.width(apng.width);
        $canvas.height(apng.height);
        $canvas.appendTo("body");
        const ctx = $canvas[0].getContext("2d")!;
        apng.numPlays = numPlays;
        apng.getPlayer(ctx).then((player) => {
          player.play();
        });
      };
      // 循环播放
      generate(0);
      // 播放 1 次
      generate(1);
    },
  });
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061502121.gif)

可以看到右侧的只播放了一次。而左侧循环播放。

这就解决了我们上面提到的第二个问题。

而且播放器有一个 `stop` 的方法可以让动画回到开始，通过 `play` 方法开始播放，这就解决了上面提到的第三个问题。

那么第一个问题呢？播放器能获取到动画结束的时机吗，答案是可以的，播放器对象继承自 `EventEmitter` ，播放器内部会抛出几种事件。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061508311.avif)

这里我们只需要监听 `end` 事件，即可准确地在播放结束的时候进行某些操作。

最后我们用 apng-js 来实现最开始我们需要的效果，代码如下：

```typescript
import $ from "jquery";
import parseAPNG from "apng-js";

$(function () {
  $(".overlay").hide();
  $(".btn").on("click", function () {
    $(".overlay").show();
    $.ajax({
      url: "/example.png",
      xhrFields: {
        responseType: "arraybuffer",
      },
      success(buffer) {
        const generate = (numPlays: number) => {
          const apng = parseAPNG(buffer);
          if (apng instanceof Error) {
            // 解析失败
            console.error(apng);
            return;
          }
          const $canvas = $<HTMLCanvasElement>("<canvas></canvas>");
          $canvas.prop("width", apng.width);
          $canvas.prop("height", apng.height);
          $canvas.width(window.innerWidth);
          $canvas.height(window.innerHeight);
          $canvas.appendTo(".overlay");
          const ctx = $canvas[0].getContext("2d")!;
          apng.numPlays = numPlays;
          apng.getPlayer(ctx).then((player) => {
            player.play();
            player.on("end", () => {
              $(".overlay").hide();
              $canvas.remove();
            });
          });
        };
        generate(1);
      },
    });
  });
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/07/06/202307061544716.gif)

当然，这看起来还是有点问题，因为 canvas 的 css 样式的 width 和 height 和图片的 width 和 height 不是相同的比例。

这里需要根据容器的宽高和图片的宽高来计算 canvas 的宽高，然后用 css 来让 canvas 绝对居中即可，这里就不放代码了，就是一些很琐碎的代码。

# 后记

也是第一次上 wiki 去看图片二进制格式的组成，还是挺有意思的，自己也动手写了点代码解析了 PNG 的头部信息。
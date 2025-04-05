---
title: 在浏览器中使用摄像头和麦克风DEMO
key: 1628567713date: 2021-08-10 11:55:13
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
categories:
  - 编程
---


在浏览器中使用摄像头和麦克风`DEMO`

<!-- more -->

刚好这几天改公司项目的`UI`，接触了公司的某个浏览器在线视频会议系统，有点类似牛客网面试的在线视频对话。

主要感兴趣的就是浏览器如何使用电脑的摄像头和麦克风。

经过一番摸索，发现了相关的`API`。

# `navigator.mediaDevices`对象

在`navigator`挂载了一个只读的`MediaDevices`对象

[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices)上对该对象的解释：

> 接口提供访问连接媒体输入的设备，如照相机和麦克风，以及屏幕共享等。它可以使你取得任何硬件资源的媒体数据。

# `mediaDevices.getUserMedia`方法

`getUserMedia`可以通过传递特定的参数来请求获取相应的媒体设备。

比如我们想获取摄像头，可以这么写：

```javascript
const p = navigator.mediaDevices.getUserMedia({
  video: true,
});
```

然后把这段代码放到一个普通的`html`页面中，跑一下，就会有如下的效果：

![](https://z3.ax1x.com/2021/08/13/fBHZuD.png)

点击允许之后：

![](https://z3.ax1x.com/2021/08/13/fBHUEj.png)

可以看到浏览器就已经获取到摄像头了。

不过这也看不出来什么效果，所以我们需要把摄像头捕捉的画面放到页面中来看一下。

这里就需要我们用到`video`标签，以及需要了解`MediaStream`这个类。

# `MediaStream`

简单地翻译就是媒体流，可以理解为是各类媒体的一个集合或者说是一个容器。

比一个视频，它有视频轨，音频轨，可能还有字幕轨等等。

那么这个视频可以理解成一个`MediaStream`的实例对象。

而它包含的这些轨道，也就是`MediaStreamTrack`实例对象，即媒体流轨道对象。

我们可以打印`MediaStream`对象和它的所有`MediaStreamTrack`轨道对象。

```javascript
const p = navigator.mediaDevices.getUserMedia({
  video: true,
});
// 点击允许获取摄像头之后，该Promise就被resolve了
// resolve的结果是通过该摄像头生成的一个MediaStream对象。
p.then((mediaStream) => {
  console.log(mediaStream);
  console.log(mediaStream.getTracks());
});
```

![](https://z3.ax1x.com/2021/08/13/fBj9ED.png)

可以发现只有一个轨道对象，它的类别是`video`，设备的名字是`HD Webcam (5986:069e)`，这个名字就是我电脑的前置摄像头的名字。

# `video`标签

通常情况下，我们都是通过`src`来指定`video`的播放地址，从而使得`video`标签展示视频的内容。

事实上，`video`标签同样可以接收`MediaStream`对象来播放对应的内容，不过不是通过`src`属性去指定，而是通过`srcObject`属性来指定一个`MediaStream`对象。

目前`srcObject`在`MDN`上被标注为一个实验性质的功能。不过得益于微软放弃`IE`，全面布局`EDGE`来看，离全部支持应该也不远了。

`srcObject`不仅支持`MediaStream`对象，也支持以下的类型：

- `Blob`
- `File`
- [`MediaSource`](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaSource)

前两者比较常见，比较兼容的写法是通过`URL.createObjectURL`转成一个`URL`对象，然后附加到`src`上进行播放。

`MediaSource`也是一个实验性质的功能，个人理解是对于视频流进行更加细微的控制，比如分段加载，部分加载，码率切换等等，一个很重要的应用就是直播平台。

相关的文章可以看这： [使用 MediaSource 搭建流式播放器 - 知乎](https://zhuanlan.zhihu.com/p/26374202)

似乎跑偏了，梳理一下就是给`video`对象的`srcObject`挂载这个`MediaStream`对象即可。

整个`HTML`文件如下

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <video id="myVideo" style="width: 1280px; height: 720px"></video>
    <script>
      const video = document.getElementById("myVideo");
      const p = navigator.mediaDevices.getUserMedia({
        video: true,
      });
      // 点击允许获取摄像头之后，该Promise就被resolve了
      // resolve的结果是通过该摄像头生成的一个MediaStream对象。
      p.then((mediaStream) => {
        video.srcObject = mediaStream;
        video.addEventListener("canplay", () => {
          video.play();
        });
      });
    </script>
  </body>
</html>
```

然后丢到浏览器中，就可以看见自己帅气的脸颊了~

![](https://z3.ax1x.com/2021/08/13/fDiJMQ.png)

当然`getUserMedia`不仅可以使用摄像头，也可以使用麦克风，只要指定参数`audio`为`true`即可。

```javascript
const p = navigator.mediaDevices.getUserMedia({
  // 获取摄像头
  video: true,
  // 获取麦克风
  audio: true,
});
```

把上面的`HTML`中的相关代码改造成上面这样，带上耳机，就能自己和自己说话啦。

PS：如果摄像头或者麦克风被占用的话，那么返回的`Promise`会被拒绝`reject`。

`reject`的`error`有如下几种

- `AbortError` 中止错误
- `NotAllowedError` 拒绝错误
- `NotFoundError` 找不到错误
- `NotReadableError` 无法读取错误
- `OverConstrainedError` 无法满足要求错误
- `SecurityError` 安全错误
- `TypeError` 类型错误

错误相关的详细解释可以在`MDN`上`getUserMedia`这个[页面](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/getUserMedia)上查看

# 后记

你问我为什么只有半个头？

因为我太帅气了，怕影响到你的自信，哈哈哈哈哈哈哈。

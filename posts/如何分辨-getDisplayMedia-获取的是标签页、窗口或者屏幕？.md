---
title: 如何分辨 getDisplayMedia 获取的是标签页、窗口或者屏幕？
tags:
  - WebRTC
  - JavaScript
categories:
  - 编程
key: 1693491297date: 2023-08-31 22:14:57
updated: 2023-08-31 22:14:57
---


# 前言

如何分辨 `getDisplayMedia` 获取的是标签页、窗口还是屏幕？

<!-- more -->

起因最近公司的连麦在测试大哥的手里测出了个 BUG 。

从捕获标签的画面切换到捕获窗口的画面的时候，麦克风没有恢复。

因为这个系统在我入职之前基本上就完成的七七八八了，加上我刚入职的那一年基本上也没碰这个系统，所以里面的某些逻辑我也不是很清楚。

当然，在知道问题之后，首先就是要复现出来，跟着测试老哥提供的步骤，很好地复现出来了。

接下来就写写是如何解决的。

# 正文

## 浏览器种的两种捕获方式

在浏览器中，存在着两种捕获画面的方式，一种是我们比较熟知的摄像头设备捕获，一种就是对程序画面的捕获，这两种捕获分别对应着两个 API 。

- `navigator.mediaDevices.getUserMedia` 捕获各种摄像头的画面，可以指定是否捕获音频和是否捕获视频。
- `navigator.mediaDevices.getDisplayMedia` 程序画面的捕获，这里有三种，分别是浏览器标签页，指定窗口，整个屏幕。

这里我们不讲 `getUserMedia` ，我们只专注 `getDisplayMedia` 。

## getDisplayMedia 接口

通过 `getDisplayMedia` 接口，我们可以很方便的捕获某个标签页、某个窗口或者整个屏幕的画面，这个接口返回了一个 `MediaStream` 的对象。

我们就可以通过这个对象来进行一些操作，比如得到视频轨或者音频轨，把流挂到 `video` 元素的 `srcObject` 上观看等等。

对于本贴提到的我们的系统来说，我们主要是拿到视频的音视频轨道，然后喂给 Owt ，他的底层就是通过 `RTCRtpSender` 的 `replaceTrack` 接口来替换

在浏览器上使用 `getDisplayMedia` 接口后，我们可以看到浏览器要询问我们捕获哪种窗口。

{% swiper %}
{% swiperItem %}
![标签页](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311610386.avif)
{% endswiperItem %}
{% swiperItem %}
![窗口](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311613954.avif)
{% endswiperItem %}
{% swiperItem %}
![整个屏幕](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311614503.avif)
{% endswiperItem %}
{% endswiper %}

如果成功选择了某个类型之后，`getDisplayMedia` 会返回一个 `Promise<MediaStream>` 对象。

通过 `MediaStream.prototype.getTracks` 就可以看到所有的轨道（这里我选择的是标签页）。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311624611.avif)

从上面的图来看，我们得到的 `MediaStream` 只有一个 video 轨道，这意味着流是没有声音的，那我们能同时捕获音频吗？

答案是可以的，这需要我们往 `getDisplayMedia` 方法传入一个参数。这个参数我们称为“约束”对象。

在 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia#parameters) 上，我们能看到这个接口支持的约束类型。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311730863.avif)

可选的参数有

- `video`
- `audio`
- `controller`
- `preferCurrentTab`
- `selfBrowserSurface`
- `surfaceSwitching`
- `systemAudio`

这里我们重点关注前两个参数，这两个参数决定我们是否要捕获视频或者音频。

默认 `video` 为 `true` ，所以在前面我们直接调用。

```javascript
getDisplayMedia()
```

等同于

```javascript
getDisplayMedia({ video: true })
```

而 `audio` 参数默认为 `false` ，所以我们前面直接调用后只有一个 video 轨道。

我们可以试下同时把 `video` 和 `audio` 都置为 `true` ，即执行：

```javascript
getDisplayMedia({ 
  video: true,
  audio: true,
})
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311743395.avif)

可以发现，左下角出现了一个是否获取音频选框。

这时我们在标签页这里点击确认，观察流轨道的个数。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311745517.avif)

可以发现音频和视频流都有了，这时如果我们想确认流是否有声音，我们可以挂到一个 `video` 元素上进行观看，如果耳机出现回声则证明流是有声音的。

标签页是可以包括音频的，而窗口依然是不包括音频的（没有这个选框），整个屏幕左下角也有这个选框，不过默认是关闭的，如下图所示

{% swiper %}
{% swiperItem %}
![窗口](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311806051.avif)
{% endswiperItem %}
{% swiperItem %}
![整个屏幕](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311805897.avif)
{% endswiperItem %}
{% endswiper %}

所以现在问题就明了，我们需要在切换到窗口的捕获的时候，使用 `getUserMedia` 来拿到一条包含麦克风轨道的流。

这就引出了我们标题提到的，如何分辨 `getDisplayMedia` 捕获的是标签页、窗口还是整个屏幕这个问题。

## 如何分辨 getDisplayMedia 捕获的类型

还记得我们传入 `getDisplayMedia` 的参数吗，前面我们把它称为“约束”。

约束的意思就是你（浏览器）应该提供一个符合我要求（传入的参数）的东西。

那么我们有办法在传入的时候指定我们是要捕获哪种类型的吗？

理论上可以，这是因为约束里面的存在一个叫 `displaySurface` 的约束。

这里我们要介绍一个 API ，即 `navigator.mediaDevices.getSupportedConstraints` 。

通过它，我们可以获取当前支持的约束类型。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308311831717.avif)

可以看到 `displaySurface` 是 `true` 的，意味着我们可以使用这个约束条件。

这里要注意， `displaySurface` 可以为一下三个值：

- `browser` 浏览器的标签页。
- `window` 窗口。
- `monitor` 整个屏幕。

**但是**，当我们使用如下的操作的时候，并不能按预期只让用户选择某一种类型的捕获。

```javascript
getDisplayMedia({ 
  video: true,
  audio: true,
  displaySurface: "monitor" // 指定捕获整个屏幕
})
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308312139881.avif)

可以看出这个约束并没有生效，这难道是 bug 吗？

其实这不是 bug ，这是规范中定义的，在 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture#options_and_constraints) 中，我们可以看到如下的解释：

> Note: Constraints never cause changes to the list of sources available for capture by the Screen Sharing API. This ensures that web applications can't force the user to share specific content by restricting the source list until only one item is left.

粗略翻译就是，不能通过约束来强制用户使用特定的捕获方式。

那好像我们就无法获取指定类型的捕获了？

NoNoNo，在 `MediaStreamTrack` 中，还有一个 API 可以让我们知道 `MediaStreamTrack` 的 `displaySurface` 是什么，这个 API 就是 `MediaStreamTrack.prototype.getSettings` 。

比如我们通过如下的代码来查看捕获标签页时调用 `getSettings` 返回的值。

```javascript
navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: true,
}).then(ms => {
  ms.getTracks().forEach(track => {
    console.log(track.getSettings());
  });
});
```

效果如下：

{% swiper %}
{% swiperItem %}
![标签页](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308312148236.avif)
{% endswiperItem %}
{% swiperItem %}
![窗口](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308312151333.avif)
{% endswiperItem %}
{% swiperItem %}
![整个屏幕](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308312150684.avif)
{% endswiperItem %}
{% endswiper %}

这里正好对应了我们之前说到的 `displaySurface` 的三个枚举值。

至此，我们已经可以通过流来判断为哪一种类型了。

虽然通过 `displaySurface` 约束无法让用户只选择某种类型的捕获，但完全可以以一种曲线救国的方式来做这个事

我们可以先让用户自由选择，得到流之后我们找 `video` 类型的 `MediaStreamTrack` ，调用 `getSettings` ，观察返回对象的 `displaySurface` 。

如果不是我们想要的那个值，就直接退出或者重写调用 `getDisplayMedia` 让用户重新选择。

用一种直白的话就是，治不了浏览器，我还治不了你😡？不选指定的就不给你用😡。

# 后记

这里要注意一点，就是 `MediaStreamTrack` 的 `displaySurface` 在火狐下是无法得到的。因为火狐不支持。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/08/31/202308312207222.avif)

不过我们的系统只需要支持 Chrome 即可，所以并无大碍，安心地写完代码，顺利地提交，然后开始摸鱼...
---
title: JavaScript的一种跨标签页的通信方式
key: 1628672526date: 2021-08-11 17:02:06
updated: 2023-02-13 18:28:45
tags:
  - JavaScript
categories:
  - 编程
---


`JavaScript`的一种跨标签页的通信方式。

<!-- more -->

刚好这个星期在搞第三方账号接入我们的一个系统。

原型很简单，就是点击某个按钮，弹出一个第三方的账号接入页面，可能是输入账号，也可能是扫码等等。

执行完授权操作之后，自动关闭授权窗口，然后局部刷新原来页面的授权账号列表。

这个可以用掘金的授权登录来看，就类似下面这种类型：

![](https://z3.ax1x.com/2021/08/14/fyD6US.png)

刚开始完全懵逼的好吧，没做过这种需求，只会登录注册的我流下了悔恨的泪水，呜呜呜😭。

从原型来看，转为代码需要解决的点有三个：

- 怎么生成这样的小窗口；
- 怎么在授权之后自动关闭；
- 怎么往授权页传输数据；
- 怎么在授权之后通知到原来的页面；

# 生成一个小窗口

平时可能为了新开一个标签页，可能会使用两种方式：

- 使用`window.open(href, "_blank")`来新开一个窗口；
- 构建一个`<a href="href" target="_blank"/>`标签，然后使用`click`方法模拟点击，新开一个窗口；

第二个感觉没戏，所以就把目光转向`window.open`，去`MDN`查了下，发现`window.open`可以打开小窗口！

通过`window.open`的第三个参数，可以选择窗口的一些配置，常用的如下：

- `width` 指定窗口宽度
- `height` 指定窗口高度
- `top` 窗口左上角距离屏幕左上角的高度偏移
- `left` 窗口左上角距离屏幕左上角的宽度偏移
- `menubar` 是否显示菜单栏
- `toolbar` 是否显示工具栏
- `status` 是否显示状态栏
- `scrollbars` 是否显示滚动条
- ...

由于第三个参数需要以字符串的形式来传入，比如指定宽高的话就为`'width=1000,height=500'`。

字符串还是比较不方便的，我们可以使用对象来传入，然后稍微处理下：

```javascript
function openUrl(url, name, config = {}) {
  const str = Object.entries(config)
    .map(([key, val]) => `${key}=${val}`)
    .join(",");

  return window.open(url, name, str);
}
```

然后我们可以尝试一下：

```javascript
openUrl("https://www.baidu.com", "百度", {
  width: 1200,
  height: 600,
  top: 100,
  left: 100,
  menubar: "no",
  toolbar: "no",
  status: "no",
  scrollbars: "yes",
});
```

效果如下：

![](https://z3.ax1x.com/2021/08/14/f6eXE8.png)

看起来还不错，那么第一个问题我们就解决了。

# 授权之后自动关闭

有`window.open`，感觉应该就有`window.close`，去`MDN`搜了搜，发现还真有，真好对应了窗口的关闭。

`MDN`对`window.close`的解释如下：

> 该方法只能由`window.open`方法打开的窗口的`window`对象来调用。如果一个窗口不是由脚本打开的，那么，在调用该方法时，`JavaScript`控制台会出现类似下面的错误：
> 不能使用脚本关闭一个不是由脚本打开的窗口。 或`Scripts may not close windows that were not opened by script.`。

也就是说，如果我们想关闭一个打开的窗口，前提是这个窗口是由我打开的

那么我打开的这个窗口的 `window` 对象怎么获取呢，很简单，就是 `window.open` 的返回值

我们可以打印下

![](https://z3.ax1x.com/2021/11/05/Iu5Aaj.png)

确实是一个 `window` 对象，而且也存在 `close` 方法

我们试下调用 `close` 方法能不能关闭这个窗口

贴下整体的代码（使用Vue3）

```html
<script setup lang="ts">
const openUrl = (
  url: string,
  name: string,
  config: Record<string, number | string>
) => {
  const str = Object.entries(config)
    .map(([key, val]) => `${key}=${val}`)
    .join(",");

  return window.open(url, name, str);
};

let targetWindow: Window | null = null;

const openHandler = () => {
  targetWindow = openUrl("https://www.baidu.com", "百度", {
    width: 1200,
    height: 600,
    top: 100,
    left: 100,
    menubar: "no",
    toolbar: "no",
    status: "no",
    scrollbars: "yes",
  });
};

const closeHandler = () => {
  targetWindow?.close();
};
</script>

<template>
  <button @click="openHandler">打开窗口</button>
  <button @click="closeHandler">关闭窗口</button>
</template>
```

![](https://z3.ax1x.com/2021/11/05/Iu5LlV.gif)

没有问题，如果我们对自身直接使用 `window.close` 会有什么现象呢

直接开控制台试一下

![](https://z3.ax1x.com/2021/11/05/IuIeTH.png)

发现出现了警告⚠️，而且标签页也没有被关闭，警告的大致意思就是只能又打开的窗口进行关闭

那么第二个问题基本解决，接下来就是最后一个问题

# 怎么往授权页传输数据

在授权页我们进行登录，登录成功或者失败，我们都要通知到打开它的那个窗口

比如登录成功了，通知父窗口局部刷新，或者发送数据给父窗口，父窗口根据这个数据获取用户信息等等

刚开始，我想，既然父窗口拿到了子窗口的 `window` 对象，那么是否可以直接在上面挂在属性呢

类似与 `window.val = 1` 的形式

so，我们写出了如下的代码

```javascript
// ...

const openHandler = () => {
  targetWindow = openUrl("https://www.baidu.com", "百度", {
    width: 1200,
    height: 600,
    top: 100,
    left: 100,
    menubar: "no",
    toolbar: "no",
    status: "no",
    scrollbars: "yes",
  });
  // 往 window 上挂在属性
  targetWindow.myVal = "a val from sub window.";
  // 打印该属性
  console.log(targetWindow.myVal);
};
```

![](https://z3.ax1x.com/2021/11/07/I3VwXd.png)

发现确实可以往上面挂在属性，控制台也正确地输出了

正当我觉得应该可以实现的时候，在子窗口里面是打印不出来这个值的

![](https://z3.ax1x.com/2021/11/07/I3VWcQ.png)

这条路行不通，那怎么办呢，其实方法很简单，我们通过url来传递我们需要传递的数据，然后在子页面中对 `url` 进行解析即可

比如我们想往授权页传输用户的 `id` ，我们可以打开一个 `'http://target.com?userId=1'`

我们可以稍稍的封装一下函数

```javascript
const openUrl = (
  url: string,
  name: string,
  config: Record<string, number | string>,
  params: Record<string, any>
) => {
  const str = Object.entries(config)
      .map(([key, val]) => `${key}=${val}`)
      .join(",");

  const queryStr = Object.entries(params)
      .map(([key, val]) => `${key}=${val}`)
      .join("&");

  return window.open(`${url}?${queryStr}`, name, str);
};
```

打开之后

![](https://z3.ax1x.com/2021/11/07/I3mthV.png)

发现 `url` 后面带上了参数

![](https://z3.ax1x.com/2021/11/07/I3mzHs.png)

然后我们在子页面中通过 `window.location.search` 即可拿到参数部分，然后进行解析就 `ok` 了

# 怎么在授权之后通知到原来的页面

父窗口向子窗口传递数据搞定了，那么子窗口怎么向父窗口传递数据呢

像这次的这个第三方接入的需求，需要第三方账号登录成功后通知父窗口发送请求来刷新局部的数据

通过父向子传递数据我们知道，直接往 `window` 上挂在可能是行不通的

不过光说无用，得试试，那么首先要解决怎么在子窗口中拿到父窗口的 `window` 对象

这时候就要使用 `window` 上的 `opener` 属性了，它会返回打开它自身的 `window` 对象

如果这个窗口不是由另一个窗口打开的，那么这个值为 `null` 

![](https://z3.ax1x.com/2021/11/07/I3K7NR.png)

那么怎么证明这子窗口里面这个 window 就是父窗口的 window 呢

可以先在父窗口挂个属性，看子窗口能不能拿到

可是当我想直接在子窗口看看能不能读到父窗口的属性的时候，报错了

![](https://z3.ax1x.com/2021/11/07/I3QVRx.png)

从文字不难看出，是跨域错误，两个不同域的窗体对象不能访问对方属性

从而也就证实了往 window 上挂载属性是不可行的

当然即使往 window 上挂载数据可行，从另一个角度想，用户在子窗口进行登录注册的动作是不确定的

也就是说父窗口无法精确地判断子窗口究竟有没有完成动作

也就是需要启动一个定时器来轮询子窗口 window 对象上的某个属性

这样的代码看起来就不符合逻辑

应该有点类似于发布订阅的类型，子窗口发送一个事件，父窗口往这个事件上注册回调，从而精确地判断子窗口完成动作的时间

那么在 js 里面，有没有这样的 api 呢

有的，它就是 `message` 事件和 `postMessage` 方法

`postMessage` 允许我们往另一个窗体上发送 `message` 事件以及传递相关的数据

> window.postMessage() 方法可以安全地实现跨源通信。通常，对于两个不同页面的脚本，只有当执行它们的页面位于具有相同的协议（通常为https），端口号（443为https的默认值），以及主机  (两个页面的模数 Document.domain设置为相同的值) 时，这两个脚本才能相互通信。window.postMessage() 方法提供了一种受控机制来规避此限制，只要正确的使用，这种方法就很安全。 - MDN

它的函数签名有两个

- `postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void`
- `postMessage(message: any, options?: WindowPostMessageOptions): void`

这两个其实一样，只不过把参数 `targetOrigin` 和 `transfer` 放到 `options` 里面而已

发送 ok 了，那么就是监听 message 事件了

通过 `window.addEventListener('message', callback)` 来监听

回调的 `event` 参数有三个属性

- `data` : 从其他 `window` 中传递过来的对象。
- `origin` : 调用 `postMessage`  时消息发送方窗口的 `origin` . 这个字符串由 协议、"://"、域名、":端口号"拼接而成。
- `source` : 对发送消息的窗口对象的引用; 您可以使用此来在具有不同 `origin` 的两个窗口之间建立双向通信。

那么现在就可以试一试了

前面我们已经在子窗口中拿到父窗口的对象了

我们先监听父窗口的 `message` 事件

![](https://z3.ax1x.com/2021/11/07/I3UTVP.png)

接着我们使用子窗口的 `postMessage` 来往父窗口发送 `message` 事件

![](https://z3.ax1x.com/2021/11/07/I3ahJU.png)

发现成功拿到了数据

这里需要注意是以 `window.opener` 返回的其他窗口的对象来使用 `postMessage` 方法

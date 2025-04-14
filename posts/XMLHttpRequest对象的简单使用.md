---
title: XMLHttpRequest对象的简单使用
key: 1600959427date: 2020-09-24 22:57:07
updated: 2023-02-13 18:28:43
tags:
  - XMLHttpRequest
categories:
  - 编程
---


`XMLHttpRequest`对象的简单使用

<!-- more -->

# XMLHttpRequest

`XMLHttpRequest`是一个浏览器对象，通过这个对象，可以实现和服务器进行数据上的交互。

`Wiki`上这么定义`XMLHttpRequest`。

> `XMLHTTP`是一组`API`函数集，可被`JavaScript`、`JScript`、`VBScript`以及其它`web`浏览器内嵌的脚本语言调用，通过`HTTP`在浏览器和`web`服务器之间收发`XML`或其它数据。**`XMLHTTP`最大的好处在于可以动态地更新网页**，它**无需重新从服务器读取整个网页**，也**不需要安装额外的插件**。该技术被许多网站使用，以实现快速响应的动态网页应用。

这也就是我们常说的通过`AJAX`技术来实现网页的局部更新。

`Wiki`上这么定义`AJAX`。

> `AJAX`即“**Asynchronous JavaScript and XML**”（异步的`JavaScript`与`XML`技术），指的是一套综合了多项技术的浏览器端网页开发技术。

> 传统的`web`应用允许用户端填写表单（`form`），当提交表单时就向网页服务器发送一个请求。服务器接收并处理传来的表单，然后送回一个新的网页，但这个做法**浪费了许多带宽**，因为在前后两个页面中的大部分`HTML`代码往往是相同的。由于每次应用的沟通都需要向服务器发送请求，应用的回应时间依赖于服务器的回应时间。这导致了用户界面的回应比本机应用慢得多。

> 与此不同，`AJAX`应用可以仅向服务器发送并取回必须的数据，并在客户端采用`JavaScript`处理来自服务器的回应。因为**在服务器和浏览器之间交换的数据大量减少**，服务器回应更快了。同时，很多的处理工作可以在发出请求的客户端机器上完成，因此`web`服务器的负荷也减少了。

也就是说，我们通过`XMLHttpRequest`对象和服务器进行交互，格式为`XML`，而现在大部分使用的是`JSON`格式的对象，`Wiki`上称此为`AJAJ`

> 类似于`DHTML`或`LAMP`，`AJAX`不是指一种单一的技术，而是有机地利用了一系列相关的技术。虽然其名称包含`XML`，但实际上数据格式可以由`JSON`代替，进一步减少数据量，形成所谓的**AJAJ**。而客户端与服务器也并不需要异步。一些基于`AJAX`的“派生／合成”式（`derivative`/`composite`）的技术也正在出现，如**AFLAX**。

Tips: 在最后我们看到了一个`AFLAX`这个比较陌生的名词，那么这个又是啥呢

> `AFLAX`是`'A JavaScript Library for Macromedia's Flash™ Platform'`的略称。`AFLAX`是(`AJAX` - `Javascript + Flash`) - 基于`AJAX`的“派生／合成”式（`derivative`/`composite`）技术。正如略称字面的意思，`AFLAX` 是**融合 Ajax 和 Flash**的开发技术。

感觉这个都没怎么听过，`chrome`计划在今年年末就停止对`flash`的支持了，现在的`js`能操作的东西越来越多，感觉`flash`也逐渐的退出了历史的舞台（个人觉得 😂）。

当我们打开一个使用`flash`技术的网址时，会有下面的提示

![bilibili的flash播放器](https://s1.ax1x.com/2020/09/24/0pTFXR.png)

似乎扯远了，`XMLHttpRequest`可能我们在做项目的时候没见过（至少我做的两个都基本不需要跟他打交道，取而代之的是封装它的`Axios`）。

但是做项目大部分都使用过`Axios`这个库，这个库在浏览器端上的底层实现就是依赖了`XMLHttpRequest`。

![Axios在浏览器端底层的依赖](https://s1.ax1x.com/2020/09/25/0pHEFK.png)

那么如何原生的使用使用这个对象呢？

首先，`XMLHttpRequest`是一个构造器，需要先 new 出来一个对象。

```javascript
const xmlHttpRequest = new XMLHttpRequest();
```

可以在浏览器上看到它的全部的属性和方法。

![](https://i.loli.net/2020/09/25/WHqXQErUgM7xlyA.png)

其中前面`on`开头的很明显是一个监听事件的回调函数：

- `onabort`
- `onerror`
- `onload`
- `onloadstart`
- `onloadend`
- `onprogress`
- `onreadystatechange`
- `ontimeout`

其他的就是一些属性：

- `readyState`
- `response`
- `responseText`
- `responseType`
- `responseURL`
- `responseXML`
- `status`
- `statusText`
- `timeout`
- `withCredentials`

其中有个比较特别的是`upload`对象，这是和上传有关的对象，现在先不管他。

伟人鲁迅曾经说过：“光说不做，那叫耍流氓”。

# 前置准备

so，我们要实际操作来验证这些到底是个啥东西，他们的执行顺序以及含义。

我们先搭个`http`服务器出来。

这里我使用的是`Koa`以及配套的`Koa-Router`（`Koa`的路由中间件，可以很容易地进行`api`的编写）。

和`Koa-Static`（`Koa`的静态文件映射中间件，这里主要映射下测试用的`html`文件）。

```text
|-- server
  |-- html            // 这里存放Html文件
    |-- index.html
  |-- index.js        // server的入口文件
```

在`index.js`来编写我们的这个`http`服务器。

```javascript
const Koa = require("koa");
const KoaStatic = require("koa-static");
const KoaRouter = require("koa-router");

const app = new Koa();
const router = new KoaRouter();
const path = require("path");

const home = KoaStatic(path.join(__dirname));

// 配置当前目录为静态目录，
app.use(home);

// 配置路由
app.use(router.routes()).use(router.allowedMethods());

const port = 3030;

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`服务器已经运行，端口号为：${port}`);
});
```

使用`node`之后，如果启动成功，则会出现我们写在`listen`函数的回调。

![](https://s1.ax1x.com/2020/09/25/09NNo8.png)

ok，我们来写一个简单的`index.html`页面，放到`html`文件夹里面。

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>AJAX</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

如果没有意外，就可以出现我们的初始的页面了。

![](https://s1.ax1x.com/2020/09/25/09URBt.png)

ok，接下来我们写一个简单的接口，返回一个对象。

我们稍微改下项目的目录：

```text
|-- server
  |-- html            // 这里存放Html文件
    |-- index.html
  |-- router          // 放置接口的文件夹
    |-- index.js
  |-- index.js        // server的入口文件
```

编写`router`文件下面的`index.js`。

```javascript
const KoaRouter = require("koa-router");
const router = new KoaRouter();

router.get("/hello", async (ctx, next) => {
  ctx.body = "hello world!";
});

export default router;
```

在把根下面的`index.js`文件稍微更改下。

```javascript
const Koa = require("koa");
const KoaStatic = require("koa-static");

// - const KoaRouter = require("koa-router");

const app = new Koa();

// - const router = new KoaRouter();
// +
const { router } = require("./router/index.js");

// ...
```

然后访问`/hello`，如果显示了`hello world！`那就证明接口可以调用了。

![](https://s1.ax1x.com/2020/09/25/09dbT0.png)

# XMLHttpRequest 测试

开始在`index.html`里面写请求。

如何去发送一个请求呢，这就要使用`open`函数。

## `open`

`open`函数有`5`个参数，但大部分情况下只会说到`3`个

- `url` 请求的目标地址；
- `method` 请求的方法；
- `async` （可选）请求是否异步，默认为`true` // Tips：一般都不会去指定为`false`（同步），由于 js 为单线程的模型，线程的阻塞意味着将无法响应页面上的其他操作（比如`dom`事件，或者其他同步的操作，比如一个`while`循环）；
- `user` （可选）用户名用于认证用途；
- `password`（可选）密码用于认证用途。

ok，那我们写出来：

```javascript
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.open("get", "http://localhost:3030/hello");
```

发现没有发送请求，what？

![](https://s1.ax1x.com/2020/09/25/09DBNt.png)

没错，`open`函数只是初始化一个请求而已，此时还没有发送 http 请求。

为了发送 http 请求，需要在`open`之后调用`send`方法。

## `send`

`send`方法有一个参数，该参数也就是我们希望附带在请求上的数据。

- `body` 请求的主体数据，在 MDN 上标注着可以使用的几种类型，`Document`（发送前被序列化）`Blob`，`BufferSource`，`FormData`，`URLSearchParams`，`USVString`。

我们发送的是`get`请求，一般不在主题上附带数据，直接指定为`null`即可。

```javascript
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

刷新之后我们发现出现了发送的请求。

![](https://s1.ax1x.com/2020/09/25/096p80.png)

但是单单成功发送可不行，我们当然希望可以拿到发送回来的数据。

这时候，我们就需要监听`readystatechange`这个事件，给`onreadystatechange`写上回调。

## `onreadystatechange`

```javascript
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.onreadystatechange = function (ev) {
  const xhr = this;
  console.log(xhr.response);
};
xmlHttpRequest.send(null);
```

刷新发现，怎么出现了三个输出，其中一个是空白行，两个相同的`hello world!`。

![](https://s1.ax1x.com/2020/09/25/09RNTg.png)

这是为啥呢？`MDN`上有解释

> 只要`readyState`属性发生变化，就会调用相应的处理函数。这个回调函数会被用户线程所调用。`XMLHttpRequest.onreadystatechange`会在`XMLHttpRequest`的`readyState`属性发生改变时触发`readystatechange`事件的时候被调用。

那这个`readyState`又是什么东西呢？记得我们前面也有在`XMLHttpRequest`看到这个属性，`MDN`上给出了解释：

> `XMLHttpRequest.readyState`属性返回一个`XMLHttpRequest`代理当前所处的状态。一个`XHR`代理总是处于下列状态中的一个。
> ![](https://s1.ax1x.com/2020/09/25/09W9nf.png)

也就是说应该调用五次这个回调函数才对，那么为什么只调用了`3`次呢？

我们可以把`readyState`打印出来看一下：

![](https://s1.ax1x.com/2020/09/25/09WBUe.png)

发现只出现了`2 3 4`，并没有 `0 1`，看看缺失的`0`的意思是：**代理被创建，但尚未调用`open()`方法。**

再看看我们的代码，我们把回调写在了`open`函数之后，自然就不会调用到了，我们需要把回调的注册提前。

```javascript
const xmlHttpRequest = new XMLHttpRequest();
// 把注册回调提前
xmlHttpRequest.onreadystatechange = function (ev) {
  const xhr = this;
  console.log(xhr.readyState);
};
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

![](https://s1.ax1x.com/2020/09/25/09hsXt.png)

发现还是少了`0`这个状态，到底是为啥呢？

原因是回调函数是在`readyState`改变后才进行回调的。

也就是从`0`变为`1`然后调用回调，所以回调函数中的范围只有`1 - 4`。

也就是 `0 -> 1 -> callback（此时是1） -> 2 -> callback（此时是2） -> 3 -> callback（此时是3） -> 4 -> callback（此时是4）`。

我们可以在注册回调之前打印`readyState`的值看看。

```javascript
const xmlHttpRequest = new XMLHttpRequest();
console.log(xmlHttpRequest.readyState);
xmlHttpRequest.onreadystatechange = function (ev) {
  const xhr = this;
  console.log(xhr.readyState);
};
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

![](https://s1.ax1x.com/2020/09/25/094RDx.png)

发现出现了`0`状态。

所以如果在回调内判断是否为`0`来执行逻辑的，那么永远都不会执行。

（PS：看了好多网上的文章，都没讲清楚，懵懵懂懂的 😂，果然还是要实践出真知）

我也在火狐上面测试了这段代码，发现和谷歌浏览器的行为一致。

![](https://s1.ax1x.com/2020/09/25/095jyR.png)

实现者也相当的贴心，已经在`XMLHttpRequest`构造器上挂载了静态属性供我们使用。

```javascript
XMLHttpRequest.UNSENT;
XMLHttpRequest.OPENED;
XMLHttpRequest.HEADERS_RECEIVED;
XMLHttpRequest.LOADING;
XMLHttpRequest.DONE;
```

![](https://s1.ax1x.com/2020/09/25/09o9un.png)

这样子就可以减少魔法值的使用了，好处就是代码的意思更加明朗，并且如果以后这些对应的数字更改的话，对代码完全没有影响。

清楚之后，我们就明白了只需要判断在`DONE`状态下就可以拿到传输完成的数据了。

```javascript
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.onreadystatechange = function (ev) {
  if (this.DONE === this.readyState) {
    console.log(this.response);
  }
};
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

![](https://s1.ax1x.com/2020/09/25/09TQMj.png)

很好，现在已经可以拿到数据了。

但是我一个不小心把`/hello`写错成`/hella`。

![](https://s1.ax1x.com/2020/09/25/09TbY8.png)

完蛋，报错，也就是是说`DONE`状态只是标志了传输的完成而已，并不能保证传输正确。

在这个基础上，需要其他的状态来保证，这个就是状态码`status`。

关于状态码，可以查看：

- [HTTP1.0 的 RFC 文档的第 9 节](http://www.faqs.org/rfcs/rfc1945.html)
- [HTTP1.1 的 RFC 文档的第 10 节](http://www.faqs.org/rfcs/rfc2616.html)

（虽然英文文档看着痛苦，但还是要看啊 😭）

这里我们的重点不是状态码的类别，只需要简单地判断是否为`200`即可。

```javascript
const RequestStatus = {
  OK: 200,
};
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.onreadystatechange = function (ev) {
  if (this.DONE === this.readyState) {
    if (this.status === RequestStatus.OK) {
      console.log(this.response);
    } else {
      console.log(
        `Sorry啊，出现了一点小错误，错误状态码为：${this.status}，原因为：${this.response}`
      );
    }
  }
};
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

![](https://s1.ax1x.com/2020/09/25/09qQhV.png)

现在基本上就可以发送以及接受请求了，但是还有一些监听的钩子和一些属性没有说。

## 其他的监听函数

- `onabort`
- `onerror`
- `onload`
- `onloadstart`
- `onloadend`
- `onprogress`
- `ontimeout`

不管三七二十一，简单地打印点东西，看看是什么东西

```javascript
const RequestStatus = {
  OK: 200,
};
const xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.onreadystatechange = function (ev) {
  if (this.DONE === this.readyState) {
    if (this.status === RequestStatus.OK) {
      console.log(this.response);
    } else {
      console.log(
        `Sorry啊，出现了一点小错误，错误状态码为：${this.status}，原因为：${this.response}`
      );
    }
  }
};
xmlHttpRequest.onload = function (ev) {
  console.log("onload");
};
xmlHttpRequest.onloadstart = function (ev) {
  console.log("onloadstart");
};
// ...其他回调的绑定
xmlHttpRequest.open("get", "http://localhost:3030/hello");
xmlHttpRequest.send(null);
```

![](https://s1.ax1x.com/2020/09/25/0CADoV.png)

我们发现只打印了三个，其实从名字上，我们也能大致地推断出意思

`onloadstart` 在数据开始传输的回调
`onload` 在数据传输过程中的回调
`onloadend` 数据传输结束的回调

我们试着让连接出错，看看打印了什么回调

![](https://s1.ax1x.com/2020/09/25/0CEoBn.png)

我们发现依然有`onloadstart`和`onloadend`，但是`onload`变成了`onerror`

除了这两个，还有一个`onabort`，`onprogress`和`ontimeout`

### `ontimeout`

这个看名字其实很容易识别出来，就是连接超时了，就会调用这个回调函数。

那我们就把这个条件创造出来。

我们可以指定`timeout`属性来指定超时的时间，这个属性的值的单位是毫秒。

所以我们指定`500ms`之后提示超时。

```javascript
xmlHttpRequest.timeout = 500; // 这个语句要放在send之前
```

然后我们在服务端设置延迟`2`秒才进行数据的响应。

```javascript
router.get("/hello", async (ctx, next) => {
  ctx.body = await new Promise((resolve) => {
    setTimeout(() => {
      resolve("hello world!");
    }, 2000);
  });
  await next();
});
```

然后我们一刷新网页，就可以发现回调函数被执行了。

![](https://s1.ax1x.com/2020/09/25/0CrOjU.png)

### `onabort`

`abort`在英文中是流产和中止的意思，也就是说当我们的请求发出去之后。

但是我们突然改变想法不想发这个请求了，我们就可以调用`abort`方法来停止这个请求。

这是`onabort`注册的回调函数就会执行。

为了创造这个条件，我们需要客户端去掉`timeout`超时的设置。

```javascript
// - xmlHttpRequest.timeout = 500;  // 删除
```

然后我们在通过`setTimeout`延迟一秒来执行`abort`函数。

```javascript
// 延迟1秒执行，放在send方法之后
setTimeout(() => xmlHttpRequest.abort(), 1000);
```

刷新之后就可以看到出现了`onabort`的回调地执行。

![](https://s1.ax1x.com/2020/09/25/0Csbad.png)

那么就剩下最后一个回调了。

### `onprogress`和`upload`

这两个东西负责东西的下载和上传，其中`onprogress`负责下载，也不能说是下载，就是当我收到数据的时候，会周期性地执行这个回调。

`MDN`上对`onprogress`的解释如下

> `progress`事件会在请求接收到数据的时候被周期性触发。

（PS：前面的代码没有写入`onprogress`函数）

这时我们写上`onprogress`回调，并且删除客户端`setTimeout`延迟和服务器的响应数据的延迟

客户端

```javascript
// 记得要写在send方法之前
xmlHttpRequest.onprogress = function (ev) {
  console.log("onprogress");
};
```

服务器端

```javascript
router.get("/hello", async (ctx, next) => {
  ctx.body = "hello world!";
  await next();
});
```

刷新之后可以发现调用了`onprogress`

![](https://s1.ax1x.com/2020/09/25/0C6U10.png)

为了验证他是周期性地执行的，那么需要发送大一点的数据。

我们选择一张图片，先放到我们服务器上，建立一个`images`文件夹。

```text
|-- server
  |-- html            // 这里存放Html文件
    |-- index.html
  |-- images
    |-- 1.jpg
  |-- index.js        // server的入口文件
```

![](https://s1.ax1x.com/2020/09/25/0CgIfA.png)

选个漂亮的小姐姐也是个技术活（误 😂）。

更改服务端代码。

```javascript
router.get("/hello", async (ctx, next) => {
  // 同步读取一张图片得到一个buffer
  ctx.response.body = fs.readFileSync("./images/1.jpg");
  // 要设置类型头部为图片，不然客户端是乱码
  ctx.response.set("content-type", "image/png");
  await next();
});
```

更改客户端代码

```javascript
xmlHttpRequest.onreadystatechange = function (ev) {
  if (this.DONE === this.readyState) {
    if (this.status === RequestStatus.OK) {
      // 如果直接输出的话是乱码，不方便查看
      console.log("响应成功");
    } else {
      console.log(
        `Sorry啊，出现了一点小错误，错误状态码为：${this.status}，原因为：${this.response}`
      );
    }
  }
};
```

刷新之后就可以看到调用了多次的`onprogress`。

![](https://s1.ax1x.com/2020/09/25/0CRu5Q.png)

很多时候需要去查看当前的下载数据的进度，这时候就要通过回调的`ev`事件对象来获取。

我们可以打印出来看看是个什么东西。

```javascript
xmlHttpRequest.onprogress = function (ev) {
  console.log(ev);
};
```

![](https://s1.ax1x.com/2020/09/25/0CRXGj.png)

可以看到里面有两个属性`total`和`loaded`，分别对应了全部数据的大小和已加载数据的大小。

那么我们就可以实现一个简单的下载进度条。

```html
<div class="line line-grey">
  <div style="width: 0" class="line line-blue"></div>
</div>
```

```css
.line {
  width: 100%;
  height: 5px;
}
.line-grey {
  background-color: #c1c1c1;
}
.line-blue {
  background-color: #4b8cff;
}
```

```javascript
xmlHttpRequest.onprogress = function (ev) {
  const loaded = ev.loaded;
  const total = ev.total;
  // 设置样式 取五位小数，乘以100然后加上%
  el.style.setProperty("width", (loaded / total).toFixed(5) * 100 + "%");
};
```

效果图：

![](https://i.loli.net/2020/09/25/ztm1i9xdKQWTAZS.gif)

可能有点看的不太清，可以自己搞搞，相信你也可以看到效果。

上传`upload`也是照葫芦画瓢，不过回调要绑定在`upload`对象的属性上。

进度条我们使用上面那个就行了。

要加一个`input`选择文件和一个`button`按钮，来控制上传流程。

```html
<input type="file" /> <button>点我上传</button>
```

效果图：

![](https://s1.ax1x.com/2020/09/25/0C4Rmt.png)

然后编写`js`代码来控制控件（因为前面的代码写地有点杂了，就重新写）。

```javascript
const RequestStatus = {
  OK: 200,
};
const el = document.querySelector(".line.line-blue");
let file;

document.getElementsByTagName("input")[0].onchange = function selectFile() {
  file = this.files[0];
};

document.getElementsByTagName("button")[0].onclick = function upload() {
  if (!file) {
    return;
  }
  console.log(file);
  // 处理上传
};
```

然后尝试着选择一张图片和点击上传按钮，就可以看到已经得到了图片的对象了。

![](https://i.loli.net/2020/09/26/ry4xGHQ8fiM75N6.png)

接下来就是完成处理上传的逻辑了。

```javascript
document.getElementsByTagName("button")[0].onclick = function upload() {
  if (!file) {
    return;
  }
  console.log(file);
  // 处理上传
  const xmlHttpRequest = new XMLHttpRequest();
  xmlHttpRequest.onreadystatechange = function (ev) {
    if (this.readyState === XMLHttpRequest.DONE) {
      if (this.status === RequestStatus.OK) {
        console.log("上传成功");
      } else {
        console.log(
          `Sorry啊，出现了一点小错误，错误状态码为：${this.status}，原因为：${this.response}`
        );
      }
    }
  };
  // 记得这里是绑定的upload对象上的onprogress
  xmlHttpRequest.upload.onprogress = function (ev) {
    const loaded = ev.loaded;
    const total = ev.total;
    el.style.setProperty("width", (loaded / total).toFixed(5) * 100 + "%");
  };
  const formData = new FormData();
  formData.append("file", file);
  xmlHttpRequest.open("POST", "http://locahost:3030/hello");
  xmlHttpRequest.send(formData);
};
```

因为是要上传图片，所以使用`POST`方法，把图片封装在一个`FormData`对象里面然后发送。

然后服务器端使用`koa-body`来处理`form`表单的数据，这里就不贴出代码了。

可以看一下下面的效果图：

![](https://i.loli.net/2020/09/26/awmjrb7DINPq5Mh.gif)

# 后记

还有一些方法和属性可能没讲到，可以在`XMLHttpRequest`的`W3C`标准学习。

[XMLHttpRequest Level 1](https://www.w3.org/TR/XMLHttpRequest/)
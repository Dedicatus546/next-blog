---
title: Fetch对象的简单使用
key: 1601619775date: 2020-10-02 14:22:55
updated: 2023-02-13 18:28:44
tags:
 - 前端
categories:
 - 编程
---


# 前言

百度二面的时候面试官叫我简单的基于`fetch`封装一个简单的函数

没用过这个API所以当时直接说没用过，然后改成用`XMLHttpRequest`来封装...

所以写一写来学习下基本的使用

<!-- more -->

# `fetch`

`fetch`可以看成`XMLHttpRequest`的新版本，本质上解决的问题是一样的，就是使得网页能够通过js来发送请求和处理响应

可以在控制台打印下，发现它是一个内建函数

![](https://s1.ax1x.com/2020/10/02/0lCkBq.png)

通过查看MDN，发现`fetch`函数有两个参数

- `input` 一个请求地址字符串或者一个`Request`对象
- `config` 一个配置的对象，我觉得比较常用的是以下
  - `method`: 请求使用的方法
  - `headers`: 请求的头信息
  - `body`: 请求的 body 信息
  - `credentials`: 是否携带cookies

更多参数可以上MDN查看：[WorkerOrGlobalScope.fetch()](https://developer.mozilla.org/zh-CN/docs/Web/API/WindowOrWorkerGlobalScope/fetch)

并且`fetch`返回的是一个`Promise`，这也是他和XHR的重要的区别之一，

在XHR中，使用绑定事件的回调函数来获取数据，而在`fetch`中，使用`Promise`

ok，可以来试下这个API的简单使用了

（PS：服务器的话使用我们之前的哪个Koa的服务器即可）

服务器端
```javascript
router.get('/hello', async ctx => {
  ctx.body = 'hello world!';
});
```

客户端

```javascript
// 因为这个访问的就是同域下的hello的接口，所以可以省略地址前缀
fetch("/hello", {
  method: "get"
}).then(res => {
  console.log(res);
});
```

![](https://s1.ax1x.com/2020/10/02/0lARnH.png)

可以看到返回了一个`Response`对象，里面有些字段也在XHR里面也有

比如：`status`（状态码）、`statusText`（状态码对应的解释文字）

不过没有看见数据，只看见了一个`body`的属性，我们点开发现不是一个简单的对象，而是一个`ReadableStream`对象

![](https://s1.ax1x.com/2020/10/02/0lV8QU.png)

一个可读的流，基本上可以断定数据就在里面了，如何取出呢？

经过在MDN上的查找，需要通过`ReadableStream`对象获取一个`Reader`，

然后再在这个`Reader`上面读取数据

```javascript
fetch("/hello", {
  method: "get"
})
.then(res => res.body.getReader())
.then(reader => {
  return new Promise((resolve) => {
    // 存放Unit8Array数组
    let result = [];
    reader.read().then(function next({value, done}) {
      // 函数会接收一个对象，done表示传输是否完成，value表示值
      if (done) {
        // 完成了就解决返回的Promise
        // 此时value为undefined
        resolve(result);
        return;
      }
      // 没完成，还有数据
      result.push(value);
      // 读取下一个
      reader.read().then(next);
    });
  });
})
.then(result => {
  console.log(result);
});
```

执行后可以看到如下

![](https://s1.ax1x.com/2020/10/02/0lK0fA.png)

`Uint8Array`存放的是无符号的8位的整形数组，我们需要把里面的数据转成字符串然后拼接起来

```javascript
fetch("/hello", {
  method: "get"
})
// 省略中间的then
.then(result => {
  console.log(result);
  for (let array of result) {
    // 把每一个8位整数转成字符串并且拼接起来
    let str = String.fromCodePoint(...array);
    console.log(str);
  }
});
```

执行之后就可以看到`hello world!`

![](https://s1.ax1x.com/2020/10/02/0lrr5j.png)

当然这个解析其实有点问题，因为`String.fromCodePoint`按照字符对应的`unicode`编码来进行解析的

这对于`0 - 127`的`ASCII`码没有影响，因为`UTF-8`对`0 - 127`的编码和`unicode`码完全一样

但是对于比如说中文，或者emoji表情就不是这样了,`UTF-8`支持变长编码，通过前缀区分，此时编码和UTF-8表示的二进制就完全不一样了

比如这个笑哭的emoji表情 -> 😂 ，他的`unicode`编码是`11111011000000010`（2进制），转为16进制为`1f602`，

但是它在UTF-8中的2进制编码为`11110000 10011111 10011000 10000010`，和它的`unicode`编码不一样

如果直接解析，那么会出现乱码，如下图

服务器代码

```javascript
router.get('/hello', async ctx => {
  ctx.body = 'hello world!😂';
});
```

乱码现象

![](https://s1.ax1x.com/2020/10/02/0lqahn.png)

可以看到uint8Array数组最后四个10进制数字分别对应了上面写到的`😂`这个表情的`UTF-8`的2进制编码

解决办法其实不难，就是把`UTF-8`编码的转为`unicode`码点即可

`UTF-8`使用了变长的编码技术，通过前缀1的个数来判断字符占几个字节

Unicode编码(十六进制) | UTF-8 字节流(二进制)
--- | ---
000000-00007F | 0xxxxxxx
000080-0007FF | 110xxxxx 10xxxxxx
000800-00FFFF | 1110xxxx 10xxxxxx 10xxxxxx
010000-10FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx

那么根据这个表进行解析就OK了，代码如下

```javascript
function utf8ToUnicode(utf8Array) {
  let str = "";
  let n1, n2, n3;
  let i = 0;
  while (i < utf8Array.byteLength) {
    let cur = utf8Array[i];
    i++;
    switch (cur >> 4) {
      case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:
        // 一个字节直接替换
        // 0xxxxxxx 也就是 0001 - 0111
        str += String.fromCodePoint(cur);
        break;
      case 12:case 13:
        // 两个字节
        // 110xxxxx 也就是 1100 - 1101
        n1 = utf8Array[i++];
        str += String.fromCodePoint(((cur & 0b11111) << 6) | (n1 & 0b111111));
        break;
      case 14:
        // 三个字节
        // 1110xxxx 也就是 1110
        n1 = utf8Array[i++];
        n2 = utf8Array[i++];
        str += String.fromCodePoint(
          (
            ((cur & 0b1111) << 12)
            | ((n1 & 0b111111) << 6)
            | (n2 & 0b111111)
          )
        );
        break;
      case 15:
        // 三个字节
        // 11110xxx 也就是 1111
        n1 = utf8Array[i++];
        n2 = utf8Array[i++];
        n3 = utf8Array[i++];
        str += String.fromCodePoint(
          (
            ((cur & 0b111) << 18)
            | ((n1 & 0b111111) << 12)
            | ((n2 & 0b111111) << 6)
            | (n3 & 0b111111)
          )
        );
        break;
    }
  }
  return str;
}
```

然后我们可以尝试对😂试一试，结果如下

![](https://s1.ax1x.com/2020/10/02/01CBmn.png)

正确地解析了出来

当然，自带的方法中已经很贴心地为我们解决了这个问题，通过调用`text`方法即可（还是要懂原理的，这个才是重点）

```javascript
// const req = ...
fetch(req)
  .then(res => res.text())
  .then(str => console.log(str));
```

表情可以正常地显示了，也就是正常地解析出来了

![](https://s1.ax1x.com/2020/10/02/0lLE3q.png)

# `Request`和`Response`

这两者是`fetch`中经常会看到的对象

## `Request`

`fetch`的第一个参数可以传入一个`Request`对象

`Request`构造函数的参数和`fetch`基本一样

也就是上面的代码可以改写成

```javascript
const req = new Request('/hello',{
  // 这里的参数和fetch第二个参数一样
  method: "get"
});
fetch(req)
// .then... 省略后面的then链
```

运行之后能够得到和上面一样的结果

既然可以，那么我们就要看看到底是谁优先级更高了（刨根问底😂）

```javascript
const req = new Request('/hello',{
  // 这里的参数和fetch第二个参数一样
  method: "get"
});
fetch(req, {
  method: "post"
});
```

![](https://s1.ax1x.com/2020/10/02/01PqU0.png)

发现发出的是`POST`请求，也就是说`fetch`参数的优先级比`Request`对象参数的优先级高（由于接口是`GET`的，所以这里报错）

一个可能还不够证明，我们试试设置一些自定义的请求头

```javascript
const req = new Request('/hello',{
  // 这里的参数和fetch第二个参数一样
  method: "get",
  headers: {
    "my-header":"www.elegy.top"
  }
});
fetch(req, {
  method: "post",
  headers: {
    "my-header":"www.koi-no-uta.design"
  }
});
```

![](https://s1.ax1x.com/2020/10/02/01iiUx.png)

发现依然`fetch`参数的优先级比`Request`对象参数的优先级高

## `Response`

`fetch`返回的`Promise`的解决结果对象

除了前面说过的`text`方法，还有一些其他的方法方便开发者进行数据地转换

- `json` 把数据流转换成`json`格式，由于js天生支持`json`格式的对象，所以很多时候都是使用这个办法
- `formData` 把数据转换成`FormData`类型
- `blob` 把数据流转成`Blob`类型
- `arrayBuffer` 把数据流转成`ArrayBuffer`类型

一般用到`json`方法会比较多，我们可以试一下

服务器代码

```javascript
router.get("/hello", async ctx => {
  ctx.body = {
    name: "lwf",
    age: 12
  };
});
```

客户端代码

```javascript
const req = new Request("/hello", {
  method: "get"
});
fetch(req)
  .then(res => res.json())
  .then(res => console.log(res));
```

效果图

![](https://s1.ax1x.com/2020/10/03/03EgRP.png)

当然，使用`blob`方法也能得到相同的结果

```javascript
const req = new Request("/hello", {
  method: "get"
});
fetch(req)
  .then(res => res.blob())
  .then(blob => {
    console.log('我是调用的blob方法')
    return blob.text();
  })
  .then(str => console.log(JSON.parse(str)));
```

效果图

![](https://s1.ax1x.com/2020/10/03/03Z90g.png)

这么做显然没必要，所以使用`json`方法直接转换即可，`blob`方法比如在下载，播放媒体这些比较常用

像B站使用的就是`blob`的视频流

![](https://s1.ax1x.com/2020/10/03/03ZB4A.png)

使用`URL.createObjectURL(blob)`就可以使得blob对象以一种`url`的形式展示出来，就可以在文档上通过`src`来引用了

# Headers

`fetch`也支持以一个`Headers`对象来设置请求头

常见的方法有

- `append` 添加一个请求头
- `delete` 删除一个请求头
- `entries` 返回所有请求头的迭代器对象
- `get` 获取某个请求头的值
- `has` 判断是否含有某个请求头

可以改下之前的例子

```javascript
// 使用Headers对象
const headers = new Headers();
headers.append("x-my-header1", "lwf");
headers.append("x-my-header2", "12");
// 使用Request对象
const req = new Request("/hello", {
  method: "get",
  headers
});
fetch(req)
  .then(res => res.json)
  .then(str => console.log(str));
```

可以看见请求头都正确地添加到请求上面了

![](https://s1.ax1x.com/2020/10/03/03KmTS.png)

然后试试在控制台上操作一个`header`的其他方法

![](https://s1.ax1x.com/2020/10/03/03K0p9.png)

# 后记

`fetch`的兼容性还是相当不错的（除了IE，IE全版本不支持，😂）

![](https://s1.ax1x.com/2020/10/03/03KqAS.png)

虽然兼容性不错，但是基本上会使用一些上层的库二次地封装，比如`axios`（基于`XMLHttpRequest`）

所以很多时候用不到...

不过学还是要学的嘛
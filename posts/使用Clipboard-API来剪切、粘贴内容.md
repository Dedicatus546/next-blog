---
title: 使用 Clipboard API 来剪切、粘贴内容
key: 1650726710date: 2022-04-23 23:11:50
updated: 2023-02-13 18:28:44
tags:
- JavaScript
categories:
- 编程
---


# 前言

使用 `Clipboard API` 来剪切、粘贴内容

<!-- more -->

# 正文

这次来讲一下 `Clipboard` 这个新的 `API`

这个 `API` 在 `Vueuse` 中对应的 `composition` 为 `useClipboard`

`MDN` 上对应的文档地址为： [Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API)

该 `API` 的兼容性还是比较低的

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/23/202204232326074.avif)

可以看到 `Firefox` 还是部分支持， `Edge` 和 `Chrome` 都完全支持（一个内核）

所以当作尝鲜使用即可

来个简单 `demo` 来理解它的用法

```javascript
window.navigator.clipboard
  .writeText("hello world!")
  .then(() => console.log("write success."));
```

上面这段代码就会把 `hello world` 字符串写入到系统的剪切板中

然后我们可以在其他地方使用 `ctrl + v` 来拿到剪切板中的内容了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251427555.gif)

既然有 `ctrl + v` 了，怎么可以没有 `ctrl + c`

`writeText` 意味着往剪切板写入内容，那么推断 `readText` 就是读取剪切板的内容

```javascript
 window.navigator.clipboard
  .readText()
  .then((value) => console.log("剪切板内容: ", value));
```

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251434217.gif)

这里要注意，该 `API` 需要用户同意才能访问剪切板的内容，如果是第一次使用，那么浏览器会提示你授权

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251437196.avif)

授权之后在地址栏的右侧会有一个小标志

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251449913.avif)

规范要求读取写入都是需要申请权限才能执行的

但是目前 `chrome` 下（版本： `100.0.4896.127` ）往剪切板写入（ `writeText` ）无需申请权限，读取剪切板（ `readText` ）需要申请

不排除以后会加入权限验证，这里需要注意下

当然，`Clipboard` 不仅仅能够读写文字，其他的类型它也是支持的，比如图片

这里我们就不能使用 `writeText` 和 `readText` 了，而是使用更加通用的 `write` 和 `read` 这两个方法

`write` 方法接受一个参数，但是这个参数为 `ClipboardItem` 类型的对象数组，即 `Array<ClipboardItem>`

举个例子，我们可以使用 `write` 来模拟 `writeText` ，代码如下：

```javascript
window.navigator.clipboard
  .write([
    new ClipboardItem({
      "text/plain": new Blob(["hello world!"], {
        type: "text/plain",
      }),
    }),
  ])
  .then(() => {
    console.log("write success!");
  });
```

这段代码和上面的 `writeText` 的效果完全一样

可以看到， `ClipboardItem` 构造函数传入一个 `Record<string, blob>` 对象

其中 `key` 代表 `mime-types` ，这里我们使用 `text/plain` 来表示代写入的数据为一个文本类型

`MIME-types` 可以查看 `MDN` 文档[MIME 类型](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types)来了解

简单点讲就是浏览器不通过后缀来判断一个文件的类型，而是通过这个 `mime-type` 来判断

读取的时候 `read` 返回了一个 `Promise<Array<ClipboardItem>>` ，我们可以通过 `types` 属性和 `getType` 来拿到对应的 `blob` 数据，然后再进行处理

```javascript
window.navigator.clipboard.read().then(
  async (clipboardItems) => {
    // 拿到第一个
    const [clipboardItem] = clipboardItems;
    const type = clipboardItem.types[0];
    // 获取 blob ，注意这里 getType 返回 Promise<blob> ，需要 await 拿到 resolve 的数据
    const blob = await clipboardItem.getType(type);
    console.log(await blob.text());
  },
  (e) => {
    // 如果剪切板没有数据，那么读取会报 DOMException: No valid data on clipboard.
    console.log(e);
  }
);
```

到此我们依然只是写了复制粘贴文本数据的 `demo` ，现在我们来写一个复制图片的 `demo`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>test</title>
</head>
<body>
<input type="file" id="input"/>
<img id="img" src="" alt="" style="width: 200px"/>
<button id="btn1">选中这个小姐姐</button>
<button id="btn2">看看是什么小姐姐</button>
<script>
  /**
   * @type {HTMLInputElement}
   */
  const inputEl = document.querySelector("#input");
  /**
   * @type {HTMLImageElement}
   */
  const imgEl = document.querySelector("#img");
  const copyEl = document.querySelector("#btn1");
  const pasteEl = document.querySelector("#btn2");

  inputEl.addEventListener("change", () => {
    const [file] = inputEl.files;
    imgEl.src = URL.createObjectURL(file);
  });

  copyEl.addEventListener("click", () => {
    const [file] = inputEl.files;
    const {type} = file;
    window.navigator.clipboard
      .write([
        new ClipboardItem({
          [type]: file,
        }),
      ])
      .then(() => {
        console.log("write success!");
      });
  });

  pasteEl.addEventListener("click", () => {
    window.navigator.clipboard.read().then(
      async (clipboardItems) => {
        // 拿到第一个
        const [clipboardItem] = clipboardItems;
        const type = clipboardItem.types[0];
        const blob = await clipboardItem.getType(type);
        imgEl.src = URL.createObjectURL(blob);
      },
      (e) => {
        console.log(e);
      }
    );
  });
</script>
</body>
</html>
```

效果图如下：（这里我们开两个 `tab` 来做例子）

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251730866.gif)

虽然这个 `API` 看起来非常的方便，但是由于目前兼容性不好，所以不适宜上生产环境

那么有没有其他的方法来复制粘贴呢，答案就是 `document.execCommand` 这个函数

`Clipboard API` 的出现就是为了取代 `document.execCommand`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/04/25/202204251738008.avif)

可以看到，兼容性还行，但是要注意，规范中已经废弃了该方法，虽然浏览器厂商依然支持了该方法，但是不排除未来会删除的可能

对于复制，剪切，黏贴三个操作，分别对应执行

- `document.execCommand('copy')`
- `document.execCommand('cut')`
- `document.execCommand('paste')`

其中 `document.execCommand('paste')` 在 `chrome` 、 `Edge` 、 `Firefox` 下均无效，只有 `IE` 可以

对于复制一段文字，我们可以使用以下的代码

```javascript
function copy(text) {
  // 当前获得焦点的元素
  const currentFocus = document.activeElement; 
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);
  textarea.value = text;
  // 选中 textarea 的全部内容
  textarea.select();
  // 隐藏掉
  textarea.style.cssText = "position: absolute; top: -9999px; left: -9999px";
  document.execCommand("copy");
  document.body.removeChild(textarea);
  // 重新恢复焦点
  currentFocus.focus();
}
```

剪切的话只要把 `document.execCommand("copy")` 改为 `document.execCommand("cut")` 即可

在 github 上，有根据这个 api 的 clipboard 库

- [zenorocha/clipboard.js](https://github.com/zenorocha/clipboard.js) 基于 `document.execCommand` 封装，不依赖框架
- [Inndy/vue-clipboard2](https://github.com/Inndy/vue-clipboard2) 基于上面这个封装的一个 `vue` 的库，导出了指令供使用

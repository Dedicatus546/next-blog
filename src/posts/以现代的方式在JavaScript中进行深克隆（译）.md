---
title: 以现代的方式在JavaScript中进行深克隆（译）
tags:
  - Deep Clone
  - JavaScript
categories:
  - 译文
key: 1703599853date: 2023-12-26 22:10:53
updated: 2023-12-26 22:10:53
---

# 前言

原文地址：[Cloning Objects in JavaScript, the Modern Way](https://www.builder.io/blog/structured-cloneDeep)

<!-- more -->

![](https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F03f2036674724006ae64d9bc4d07ab6d?format=webp&width=1600)

# 正文

你知道现在在 JavaScript 中已经有一个原生的方法可以深度克隆对象了吗？

没错， JavaScript 的运行时内建了这个方法，就是 `structuredClone` ：

```javascript
const calendarEvent = {
  title: "Builder.io Conf",
  date: new Date(123),
  attendees: ["Steve"]
}

// 😍
const copied = structuredClone(calendarEvent)
```

你可能留意到了在上面的例子中，我们不仅拷贝了一个对象，而且包含了嵌套的数组，甚至是一个 `Date` 对象。

对这些类型的克隆也和预期一致：

```javascript
copied.attendees // ["Steve"]
copied.date // Date: Wed Dec 31 1969 16:00:00
cocalendarEvent.attendees === copied.attendees // false
```

没错，但 `structuredClone` 不仅能支持上面的情况，还能：

- 克隆无限嵌套的对象或者数组。
- 克隆循环引用。
- 克隆各种各样的 JavaScript 类型，比如 `Date` ， `Set` ， `Map` ， `Error` ， `RegExp` ， `ArrayBuffer` ， `Blob` ， `File` ， `ImageData` [等等](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types)。
- 转移任何[可以转移的对象](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)。

所以，拷贝下面的例子的对象虽然有点疯狂，但 `structuredClone` 却能按预期工作：

```javascript
const kitchenSink = {
  set: new Set([1, 3, 3]),
  map: new Map([[1, 2]]),
  regex: /foo/,
  deep: { array: [ new File(someBlobData, 'file.txt') ] },
  error: new Error('Hello!')
}
kitchenSink.circular = kitchenSink

// ✅ 完美，完全深度地复制
const clonedSink = structuredClone(kitchenSink)
```

## 为什么不用对象展开？

要注意到我们谈论的是深度复制。如果你只是需要一个浅复制，及不用复制嵌套的对象或者数据，那我们就可以使用对象展开：

```javascript
const simpleEvent = {
  title: "Builder.io Conf",
}
// ✅ 正常工作，这里并没有嵌套的对象或者数组
const shallowCopy = { ...calendarEvent }
```

或者你更喜欢其他的方式：

```javascript
const shallowCopy = Object.assign({}, simpleEvent)
const shallowCopy = Object.create(simpleEvent)
```

但是一旦我们需要复制嵌套的项的时候，我们就会遇到问题：

```javascript
const calendarEvent = {
  title: "Builder.io Conf",
  date: new Date(123),
  attendees: ["Steve"]
}

const shallowCopy = { ...calendarEvent }

// 🚩  "Bob" 添加到了复制的对象和原始的对象中，它们是同一个引用
shallowCopy.attendees.push("Bob")

// 🚩 更新了复制的对象和原始的对象的 date ，它们是同一个引用
shallowCopy.date.setTime(456)
```

就如你看到的那样，我们无法通过对象展开来完全拷贝一个这样的对象。

嵌套的日期对象或者数据在两者间仍然是一个共享的引用，如果我们在编辑时认为这些操作只是更新了复制的 `calendarEvent` 对象的话，那么会带来严重的问题。

## 为什么不用 `JSON.parse(JSON.stringify(x))` ？

是的，这种方式实际上是一个很棒的方式，它的性能出奇地好，但是存在一些 `structuredClone` 已经解决的问题。

比如下面这个例子：

```javascript
const calendarEvent = {
  title: "Builder.io Conf",
  date: new Date(123),
  attendees: ["Steve"]
}

// 🚩 JSON.stringify 把 date 转成一个字符串了
const problematicCopy = JSON.parse(JSON.stringify(calendarEvent))
```

如果我们打印 `problematicCopy` ，我们会看到：

```json5
{
  title: "Builder.io Conf",
  date: "1970-01-01T00:00:00.123Z",
  attendees: ["Steve"]
}
```

这不是我们想要的！ `date` 字段应该是一个 `Date` 对象，而不是一个字符串。

出现这种情况的原因是 `JSON.stringify` 只能处理基本的对象、数组和基本的类型。任何其他的类型会以难以预测的方式进行处理。就比如 `Date` 会被转化成字符串，但一个 `Set` 对象就会被简单地转化为 `{}` 。

`JSON.stringify` 甚至会完全忽略某些东西，比如 `undefined` 或者函数。

比如，如果我们使用 `JSON.stringify` 拷贝 `kitchenSink` 变量的话：

```javascript
const kitchenSink = {
  set: new Set([1, 3, 3]),
  map: new Map([[1, 2]]),
  regex: /foo/,
  deep: { array: [ new File(someBlobData, 'file.txt') ] },
  error: new Error('Hello!')
}

const veryProblematicCopy = JSON.parse(JSON.stringify(kitchenSink))
```

我们会得到：

```json
{
  "set": {},
  "map": {},
  "regex": {},
  "deep": {
    "array": [
      {}
    ]
  },
  "error": {}
}
```

呃。

哦对了，我们还必须删除我们最初需要的循环引用，因为 `JSON.stringify` 在遇到它们时会简单地抛出错误。

所以，如果我们的需求符合它的功能，那么这种方式很棒。我们可以用 `structuredClone` 来做很多 `JSON.stringify` 做不到的事情。

## 为什么不用 `_.cloneDeep` ？

如今， Lodash 的 `cloneDeep` 函数已经是解决该问题的一个非常常见的方法。

事实上它也按预期工作：

```javascript
import cloneDeep from 'lodash/cloneDeep'

const calendarEvent = {
  title: "Builder.io Conf",
  date: new Date(123),
  attendees: ["Steve"]
}

const clonedEvent = cloneDeep(calendarEvent)
```

但是这会有一个警告。根据 IDE 里的 [Import Cost](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost) 插件打印的导入占用大小，这一个函数压缩后的大小为 17.4kb （压缩后为 5.3kb ）：

![](https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2Faa5ab14fd21741bf8e327dd6e6fb68b1?format=webp&width=1600)

假设你只是需要导入这个函数，如果你使用了更加常见的导入方式，那么你不会意识到 Tree-Shaking 并不总是按你的期望工作，你可能会在不经意间为这个函数导入多达 [25kb](https://bundlephobia.com/package/lodash@4.17.21) 的内容。

![](https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F5dbbee190753414bb31b720059a501db?format=webp&width=2000)

虽然对任何人来说这都不算“世界末日”，但是在我们的例子中根本没有必要，因为浏览器早已内置了 `structuredClone` 了。

## `structuredClone` 不能克隆什么？

### 函数无法被克隆

尝试克隆函数则会抛出一个 `DataCloneError` 异常：

```javascript
// 🚩 错误！
structuredClone({ fn: () => { } })
```

### DOM 节点无法被克隆

尝试克隆 DOM 节点也会抛出一个 `DataCloneError` 异常：

```javascript
// 🚩 错误！
structuredClone({ el: document.body })
```

### 属性描述符， setter 和 getter

类似元数据之类的特性都无法被克隆。

比如，对于一个 getter ，克隆的是它的返回值，而不是 getter 函数自身（或者任何其他的属性元数据）：

```javascript
structuredClone({ get foo() { return 'bar' } })
// Becomes: { foo: 'bar' }
```

### 对象原型

原型链不会被遍历或者是复制。所以如果你克隆一个 `MyClass` 的实例，克隆后的对象不再是 `MyClass` 的一个实例（但该类所有合法的属性都会被克隆）：

```javascript
class MyClass { 
  foo = 'bar' 
  myMethod() { /* ... */ }
}
const myClass = new MyClass()

const cloned = structuredClone(myClass)
// Becomes: { foo: 'bar' }

cloned instanceof myClass // false
```

### 所有支持克隆的类型

简单地讲，任何未在下面列表的类型都无法被克隆：

#### [JS 内建类型](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types)

`Array` ， `ArrayBuffer` ， `Boolean` ， `DataView` ， `Date` ， `Error` 类型 (下文有详细的列表)， `Map` ， `Object` 类型的简单对象 (比如，字面对象) ， [基本类型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#primitive_values)，但要除去 `symbol` (也就是包括 `number` ， `string` ， `null` ， `undefined` ， `boolean` ， `BigInt`)， `RegExp` ， `Set` ， `TypedArray` 。

#### 错误类型

`Error` ， `EvalError` ， `RangeError` ， `ReferenceError` ， `SyntaxError` ， `TypeError` ， `URIError` 。

#### [Web/API 类型](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#webapi_types)

`AudioData` ， `Blob` ， `CryptoKey` ， `DOMException` ， `DOMMatrix` ， `DOMMatrixReadOnly` ， `DOMPoint` ， `DomQuad` ， `DomRect` ， `File` ， `FileList` ， `FileSystemDirectoryHandle` ， `mFileHandle` ， `FileSystemHandle` ， `ImageBitmap` ， `ImageData` ， `RTCCertificate` ， `VideoFrame` 。

### 浏览器和运行时的支持情况

这一节就是大家最关心的部分了，主流的浏览器，以及 Node 和 Deno ，都支持 `structuredClone` 。

不过要留意 Web Workers 中支持情况：

![](https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F1fdbc5b0826240e487a4980dfee69661?format=webp&width=2000)

来源：[MDN](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) 。

## 结论

虽然已经过去了很长的时间了，但我们最终有了 `structuredClone` ，可以在 JavaScript 中轻松地克隆对象。

## 关于我

我是 [Steve](https://twitter.com/Steve8708?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor) ， [Builder.io](https://www.builder.io/) 的 CEO 。

我们提供了一种拖拽组件的方式，通过这种方式来在你的站点或者 APP 上创建页面和其他 CMS 内容。

你可以[点击此处](https://www.builder.io/blog/headless-cms-workflow)详细了解如何改进你的工作流。

你会觉得有趣或者有用的。

# 后记

深拷贝的话，我一般都用 `JSON.parse(JSON.stringify(obj))` ，很多时候对象的结构基本都是字面对象，这种方式基本上符合要求了，而且兼容性好，不用引入外部的包

`structuredClone` 一直没用过，因为我都不知道有这个 API ，以后可以在代码里用一用了~
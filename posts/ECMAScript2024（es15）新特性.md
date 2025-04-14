---
title: ECMAScript2024（es15）新特性
tags:
  - JavaScript
categories:
  - 笔记
date: 2024-11-25 15:04:25
updated: 2024-11-28 15:07:45
key: 1732777665
---


# 前言

ECMAScript2024（es15）新特性

参考文章：

- [ECMAScript 2024: What’s new?](https://2ality.com/2024/06/ecmascript-2024.html)
- [Regular expressions (RegExp)](https://exploringjs.com/js/book/ch_regexps.html#regexp-flag-unicode-sets)

<!-- more -->

# 正文

## Map.groupBy() 和 Object.groupBy()

官方支持的分组函数，再也不用引入 [lodash.groupBy](https://www.lodashjs.com/docs/lodash.groupBy) 了。

为什么要定义两个方法呢，其实是两者都是将可迭代对象转为 `Map` 或者 `Object` ，`Map.groupBy()` 返回一个 `Map` ，而 `Object.groupBy()` 返回一个 `Object` 。

`Map.groupBy()` 和 `Object.groupBy() `的参数都为一个可迭代对象以及一个分组函数。

`Map.groupBy()` 例子：

```javascript
const map = Map.groupBy([-3, -2, -1, 0, 1, 2, 3], (item, index) => {
  return item === 0 ? '=0'
    : item > 0 
      ? '>0'
      : '<0' 
});

console.log(map);
```

结果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/11/25/20241125155005264.avif)

注意这里返回的分组函数为键的值，这些值会作为 `Map` 的 `key` 或者 `Object` 的属性名。

`Object.groupBy()` 例子：

```javascript
const obj = Object.groupBy([-3, -2, -1, 0, 1, 2, 3], (item, index) => {
  return item === 0 ? '=0'
    : item > 0
      ? '>0'
      : '<0'
});

console.log(obj);
```

结果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/11/25/20241125155157094.avif)


## Promise.withResolvers() 

某些时候，我们需要把 Promise 的 `resolve` 和 `reject` 提取到参数外，一般我们会封装如下的方法：

```javascript
const createPromise = () => {
  let resolve, reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject,
  };
}
```

这样我们可以把 `resolve` 和 `reject` 当作普通函数一样用于其他的文件的任何位置。

现在官方也是直接支持了这个方法，又可以少写几行代码了：

```javascript
const { promise, resolve, reject } = Promise.withResolvers();

promise.then(() => {
  console.log('resolve')
});

// 一个脱离 Promise 包装器的函数，可以解决 promise
// 输出 'resolve'
resolve();
```

## 正则的 /v 标志

正则相关的升级， `/v` 为 `/u` 模式的升级，对 unicode 的支持更加完善。

在 `/u` 模式下，对应的是否开启字段为 `RegExp.prototype.unicode` ， 而 /v 为 `RegExp.prototype.unicodeSets` 。

如果你用正则比较多，那么只要知道如果需要处理 unicode 的话，使用 `/v` 而不用 `/u` 了（如果环境支持，这两者互斥，不要一起使用）。 `/v` 支持 `/u` 的所有特性。

### 多码点 unicode 支持

`/u` 模式对多码点的 unicode 支持不完善，比如：

```javascript
/^\p{Emoji}$/u.test('😵‍💫'); // false，这个 emoji 为三码点
/^\p{Emoji}$/u.test('😡'); // true
```

改为 `/v` 之后，切换为 `RGI_Emoji` （Recommended for General Interchange (RGI) Emoji ，在 unicode 标准中定义）即可正常：

```javascript
/^\p{RGI_Emoji}$/v.test('😵‍💫'); // true
```

### \q 字符串匹配

`/v` 提供了新的 `\q` 来匹配字符串，如下：

```javascript
/^[\q{😵‍💫}]$/v.test('😵‍💫') // true
/^[\q{abc|def}]$/v.test('abc') // true
```

### 字符集的集合操作

`/v` 提供了新的字符集的集合操作

首先是支持嵌套的 `[]` ：

```javascript
/^[\d\w]$/v

// 等同于

/^[[0-9][A-Za-z0-9_]]$/v
```

默认并排写为并集操作：

```javascript
/^[[0-9][A-Z]]$/v.test('0'); //true
/^[[0-9][A-Z]]$/v.test('A'); //true
```

使用 `--` 来排除某些字符：

```javascript
/^[\w--[a-g]]$/v.test('a');

// 等同于

/^[[A-Za-z0-9_]--[a-g]]$/v;

/^[[A-Za-z0-9_]--[a-g]]$/v.test('a'); // false
```

使用 `&&` 来匹配交叉的字符：

```javascript
// 5-6 为交叉部分
/^[[0-6]&&[5-9]]$/v.test('5'); // true
/^[[0-6]&&[5-9]]$/v.test('6'); // true
/^[[0-6]&&[5-9]]$/v.test('7'); // false
```

## ArrayBuffer 和 SharedArrayBuffer

`ArrayBuffer` 和 `SharedArrayBuffer` 现在是可变长度（需要额外指定 `maxByteLength` 参数）的

```javascript
const buffer = new ArrayBuffer(2, { maxByteLength: 4 })
```

### resize()

可以通过新的 `resize` 方法原地改变大小，但注意不能超过设置的 `maxByteLength` ：

```javascript
const buf = new ArrayBuffer(2, { maxByteLength: 4 });

console.log(buf.byteLength) // 2

buf.resize(4);

console.log(buf.byteLength) // 4
```

`ArrayBuffer` 的 `resize` 只要不超过 `maxByteLength` ，无论是变大还是变小都可以，而 `SharedArrayBuffer` 只能在不超过 `maxByteLength` 的情况下不断变大。

### transfer()

该方法可以理解为创建了另一个 `ArrayBuffer` ，但是是基于零拷贝移动或 realloc 方式的，简单点讲就是将内存的管理权转给了新的 `ArrayBuffer` 对象，即调用这个方法后，原 `ArrayBuffer` 对象就无法访问了，这和与 `Web Worker` 或 `Service Worker` 传输 `ArrayBuffer` 的过程是类似的。

一个 `ArrayBuffer` 在被转移后， `byteLength` 会变为 `0` ，并且所有实例方法都会报错，如果需要检测一个 `ArrayBuffer` 是否已被转移，可以通过 `detached` 属性。

## isWellFormed() 和 toWellFormed()

### isWellFormed()

`isWellFormed` 用来检测字符串是否被正确地编码，在 JavaScript 中，字符串是 UTF-16 编码的，而 UTF-16 的辅助平面会占用四个字节，分为前导代理和后导代理，这个函数就是来检测是否存在单独的代理的。比如：

```javascript
"ab\uD800".isWellFormed(); // false
"\uDFFFab".isWellFormed(); // false
"ab\uD83D\uDE04c".isWellFormed(); // true
```

### toWellFormed()

`toWellFormed` 会将单独的代理对全部转化为 `U+FFFD` ，即替换字符（Replacement Character），该字符表现为一个问号（`�`）。这样可以确保字符串的编码正确。

```javascript
"ab\uD800".toWellFormed(); // 'ab�'
"\uDFFFab".toWellFormed(); // '�ab'
```

## Atomics.waitAsync()

该函数支持异步等待对内存的操作，即 `Atomics.wait` 的异步版本，它解决了 `Atomics.wait` 同步阻塞当前线程的问题，如下：

```javascript
const sharedBuffer = new SharedArrayBuffer(1024);
const int32Array = new Int32Array(sharedBuffer);

// 等待值从 0 改变
// 异步，不会阻塞接下来的代码
const res = Atomics.waitAsync(int32Array, 0, 0, 2000)

console.log(res); // true
res.value.then((result) => {
  console.log(result); // 'ok' ，表示值没有变化，其他值为 'not-equal' 和 'timed-out'
}).catch((error) => {
  console.error(error);
});

setTimeout(() => {
  // 原子修改操作，但是值不变
  Atomics.store(int32Array, 0, 0);
  // 唤醒所有等待的 promise
  Atomics.notify(int32Array, 0);
}, 500);
```
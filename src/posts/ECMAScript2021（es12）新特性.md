---
title: ECMAScript2021（es12）新特性
date: 2024-12-26 15:29:54
updated: 2024-12-26 15:29:54
tags:
  - JavaScript
categories:
  - 笔记
key: 1734011336
---


# 前言

ECMAScript2021（es12）新特性。

<!-- more -->

# 正文

## 逻辑赋值运算符

有三个，分别是 `&&=` ， `||=` ， `??=` 。

`&&=` 为左侧变量为真值时，将右侧的值赋给左边，例子如下：

```javascript
let a = 1;

a &&= 2; // 输出 2
// 等效于
a && (a = 2);
```

`||=` 为左侧变量为假值时，将右侧的值赋给左边，例子如下：

```javascript
let a = 0;

a ||= 2; // 输出 2
// 等效于
a || (a = 2);
```
这里的假值为 [Falsy](https://developer.mozilla.org/zh-CN/docs/Glossary/Falsy)

`??=` 可以理解为 `||=` 的一个严格版本，首先 `??` 为 es11 引入的空值操作符，它的检测的值为 `null` 和 `undefined` ，这两个值在虚值的范围内，例子如下：

```javascript
let a = undefined;

a ??= 2 // 输出 2
// 等效于
a ?? (a = 2);
```

## 数值分隔符

让数字更加可读，比如以万分割，例子如下：

```javascript
const o = 1000_0000; // 1000 万
```

感觉一般用不到...

## String.prototype.replaceAll

字符串的替换操作，和 `String.prototype.replace` 的区别就是第一个参数为字符串时可以替换全部了，比如：

```javascript
"123123".replace("123", "==="); // 输出 ===123
"123123".replaceAll("123", "==="); // 输出 ======
```

在第一个参数为正则的时候，务必对正则添加 `g` 模式，不然会出现报错。

```javascript
"123123".replaceAll(/\d/, "="); // 报错
"123123".replaceAll(/\d/g, "="); // 正确，输出 ======
```

## Promise.any

Promise 上新的静态方法，依然是用来处理多个 Promise 并发时的情景， `Promise.any` 只要参数中有一个已被 resolve 的 Promise ，那么整个 Promise 就会被 resolve ，如果参数为空或者所有的 Promise 都被 reject ，那么整个 Promise 就被 reject 。例子如下：

```javascript
Promise.any([
  Promise.resolve(1),
  Promise.reject("error")
]).then((res) => {
  console.log("resolve", res); // res 为 1
});

// 空参数
Promise.any([]).then(() => {}, (err) => {
  console.error(err); 
  // 输出 
  // [AggregateError: All promises were rejected] { [errors]: [] }
});

// 所有 promise 都 reject
Promise.any([
  Promise.reject("error1"),
  Promise.reject("error2")
]).then(() => {}, (err) => {
  console.error(err); 
  // 输出 
  // [AggregateError: All promises were rejected] {
  //   [errors]: [ 'error1', 'error2' ]
  // }
});
```

这里的某个 Promise resolve 是有时间顺序的，也就是第一个被 resolve 的 Promise 会 resolve 整个 Promise ，例子如下：

```javascript
const delayResolve = (timeout, val) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout, val);
  });
}

Promise.any([
  Promise.reject("立即 reject"),
  delayResolve(1000, "1 秒延迟"),
  delayResolve(2000, "2 秒延迟")
]).then(res => {
  console.log("resolve", res); // res 为 "1 秒延迟"
});
```

## WeakRef

这个特性应该是比较高级的特性了， `WeakRef` 允许用户持有一个对象的弱引用，弱引用使得该引用不会影响 GC （垃圾回收）。用法如下：

```javascript
// 这里 target 为一个强引用
let target = {
  a: 1,
  b: 2,
};

const weakRef = new WeakRef(target);
console.log(weakRef.deref()); // 对象还存在

// 去除对象引用
target = null;

globalThis.gc(); // 需要开启 node 的 --expose gc

// 强制等待并检测
setTimeout(() => {
  console.log(weakRef.deref()); // undefined (如果 GC 发生)
}, 5000);
```

## FinalizationRegistry

这个特性和 `WeakRef` 类似，它也持有一个对象的弱引用，当对象被回收的时候执行一个回调函数，用法如下：

```javascript
const registry = new FinalizationRegistry((val) => {
  console.log("被回收了", val);
});

let target = {
  a: 1,
};

registry.register(target, "回调值");

// 去除对象引用
target = null;

globalThis.gc(); // 需要开启 node 的 --expose gc

// 强制等待
setTimeout(() => {}, 5000);
```

注意这里的回调函数的值**不是**持有的对象，而是在 `register` 的时候第二个参数的值，从 `FinalizationRegistry` 的定义上说，回调执行的时候持有的对象已被回收，此时如果再出现在回调参数中也是不对的。
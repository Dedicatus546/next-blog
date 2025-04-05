---
title: ECMAScript2023（es14）新特性
date: 2024-12-28 00:01:23
updated: 2024-12-28 00:01:23
tags:
  - JavaScript
categories:
  - 笔记
key: 1734011336
---


# 前言

ECMAScript2023（es14）新特性。

<!-- more -->

# 正文

## Array.prototype.findLast 和 Array.prototype.findLastIndex

新增了两个数组的方法，这两个方法是逆序版本的 `find` 和 `findIndex` ，用法如下：

```javascript
const array = [1, 2, 3, 2, 4];

array.findLast(item => item === 4); // 输出 4
array.findLastIndex(item => item === 2); // 输出 3
```

## 数组和类数组添加新方法用来返回新的数组

数组的一些方法，比如 `reverse` ， `splice` ， `sort` 都是会更改原来的数组的，如果我们想要让这些方法不修改原数组，我们可以这么写：

```javascript
const array = [1, 2, 3];

array.slice().reverse(); // 通过 slice 返回一个原数组的浅复制副本，然后再调用会修改原数组的方法。

// 或者

array.concat().reverse();
```

es14 添加了这些方法对应的复制版本

- `reverse` -> `toReversed`
- `sort` -> `toSorted`
- `splice` -> `toSpliced`

这些接口和对应的旧接口的参数都是一样的，唯一的区别就是它们返回一个新的数组。

还有一个 `Array.prototype.with` ，它可以修改对应位置的值，然后返回一个新的数组。可以理解为方括号 `[]` 的复制版本，例子如下：

```javascript
const array1 = [1, 2, 3];

array1.toReversed(); // 输出 [3, 2, 1]
array1; // 输出 [1, 2, 3]

const array2 = [4, 5, 6];

array2.toSpliced(0, 1); // 输出 [5, 6];
array2; // 输出 [4, 5, 6]

const array3 = [9, 8, 7];

array3.toSorted(); // 输出 [7, 8, 9];
array3; // 输出 [9, 8, 7]

const array4 = [1, 5, 4];

array4.with(0, 3); // 输出 [3, 5, 4]
array4; // 输出 [1, 5, 4]
```

## #! 顶部注释

这个特性允许 js 文件在顶部编写 `#!` 来指定解释器，在 linux 中用的比较多，这样可以直接执行该文件，而不用通过 node 启动。

```javascript
#!/usr/bin/env node
// index.js
console.log("Hello, World!");
```

然后通过 `chmod +x index.js` 将该文件设置为可执行的，戒指直接在控制台输入 `./index.js` 即可执行。

这个对于搬砖码农用处应该不大，了解即可。

## WeakMap 支持 Symbol 键

在 es14 之前， WeakMap 的键只支持复杂对象，WeakMap 的键都是弱引用，意味着不会阻止对象被 GC （垃圾回收）。

es14 使得 WeakMap 的键支持**非全局注册**的 Symbol 对象，例子如下：

```javascript
const weakMap = new WeakMap();

const symbolKey = Symbol('symbol 键');
const value = {};

weakMap.set(symbolKey, value);
```

这里的全局注册的 Symbol 对象是指通过 `Symbol.for` 注册的对象，这些是不能用于 WeakMap 的键的，会报错，例子如下：

```javascript
const weakMap = new WeakMap();

// 全局注册的 Symbol 键
const symbolKey = Symbol.for('symbol 键');
const value = {};

weakMap.set(symbolKey, value); // 报错
```
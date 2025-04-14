---
title: ECMAScript2020（es11）新特性
date: 2024-12-24 17:25:28
updated: 2024-12-25 23:43:34
tags:
  - JavaScript
categories:
  - 笔记
key: 1734011336
---



# 前言

ECMAScript2020（es11）新特性。

<!-- more -->

# 正文

## 可选链

在 es11 之前，如果想要读取一个对象的深层的属性，并且需要防止 `null` 或者 `undefined` 错误，一般我们会写下如下的代码：

```javascript
const o = {
  a: {
    b: {
      c: {
        d: 1
      }
    }
  }
};

const val = o 
  ? o.a 
    ? o.a.b 
      ? o.a.b.c 
        ? o.a.b.c.d 
        : undefined
      : undefined
    : undefined
  : undefined;
```

或者我们使用 `&&` 的短路特性：

```javascript
const o = {
  a: {
    b: {
      c: {
        d: 1
      }
    }
  }
};

const val = o && o.a && o.a.b && o.a.b.c && o.a.b.c.d;
```

当然这两种形式都一个问题，那就是链上的值不能是 [Falsy（虚值）](https://developer.mozilla.org/zh-CN/docs/Glossary/Falsy) ，如果存在这种情况，你还得手动判断 `null` 和 `undefined` ，比如下面这样：

```javascript
const o = {
  a: {
    b: {
      c: {
        d: 1
      }
    }
  }
};

const isNullOrUndefined = (val) => {
  return val === null || val === undefined;
}

const val = isNullOrUndefined(o)
  ? isNullOrUndefined(o.a)
    ? isNullOrUndefined(o.a.b)
      ? isNullOrUndefined(o.a.b.c)
        ? o.a.b.c.d
        : undefined
      : undefined
    : undefined
  : undefined;
```

这几种形式只能说是差强人意。所以 es11 提供了可选链的语法，高效地来处理这种情况。

可选链有三种形式，分别为

- 直接属性名 `a?.propertyName`
- 方括号 `a?.[propertyName]`
- 函数调用 `a?.()`

在可选链前的对象为 `null` 和 `undefined` 的情况下，表达式会直接返回 `undefined` ，并且后续的可选链都不会执行，其实它就是等效于上面的 `isNullOrUndefined` 的写法。它的用法如下：

```javascript
const o = {
  a: {
    b: {
      c: {
        d: 1
      }
    }
  }
};

const val = a?.b?.c?.d;
```

可选链只会在值为 `null` 和 `undefined` 的情况下短路，对 Falsy 值也会直接调用：

```javascript
const o = false;

o?.toString(); // 输出 "false" 而不是 undefined
```

## 空值合并

在 es11 前，如果想要判断一个值是不是 `undefined` 或者 `null` ，可以用如下的形式：

```javascript
const o = undefined;

// 宽松相等
if (o == null) {
  // 做一些操作
}

// 或者

if (o === undefined || o === null) {
  // 做一些操作
}
```

如果只是简单的赋值操作，还可以使用三元表达式：

```javascript
const o = undefined;

const val = o == null ? "嘻嘻" : "不嘻嘻";
// 或者
const val = o === undefined || o === null ? "嘻嘻" : "不嘻嘻";
```

写法上还是有些繁琐，所以引入了 `??` 的操作符，当左侧的值为 `null` 或者 `undefined` ，则返回右侧的值，否则返回左侧的值。

```javascript
const o === undefined;

const val = o ?? "不嘻嘻"; // 输出 "不嘻嘻"
```

注意，空值操作符 `??` 有**短路特性**，这意味着如果 `??` 右侧为一个函数，如果 `??` 左边不为 `null` 和 `undefined` ，右侧的函数就不会执行，代码如下：

```javascript
const fn = () => {
  console.log("执行了");
}

const o = 2;

const val = o ?? fn(); // 无输出
```

## globalThis 全局对象

标准化了全局对象，在这个特性之前，如果我们要读取环境的全局对象，一般会写如下的胶水代码：

```javascript
(function() {
  // web worker
  if (typeof self !== 'undefined') {
    self.globalThis = self;
  } 
  // 浏览器
  else if (typeof window !== 'undefined') {
    window.globalThis = window;
  }
  // node 
  else if (typeof global !== 'undefined') {
    global.globalThis = global;
  } 
  // 非严格模式
  else {
    this.globalThis = this;
  }
})();
```

当然，这种垫片有一些局限性，具体可以查看这篇文章：[ A horrifying globalThis polyfill in universal JavaScript](https://mathiasbynens.be/notes/globalthis )，或者阅读掘金上的译文：[【译】一种令人震惊的 globalThis JavaScript Polyfill 通用实现](https://juejin.cn/post/6904958153503277069)。

而在 es11 后，只要使用 globalThis 即可直接访问全局的对象，浏览器下为 `window` ， `frames` ， `self` ， node 下为 `global`。

## BigInt 基本类型

由于 js 的整数值是基于 IEEE 754 实现的，所以如果表示大整数的话会有误差。在 js 中，安全的整数范围为 `Number.MIN_SAFE_INTEGER` 到 `Number.MAX_SAFE_INTEGER` ，具体的值为 -9007199254740991 到 9007199254740991 。

如果超出了这个范围，整数的计算便不再完全可靠，比如：

```javascript
const b = Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2; // 输出 true
```

在使用了大数类型后，可以避免该错误：

```javascript
const b = BigInt(Number.MAX_SAFE_INTEGER) + 1n === BigInt(Number.MAX_SAFE_INTEGER) + 2n; // 输出 false
```

在使用大数类型时，有几个需要特别注意的点：

- 不能与 Number 类型混合运算，比如 `1n + 2` 不然报错。
- 不能使用 Math 的方法，比如 `pow` ，不然报错。
- 转为 Number 可能造成精度丢失。

## 动态 import

提供了一种异步加载模块文件的特性，如果使用过 vue-router 的动态路由，那么应该对这种语法很熟悉，本质就是 import 一个额外的模块，返回一个 Promise ，模块加载完成后会 resolve 该 Promise ，进而执行相应的操作。

```javascript
// util.js
export const add = (a, b) => {
  return a + b;
}
```

```html
<!-- index.html -->
<script type="module">
const load = () => {
  import("./util.js").then((module) => {
    // 使用 module
  }, (err) => {
    // 加载错误
  })
}
</script>
```

要注意该特性只能在模块环境下使用，即 package.json 中的 `type` 为 `module` ，或者文件扩展名为 `mjs` ，或者 `script` 标签指定 `type` 为 `module` 。

## 规范 for-in 顺序

在 es11 之前，如果使用 for-in 遍历一个对象的属性，那么遍历的顺序可能存在差异。而 es11 统一了该顺序，即：

- 将所有非负整数键按升序遍历
- 所有字符串键按创建的顺序升序遍历

例子如下：

```javascript
const o = {
  b: 1,
  a: 2,
  "-2": 3,
  "-1": 4,
  // 符号键会被忽略
  [Symbol("z")]: 5,
  2: 6,
  1: 7,
}

for (const key in o) {
  console.log(key);
}
// 输出 1 2 b a -2 -1
```

需要注意这个方法会把原型链上可枚举的属性也遍历出来，如下：

```javascript
// 指定 o 的原型
const o = Object.create({
  protoKey1: 1,
  protoKey2: 2,
});

// o 本身的属性
o.key1 = 3;

for (const key in o) {
  console.log(key);
}

// 输出
// key1
// protoKey1
// protoKey2
```

for-in 在读取原型链对象上的属性和自身的属性是分开排序的，也就是说先排序自身的属性，完成后，找到原型链上的对象，然后排序原型链对象自身的属性，依次类推，所以可以看到上图的结果为 `key1 protoKey1 protoKey2` ，而非 `protoKey1 protoKey2 key1` ，如果规则是全部属性读取之后再排序的话， `protoKey1` 和 `protoKey2` 理应就在 `key1` 的前面了。

由于它会读取原型链上的属性的特性，一般而言不使用它，而是通过 `Object.keys` 来拿到自身的键（和 for-in 具有相同的顺序）后再进行遍历。

虽然 for-in 可以遍历数组，但是不建议使用，因为 for-in 为属性遍历，原型链上的值会影响遍历结果，建议只使用 for-of ，它是基于迭代器的。

## Promise.allSettled

新增的 Promise 的静态函数，它和 `Promise.all` 的区别就是， `Promise.allSettled` 下即使某个 Promise reject 了也不会影响整个 Promise resolve 。 `Promise.allSettled` 生成的 Promise 对象只会被 resolve 。

```javascript
Promise.all([
  Promise.resolve(1),
  Promise.reject("错误")
]).catch(err => {
  console.log(err); // 输出 错误
});

Promise.allSettled([
  Promise.resolve(1),
  Promise.reject("错误")
]).then(res => {
  console.log(res); 
  // 输出 
  // [
  //   { status: 'fulfilled', value: 1 },
  //   { status: 'rejected', reason: '错误' }
  // ]
});
```

这个接口比较适合一些关联度不高的并发 Promise ，比如首页获取不同板块的数据，某个板块错误一般是不影响其他板块的显示的，只需要在 `then` 中判断是哪个板块错误做对应的流程即可。

## String.prototype.matchAll

返回和正则对象匹配的所有结果，包括捕获组，例子如下：

```javascript
const regexp = /t(?<g1>e)(?<g2>st(?<g3>\d?))/g;
const str = 'test1test2';

const array = [...str.matchAll(regexp)];
// 输出
// [
//   [
//     'test1',
//     'e',
//     'st1',
//     '1',
//     index: 0,
//     input: 'test1test2',
//     groups: [Object: null prototype] { g1: 'e', g2: 'st1', g3: '1' }
//   ],
//   [
//     'test2',
//     'e',
//     'st2',
//     '2',
//     index: 5,
//     input: 'test1test2',
//     groups: [Object: null prototype] { g1: 'e', g2: 'st2', g3: '2' }
//   ]
// ]
```

如果使用 `String.prototype.match` （ `g` 模式），则不会输出捕获组，而且返回值为数组或 `null` 而非迭代器：

```javascript
const regexp = /t(?<g1>e)(?<g2>st(?<g3>\d?))/g;
const str = 'test1test2';

const array = str.match(regexp);
// 输出 [ 'test1', 'test2' ]
const array2 = "".match(regexp);
// 输出 null
```

可以把它理解为 `RegExp.prototype.exec` 的循环版：

```javascript
const regexp = /t(?<g1>e)(?<g2>st(?<g3>\d?))/g;
const str = 'test1test2';
let match;
const results = [];

while ((match = regex.exec(str)) !== null) {
  results.push(match);
}

// results 输出
// [
//   [
//     'test1',
//     'e',
//     'st1',
//     '1',
//     index: 0,
//     input: 'test1test2',
//     groups: [Object: null prototype] { g1: 'e', g2: 'st1', g3: '1' }
//   ],
//   [
//     'test2',
//     'e',
//     'st2',
//     '2',
//     index: 5,
//     input: 'test1test2',
//     groups: [Object: null prototype] { g1: 'e', g2: 'st2', g3: '2' }
//   ]
// ]
```
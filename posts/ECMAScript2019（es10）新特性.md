---
title: ECMAScript2019（es10）新特性
date: 2024-12-23 16:06:35
updated: 2024-12-26 15:57:35
tags:
  - JavaScript
categories:
  - 笔记
key: 1734011336
---


# 前言

ECMAScript2019（es10）新特性。

<!-- more -->

# 正文

## Array.prototype.flat

该函数可以帮助我们打平一个数组，即如果一个数组内存在数组元素，调用它就可以把该数组元素中的元素放到原数组内，比如：

```javascript
[1, 2, 3, [4, 5]].flat(); // 输出 [1, 2, 3, 4, 5]
```

该方法不会修改原来的数组，在默认的情况下，它只会打平第一层的数组，即 `flat(1)` ，如果想要打平所有数组元素（无论多深），可以将参数设置为 `Number.MAX_SAFE_INTEGER` ，比如：

```javascript
[1, 2, 3, [4, 5, [6, 7, [8, 9]]]].flat(Number.MAX_SAFE_INTEGER); // 输出 [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

如果原数组内存在一些空值（empty 值），则 `flat` 会忽略这些值，比如：

```javascript
[1, , 3, , 4, [5, , 6]].flat(); // 输出 [1, 3, 4, 5, 6]
```

这个忽略只会影响到打平的层数，比如默认打平一层，那么忽略这些空值只会在最外层和第一层，而第二层（即第一层内的数组元素）则不会受影响。

```javascript
[1, , 3, , 4, [5, , 6, [7, , 8]]].flat(); // 输出 [1, 3, 4, 5, 6, [7, , 8]]
```

可以理解为**浅拷贝**了一个数组，如果某个数组元素不会被打平，那么它只会被简单地赋值过来，也就是原来是什么样的，结果里面就是什么样的。

## Array.prototype.flatMap

这个函数为 `flat` 和 `map` 的结合。要注意，这里是先 `map` 再 `flat` ，而不是先 `flat` 再 `map` ，很容易被函数名给诱导到，它的参数和 `map` 一样，同时它的 `flat` 只打平一层，即 `[].flatMap()` 可以等效于 `[].map().flat()` 。例子如下：

```javascript
[1, 2, 3, 4].flatMap(item => [item + item, item * item]); // 输出 [2, 1, 4, 4, 6, 9, 8, 16]

// 上面的等效于下面
[1, 2, 3, 4].map(item => [item + item, item * item]).flat();

// [1, 2, 3, 4].map(item => [item + item, item * item]) 的值为 [[2, 1], [4, 4], [6, 9], [8, 16]]
// 然后
// [[2, 1], [4, 4], [6, 9], [8, 16]].flat() 的值为 [2, 1, 4, 4, 6, 9, 8, 16]
```

PS： `Array` 上的迭代的方法，比如 `forEach` ， `map` ， `filter` 等，都存在第二个参数，这个参数可以指定回调的 this 的值，不过一般我们都是用箭头函数，所以这个参数基本用不到。

## Object.fromEntries

这个方法为 `Object.entries` 的逆操作，它的参数为一个可迭代的对象，可迭代对象的定义可以在 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#%E5%8F%AF%E8%BF%AD%E4%BB%A3%E5%8D%8F%E8%AE%AE) 上查看。一般而言，我们基本上传入 map 或者数组，比如：

```javascript
Object.fromEntries([["a", 1], ["b", 2]]); // 输出 { a: 1, b: 2 }

const map = new Map();
map.set("a", 1);
map.set("b", 2);
Object.fromEntries(map); // 输出 { a: 1, b: 2 }
```

## String.prototype.trimStart 和 String.prototype.trimEnd

这个方法为 `String.prototype.trim` 的细化，默认情况下， `trim` 会移除开头和结尾的空格，而 `trimStart` 为移除开头的空格， `trimEnd` 为移除结尾的空格，例子如下：

```javascript
"  1234   ".trim(); // 输出 "1234"
"  1234   ".trimStart(); // 输出 "1234   "
"  1234   ".trimEnd(); // 输出 "   1234"
```

## try-catch 省略异常变量

这个特性可以忽略 `catch` 的参数，之前，我们必须声明异常变量，即：

```javascript
try {
  // 一些可能产生异常的操作
  // ...
} catch (e /* 这里必须声明异常变量 */) {

}
```

而这个特性则可以让我们省略异常变量，即：

```javascript
try {
  // 一些可能产生异常的操作
  // ...
} catch {
  // 无需声明异常变量
}
```

这个特性只能说是聊胜于无，少写了几个字符，~~按代码量考核的慎用~~。

## Function.prototype.toString 改进

现在 `Function.prototype.toString` 方法会完整返回源码，包括注释，以及空格，比如：

```javascript
function fn /* 函数名为 fn */ () {
  // 函数的内容
}

fn.toString(); // 输出 'function fn /* 函数名为 fn */ () {\n  // 函数的内容\n}'
```

又是一个看起来有点鸡肋的特性。和日常搬砖没什么关系。

## Symbol.prototype.description 

通过 Symbol 对象的 `description` 属性，可以访问到该对象的描述。

不过这里可能有小伙伴就有疑问了：不是哥们，这个属性放在 `prototype` 上，那不同的 Symbol 不就共享了同一个 `description` 吗🧐？

没错，这也是我刚开始的疑问，经过一番查找后，我找到了官方的解释，其实这个 `Symbol.prototype.description` 它是一个访问器属性，也就是它是一个有 getter 但是没 setter 的属性。在规范上我们可以看到对他的定义：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/12/23/20241223150808316.avif)

可以看到，它的取值是根据 this 来确定的，这样就可以正确区分不同的 Symbol 对象，对于一个 getter ，你可以理解为就是每当读取它的时候，它会执行一段逻辑来获取值，就有点类似调用函数，不过它看起来跟一个属性一样。

在理解这个问题之后，使用它也会变得容易了，比如：

```javascript
const s1 = Symbol("描述1");
const s2 = Symbol("描述2");

s1.description; // 输出 "描述1"
s2.description; // 输出 "描述2"
```

它和 `Symbol.prototype.toString` 的区别就是不会被 `"Symbol()"` 包住，比如：

```javascript
const s1 = Symbol("描述1");

s1.description; // 输出 "描述1"
s1.toString(); // 输出 "Symbol(描述1)"
```

## 优化 JSON.stringify 对非法 Unicode 字符的处理

这个特性是为了让 `JSON.stringify` 在遇到复杂字符，也就是超出 BMP （基本多文种）平面时，正确处理不合法的 Unicode 字符，比如单独的代理对。

可以简单理解为更好地支持 Unicode 字符。比如可以在 node10 和 node23 下执行，下面的代码，可以发现 node10 输出会是乱码，而 node23 正确输出（node12 支持了 es2019 ）：

```javascript
// 合法的 Unicode 代理对，下面两个是等价的。
console.log(JSON.stringify("𝌆")); // node10 乱码 node23 输出 "𝌆"
console.log(JSON.stringify("\uD834\uDF06")); // node10 乱码 node23 输出 "𝌆"

// 不合法的 Unicode 代理对
console.log(JSON.stringify("\uDF06\uD834")); // node10 乱码 node23 输出 "\udf06\ud834"
```

# 后记

ECMAScript 规范的补全计划进行中...
---
title: ECMAScript2018（es9）新特性
key: 1599231985
date: 2020-09-04 23:06:25
updated: 2024-12-26 15:57:35
tags:
  - JavaScript
categories:
  - 笔记
---


# 前言

ECMAScript2018（es9）新特性

<!-- more -->

## `...`扩展运算符

之前`es5`中的`...`只能应用于数组，在`es9`中，开始可以应用于对象了。

在之前，如果需要得到一个对象的浅拷贝。

或者需要重新计算对象的某些属性来替换原来的值，可能需要一个一个字段地去赋值。

而现在只需要使用`...`，问题就可以简单化。

```javascript
const a = { val: 1, age: 22 };
const b = { name: "Dedicatus545", val: 2 };
const c = { ...a, ...b }; // 合并两个对象，写在后面的如果和前面有相同的属性会覆盖掉，在这里b的val就会覆盖a的val
// c = {val: 2, age: 22, name: 'Dedicatus545'}
```

上面这种就是展开一个对象。

之前如果需要从对象中提取某些属性时组合成新对象时，一般都是通过直接定义变量来保存，在丢到新对象里面

```javascript
function fn(a, b) {
  var s1 = a.s1;
  var s2 = a.s2;
  var s3 = b.s3;
  var s4 = b.s4;
  return {
    s1: s1,
    s2: s2,
    s3: s3,
    s4: s4,
  };
}
```

现在可以以更简单的方式进行编写。

```javascript
function fn(a, b) {
  var { s1, s2 } = a;
  var { s3, s4 } = b;
  return {
    s1,
    s2,
    s3,
    s4,
  };
}
```

在`{}`内直接写明将要提取的属性名即可，当然如果不想要以原来的名字的话，还可以进行改变。

```javascript
function fn(a, b) {
  var { s1: a, s2: b } = a;
  var { s3, s4 } = b;
  return {
    a,
    b,
    s3,
    s4,
  };
}
```

上面这种 `var {s3, s4} = b` 也就是解构一个对象。

和 `es5` 的数组 `...` 非常相似，可以说是把数组那一套给搬到了对象上来。

## `Promise.prototype.finally`

扩展了`es5`的`Promise`对象的方法。

`finally`可以在`Promise`被解决或者被拒绝的情况下都进行回调。

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("zZZZZ~~"); // 解决promise
  }, 1000);
});

promise.finally(() => {
  console.log("finally 1");
}); // 输出

promise.finally(() => {
  console.log("finally 2");
}); // 输出
```

上面两个`finally`的回调在`resolve`之后都会被执行。

而当被拒绝同样也执行`finally`。

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("zZZZZ~~"); // 拒绝promise
  }, 1000);
});

promise.finally(() => {
  console.log("finally 1");
}); // 输出

promise.finally(() => {
  console.log("finally 2");
}); // 输出
```

`finally`在某些情况下非常的方便。

比如现在在一个承诺中占据了某些资源，当然我们希望不管成功`then`或者失败`catch`都要把资源进行释放。

在没有`finally`时可能就要在`then`和`catch`都要写这一段代码。

而现在有了`finally`，代码就变得非常的清晰了。

## `for await...of`异步迭代器

异步的队列以同步的写法来编写，看起来更加的符合逻辑。

每次循环都得等到当前`Promise`变成`resolved`。

```javascript
async function fn() {
  const promises = [
    new Promise((resolve, reject) => setTimeout(() => resolve(3000), 3000)),
    new Promise((resolve, reject) => setTimeout(() => resolve(1000), 1000)),
  ];
  for await (res of promises) {
    console.log(res);
  }
}

fn(); // 输出 3000 1000
```

注意`for await`只能写在异步函数中，本质也是一个语法糖。

# 后记

`es9`的话我个人感觉也是扩展实用的方法和特性来是写代码更加的方便。

除了上面说过的，`es9`还有几个新的特性。

- 正则的扩展（后行断言，后行否定断言）；
- 字符串的扩展。

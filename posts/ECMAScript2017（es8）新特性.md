---
title: ECMAScript2017（es8）新特性
key: 1597721573
date: 2020-08-18 11:32:53
updated: 2024-12-26 15:57:35
tags:
  - JavaScript
categories:
  - 笔记
---


# 前言

ECMAScript2017（es8）新特性。

<!-- more -->

# 正文

## `padStart`和`padEnd`

这两个函数顾名思义，就是往头部和尾部填充东西的，可以来个例子理解下（以`padStart`为例子）。

```javascript
let a = 'nick';
a.padStart(10,"123");   // 输出 '123123nick'
a.padStart(10);         // 输出 '      nick'
a.padStart(1)           // 输出 'nick'
a.padStart(5,'123')     // 输出 '1nick'       
```

默认使用空格填充，第一个参数是指填充完字符串的长度，而不是填充串的长度。

如果第一个参数小于了原字符串的长度，那么直接返回原字符串。

## `Object.values`和`Object.entries`

之前如果需要遍历对象的属性的话，一般是用`es5`的`Object.keys`来获取对象的键数组，再根据键数组来遍历对象。

```javascript
var o = {a: 1, b: 2};
var keys = Object.keys(o);      // keys = ['a','b'];
```

而现在可以直接拿到对象的值数组。

```javascript
var o = {a: 1, b: 2};
var values = Object.values(o);    // values = [1, 2]
```

当然也可以用`keys`方法来实现这个操作。

```javascript
var values = Object.keys(o).map(key => o[key]);
```

也可以直接拿到对象的键值对数组了。

```javascript
var o = {a: 1, b: 2};
var entries = Object.entries(o);    // entries = [['a', 1], ['b', 2]]
```

依然可以用`keys`来实现这个操作。

```javascript
var entries = Object.entries(o).map(key => [key, o[key]]);
```

（`map`天下第一！！！）

总体上是趋于直接性和易读性的一个特性。

## Object.getOwnPropertyDescriptors

获取当前对象自身的属性描述符的数组，不包括原型链上的

```javascript
var o = {name: 'Dedicatus545', age: 22};
Object.getPrototypeOf(o).myProperty = 'property in prototype'
var descriptors = Object.getOwnPropertyDescriptors(o);    
// 输出 （不包括myProperty属性的描述符对象）
// {
//   name: {
//     value: 'Dedicatus545',
//       writable: true,
//       enumerable: true,
//       configurable: true
//   },
//   age: { 
//     value: 22, 
//     writable: true, 
//     enumerable: true, 
//     configurable: true 
//   }
// }
```
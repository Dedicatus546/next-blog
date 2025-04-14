---
title: ECMAScript2016（es7）新特性
key: 1597720282
date: 2020-08-18 11:11:22
updated: 2024-12-26 15:57:35
tags:
  - JavaScript
categories:
  - 笔记
---


# 前言

ECMAScript2016（es7）新特性。

<!-- more -->

# 正文

## \*\* 指数运算符

之前如果想要计算某个数的某次幂时，会使用到`Math.pow`函数来进行计算。

```javascript
var r = Math.pow(2, 10);    // 计算2的10次幂
```

而现在，只需要使用`**`运输符即可直接运算。

```javascript
var r = 2 ** 10;    // 计算2的10次幂
```

## 数组`includes`方法

之前如果想要寻找数组是否存在某一个元素的时候，使用`indexOf`来查找索引从而来判断。

```javascript
const array = [1, 2, 3, 4];
array.indexOf(2);   // 返回1，表示在索引1的位置
array.indexOf(0);   // 返回-1  表示没找到索引
```

某些时候我们只关心数组是否存在元素而已，而不关心它到底在哪个位置。

之前用判断是否等于`-1`来实现这个效果。

```javascript
if(array.indexOf(0) !== -1){
  // 数组存在被查找的元素
  // ...
}
```

而现在可以使用`includes`来完成这一代码。

```javascript
if(array.includes(1)){
  // 存在被查找的元素
  // ...
}
```

整体下来更加的简洁，也不会出现`-1`这种魔法值。

比如以后如果规范抽风了，把`indexOf`没找到值的情况下返回数组的`length`的话，那么原来的代码就会出现运行的逻辑错误。

并且需要注意的是，`indexOf`不支持对`NaN`的查找，而`includes`支持。

![](https://i.loli.net/2020/08/18/fgyVT8uWMPLIxb4.png)

`indexOf`返回了`-1`，而`includes`返回了`true`。
---
title: 卓动科技 - Coco游戏开发实习生面试总结
key: 1599534991date: 2020-09-08 11:16:31
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
  - 前端笔试题
categories:
  - 笔试
---


卓动科技 - Coco游戏开发实习生面试总结

<!-- more -->

# `js`的基本类型以及常用基本类型的内置对象

这个没啥难度，

`js`的基本类型有：`Null`, `Undefined`, `Number`, `String`, `Boolean`, `Symbol`（`es6`新的特性）。

复杂的类型就是引用类型，也就是常说的对象。

基本类型的内置对象有：`Number`, `Array`, `String`,`Boolean`,`RegExp`,`Function`等。

# 输出打印顺序

```javascript
console.log(1);
setTimeout(() => {
  console.log(2);
}, 0);
console.log(3);
setTimeout(() => {
  console.log(4);
}, 0);
console.log(5);
```

这个也不复杂，`setTimeout`的回调会到下一次的宏任务才执行。

所以输出的顺序为 `1 3 5 2 4`。

# 输出打印

```javascript
function fn(x) {
  this.x = x;
  return this;
}

var x = fn(3);
var y = fn(4);
```

问`x.x`，`y.x`输出啥？

这道题当时粗心了，没在意这两个`x`，结果掉坑里了。

这里的`fn(3)`返回了`window`。

`var x = window`等价于`window.x = window`。

所以`x.x`输出的是`window.x`也就是`window`。

而`y.x`就简单了，和前面的没啥关系，函数内部把`x`赋值为`4`。

所以`y.x`的输出的就是`4`。

# 输出数组

```javascript
var arr = [];
arr[500] = 1;
console.log(arr[0]);
console.log(arr.length);
arr["1000"] = 1;
console.log(arr.length);
```

这题我就记得这么多了，这题想一下还是不难的。

没赋值的位置就输出`undefined`，所以第一个输出`undefined`。

给`arr[500]`赋值为`1`，则现在数组的索引为`0 - 500`。

所以长度（即输出）为`501`。

`arr["1000"] = 1`也是给第`1001`个位置赋值。

所以输出的长度就是为`1001`。

# `html`语义化

问这个语义化有什么用。

这里我答了能够让浏览器更好的识别内容，并且对辅助设备有作用，比如一些盲人的设备。

如果一个`div`模拟`input`，那么设备可能不知道。

而直接使用`input`则可以相应的提示“这里需要输入东西”的语言之类的（后面看百度才知道是叫屏幕阅读器...）。

感觉这个答得太粗糙了。

看了下网上的回答，可以总结为以下几点：

- 有利于`SEO`搜索引擎；
- 有利于屏幕阅读器理解网页的内容；
- 在`css`，`js`失效时网页不至于太难看，应为语义化的标签一般都有默认的样式；
- 有利于代码的编写，整体使用更少的标签。

# `DOM`题

创建`10`个`a`节点，点击`a`节点输出他的索引序号

```javascript
for (let i = 0; i < 10; i++) {
  const a = document.createElement("a");
  a.onclick = function (ev) {
    alert(i);
  };
  a.innerText = i;
  document.getElementsByTagName("body")[0].appendChild(a);
}
```

这个没啥难度...，还是写的出来的。

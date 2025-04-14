---
title: JavaScript中的垃圾回收
key: 1627051082date: 2021-07-23 22:38:02
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
categories:
  - 编程
---


`JavaScrip`中的垃圾回收。

<!-- more -->

本文参考如下的帖子

- [内存管理 | MDN](https://developer.mozilla.org/zh-CN/docs/orphaned/Web/JavaScript/Memory_Management)
- [V8 之旅： 垃圾回收器](http://newhtml.net/v8-garbage-collection/)
- [A tour of V8: Garbage Collection](http://www.jayconrod.com/posts/55/a-tour-of-v8-garbage-collection)
- [「前端进阶」JS 中的内存管理](https://juejin.cn/post/6844903869525262349)
- [JS 垃圾回收机制笔记](https://juejin.cn/post/6844903695721709581)
- [V8引擎详解（七）——垃圾回收机制](https://juejin.cn/post/6844904182512615432)

# JavaScript 的内存管理

不同于`C`，`C++`的手动释放内存，`JavaScript`由引擎来为基本类型，对象，函数等来分配内存，分配内存这一块操作对用户完全透明，用户不用在意内存如何分配，分配到哪里，如何回收，这些都由引擎给做了。

由垃圾回收器来进行垃圾回收，减少了程序员的心智负担，但同时也减弱了对程序的控制程度，但总体上利大于弊。

# 垃圾回收的目的

将不在被使用的内存释放掉，使得系统能够重新的使用这些内存来存放相关的变量

# 垃圾回收算法

## 引用计数

对象`A`能够通过自身去使用对象`B`，那么这个对象`A`就持有了对对象`B`的引用。

引用计数即通过判断对象是否被其他对象引用到来作为是否回首的依据。

如果一个对象没有被其他对象引用，那么这个对象应该被释放，因为已经没有其他的对象能够使用到该对象了，反之，就不应该释放该对象，避免未来的某个时刻被其他对象使用时造成错误。

缺点：存在循环引用的情况，当两个对象已经不能被其他任何对象引用但是这两个对象存在对对方的引用时，该垃圾回收算法无法对这两个对象进行回收，从而造成内存泄漏。

```javascript
function f() {
  var o1 = {};
  var o2 = {};
  o1.a = o2; // o1 引用 o2
  o2.a = o1; // o2 引用 o1

  return "Hello World!";
}

f();
```

当函数`f`执行完毕时，正常情况下应该释放对象`o1`与`o2`，但是算法发现两者仍然被其他对象引用，于是无法进行回收，造成了内存泄漏。

> `MDN`上`内存管理`一章指出在`IE6`，`7`上使用引用计数来回收`DOM`对象，这种方式很容易造成内存泄漏。

```javascript
function f() {
  const div = document.createElement("div");
  div.circleReference = div;
  // 挂载一个较大的数组，这样能够方便从内存占用上分析出来是否内存泄露了
  div.lotsOfData = new Array(10000).join("*");
  return "Hello World!";
}
```

如果`div`对象成功释放，那么属性`lotsOfData`应该也被释放，因为只有`div`引用了它，而实际上由于属性`circleReference`引用了自身，使得`div`的引用计数不为`0`（循环引用了），无法释放，导致属性`lotsOfData`也无法释放，造成内存泄漏。

## 标记清除算法

![](https://user-gold-cdn.xitu.io/2019/6/17/16b637393a752456?imageslim)

通过一个“根”对象，去寻找能够访问到的全部的变量，然后把无法访问到的变量进行回收。

相比与引用计数，如果两个对象不再被其他对象引用，但是两者相互引用时，标记清除算法也能够鉴别出这两个对象应该被回收，因为从“根”对象已经无法达到这两个对象了。

它的有优点也是它的缺点，说成限制可能比较准确，即“那些无法从根对象查询到的对象都将被清除”。

标记清除算法已成为主流的`JavaScript`的垃圾回收算法，基于标记清除算法来改进垃圾回收。

# v8 堆的构成

![](https://user-gold-cdn.xitu.io/2020/5/31/17269d61cb4ba88e?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

- 新生代区 `New Space`。新生代分为两个区，一个是`from`区，一个是`to`区（相对而言），每次分配对象都会在`from`区分配，当内存将占满时，开始垃圾回收机制，把`from`区里面还被引用的对象拷贝到`to`区，然后新分配的对象开始放在`to`区，当`to`区也快占满时，就以同样的步骤转移到`from`，如此往复。新生代区的回收频率很快。新生代由副垃圾收集器（`Scavenging`）进行垃圾回收。
  ![](https://user-gold-cdn.xitu.io/2020/6/7/1728d89166b6a05b?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)
- 老生代区 `Old Space`。当位于新生代区的对象长时间留在新生代区时，`v8`会把这个对象搬到老生代中（**晋升机制**），然后隔一段时间也对老生代进行扫描，把已经无法可达的对象给释放掉。
  
  晋升机制的条件：
  - 经历过一次副垃圾回收（`Scavenging`）算法，且并未被标记清除的，也就是过一次翻转置换操作的对象。
  - 在进行翻转置换时，被复制的对象大于`to space`空间的`25%`。（`from space`和`to space`一定是一样大的）。

  晋升后的对象分配到老生代内存区，便由老生代内存区来管理。

- 大对象区 `Large Object Space`，专门存储大的对象，由于大对象的拷贝耗时，所以对大对象基本不移动。
- 代码区 `Code Space` 存放代码对象，最大限制为`512`MB，也是唯一拥有执行权限的内存。
- 单元区、属性单元区、Map 区 `Cell Space`、`Property Cell Space`、`Map Space`，`Map`空间存放对象的`Map`信息也就是隐藏类`Hiden Class`最大限制为`8`MB；每个`Map`对象固定大小，为了快速定位，所以将该空间单独出来。

# 如何查看是否内存泄漏

在`Chrome`浏览器，或者微软的`Edge`浏览器中，通过`F12`呼出开发者工具栏。

- 打开开发者工具，选择`Performance`面板；

  在 Edge 中，对应的中文面板为性能面板：

  ![](https://z3.ax1x.com/2021/07/24/WybAtf.png)

- 在顶部勾选`Memory`；
- 点击左上角的`record`按钮；

  在`Edge`中，对应为左上角的记录按钮

  ![](https://z3.ax1x.com/2021/07/24/WybJ9U.png)

- 点击记录后，在页面上进行各种操作，模拟用户的使用情况；
- 一段时间后，点击对话框的`stop`按钮，面板上就会显示这段时间的内存占用情况。

  ![](https://z3.ax1x.com/2021/07/24/WyqnPK.png)

在`Node`中，可以使用`process.memoryUsage`方法来查看内存使用情况。

> [process.memoryUsage() - Node.js 官方文档](https://nodejs.org/dist/latest-v14.x/docs/api/process.html#process_process_memoryusage)

![](https://z3.ax1x.com/2021/07/24/WyLPFP.png)

这个方法返回一个以字节为单位的描述内存情况的对象，属性值类型都为整型。

返回对象的属性如下：

- `rss` 整个进程在内存中占用的大小，包括所有的`C++`对象，`JavaScript`对象以及代码；
- `heapTotal` 堆的大小；
- `heapUsed` 已使用堆的大小；
- `external` 存放绑定到由`v8`引擎管理的`JavaScript`的`C++`对象；
- `arrayBuffers` 分配给`ArrayBuffer`和`SharedArrayBuffer`对象的内存，即包括所有的`Buffer`对象，已包含在`external`的大小中。

对于内存泄漏的判断，一般只需关注`heapUsed`和`heapTotal`即可。

# 内存泄漏例子

## 全局变量

```javascript
function fn() {
  // 意外定义了一个全局变量，可以使用window.a访问到它，无法被回收。
  a = 1;

  // 正确的做法使用关键字var，let，const定义变量再使用。
  // var a = 1;
  // let a = 1;
  // const a = 1;
}

fn();
```

## 定时器

```javascript
const array = [
  /*一个很大的数组*/
];

setInterval(function () {
  // 执行一些操作。
  // ...
  // 比如
  const div = document.getElementById("div1");
  if (div) {
    // 使用array渲染
  }
}, 2000);
```

当定时器中`div`获取不到时，整个定时器失去了意义，但此时由于定时器没有被回收，而定时器又引用了`array`，导致`array`也无法被回收。

## 闭包

```javascript
function fn() {
  const str = new Array(1000000).join("*");
  return function () {
    return {
      str,
    };
  };
}
window.a = fn()();
```

## DOM 对象的引用

```javascript
var elements = {
  image: document.getElementById("image"),
};
function doStuff() {
  elements.image.src = "http://example.com/image_name.png";
}
function removeImage() {
  document.body.removeChild(document.getElementById("image"));
  // 这个时候我们对于 #image 仍然有一个引用, Image 元素, 仍然无法被内存回收.
}
```

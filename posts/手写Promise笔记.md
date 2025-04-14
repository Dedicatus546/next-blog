---
title: 手写Promise笔记
key: 1591929291date: 2020-06-12 10:34:51
updated: 2023-02-13 18:28:45
tags:
 - JavaScript
 - Promise
categories:
 - 编程
---


手写`Promise`笔记

<!-- more -->

掘金上看见一个`20`行的`Promise`实现，主要是链式调用，感觉很不错，学习学习。

原文出处：[最简实现Promise，支持异步链式调用（20行）](https://juejin.im/post/5e6f4579f265da576429a907)

# `Promise`

直接上代码吧。

```javascript
// Promise构造函数
function Promise(excutor) {
  var self = this;
  self.onResolvedCallback = [];
  function resolve(value) {
    setTimeout(() => {
      self.data = value;
      self.onResolvedCallback.forEach(callback => callback(value));
    },0);
  }
  excutor(resolve.bind(self));
}
// Promise的then调用函数
Promise.prototype.then = function(onResolved) {
  var self = this;
  return new Promise(resolve => {
    self.onResolvedCallback.push(function() {
      var result = onResolved(self.data);
      if (result instanceof Promise) {
        result.then(resolve);
      } else {
        resolve(result);
      }
    });
  })
}
```

参数`excutor`为一个函数，这个函数有两个参数。

一个是`resolve`，一个是`reject`，这个实现为简单实现，所以没有第二个参数，主要为实现链式调用。

`Promise`构造函数中的`onResolvedCallback`为一个待调用的函数数组。

当通过`then`函数注册回调的时候，会把回调函数存在`onResolvedCallback`数组中。

`then`函数规范中有提到，必须返回一个新的`Promise`对象，基于这个可以实现链式调用。

`then`如何返回也在规范中有提及，如果回调函数返回了一个`Promise`，那么`then`返回的`Promise`就要使用函数返回的`Promise`的值（`value`）。

如果不是函数返回的不是`Promise`，那么`then`返回的`Promise`就直接以这个值来解决。

`resolve`函数是一个完成函数，会把`Promise`的状态从`pending`转为`resolved`，并且调用全部注册的回调。

`resolve`为啥要通过`setTimeout`调用呢？可以看下面的代码。

```javascript
var promise = new Promise(function(resolve,reject) {
    resolve('success');
});
// 上面的操作就已经调用了数组中的回调
// 下面的注册的回调就会无效了
promise.then(res=>{
    console.log(res);
});
```

我们构建了一个`promise`，直接的将这个`promise`解决掉（调用`resolve`）。

`resolve`会把`onResolvedCallback`的函数逐一地执行。

注意，这时候的操作都是同步的，也就是这时的`then`注册回调还没有执行，导致了`then`方法没有被执行。

使用了`setTimeout`，使得更改状态以一个新的任务执行，也就是在当前代码执行完之后再执行，使得回调函数可以注册到`onResolvedCallback`里面。使得`then`的表现正常。

需要注意，`Promise`应该是以微任务的形式来进行`resolve`的，而不是以任务，这个在之前的关于`task`，`microtask`的文章中有说到。

---
title: JavaScript中的Async
key: 1599375833date: 2020-09-06 15:03:53
updated: 2023-02-13 18:28:44
tags:
 - JavaScript  
categories:
 - 编程
---



# 前言

Async是es2017（es8）中的一个新特性，本质是一个语法糖，解决了异步函数的编写问题

<!-- more -->

# `Async`

在es2015中，有了新的特性”承诺“（`Promise`）来解决异步回调嵌套过深的问题

在最原始的时候异步的函数很多时候导致回调过深

```javascript
function ajax(config,callback) {}       // 模拟一个ajax函数    
```

比如现在有三个请求，我们希望在每个请求成功之后再发送下一个请求

那么可能会这么写

```javascript
ajax({
  // ... 这里是请求的配置，比如请求方法，请求参数等等
}, (data) => {
  // 第一个请求成功回调执行
  // 发送第二个请求
  ajax({
    // ...
  }, (data) => {
    // 第二个请求成功回调执行
    // 发送第三个请求
    ajax({
      // ...
    }, (data) => {
      // 第三个请求成功
      // 写逻辑处理。
      // ...
    })
  })
})
```

如果请求一旦多的话，那些每个`ajax`都嵌套，代码就会非常难看，这也称之为回调地狱

并且由于异步函数的执行和原函数是处于不同的上下文的，这就会导致在异步函数中无法捕获错误

```javascript
try {
  setTimeout(() => {
    throw new Error('error!~~');
  }, 2000);
} catch (e) {
  console.log('请求出错');      // 不会打印，因为并没有被这个catch所捕获捕获
  console.log(e);
}
```

使用es2015的`Promise`，我们可以扁平化回调地狱这个不好的编码形式，

这是因为`then`是支持链式调用，下一个`then`的回调代表着对前一个`then`返回的promise完成的回调

首先可以包装一下原来的`ajax`请求函数

```javascript
function ajaxPromise(config){
  return new Promise((resolve,reject) => {
    ajax(config, (data) => {
      resolve(data);        // 设置为已解决
    })
  })
}
```

经过包装之后如果还是三个异步的请求要以此执行的话就可以以下面的方式编写了

```javascript
ajaxPromise({
  // ...
}).then((data) => {
  // 第一个请求成功
  // 发送第二个
  return ajaxPromise({
    // ...
  })
}).then((data) => {
  // 第二个请求成功
  // 发送第三个
  return ajaxPromise({
    // ...
  })
}).then((data) => {
  // 第三个请求成功
  // 处理逻辑
})
```

没有嵌套，就是以一种面条的方式编写，如果某一天只需要两个请求的话，只需要删除一个`then`的回调即可

心智负担明显没有嵌套回调的大。

使用`Promise`还可以正常地捕获异步中的错误

这里的正常地捕获是指以`reject`的方式来代替`throws Error`

比如之前那个`setTimeout`的例子，经过`Promise`改写之后如下

```javascript
new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('error!~~');
  });
}).catch(e => {
  console.log('捕获到错误了，错误的内容为：' + e);        // 可以输出
});
```

如果依然使用`throw Error`，那么`catch`的回调依然是不会捕捉到的，原因之前也讲过

```javascript
new Promise((resolve, reject) => {
  setTimeout(() => {
    throw new Error('error')
  });
}).catch(e => {
  console.log('捕获到错误了，错误的内容为：' + e);        // 没有输出
});
```

虽然`Promise`很好的解决了回调地狱的问题，但是其写法也挺繁琐，大段的`then`回调也不利于整体逻辑的认识

而`Async`就是来解决这个问题的，使用Async异步函数，使得我们可以以同步的方式来编写异步

```javascript
async function fn(){
  const data1 = await ajaxPromise({/*...*/});
  const data2 = await ajaxPromise({/*...*/});
  const data3 = await ajaxPromise({/*...*/})
  // 处理逻辑
}

fn();
```

在Async中，异步完全体现不出来，整个执行流程就像同步的一样。

前面也说过，Generator和Async其实有关系的，也就是可以使用Generator来实现Async这个语法糖

我们可以看看babel是如何进行转换的

使用一段简单的函数

```javascript
async function fn(){
  await Promise.resolve('success');
  await Promise.reject('err1');
}
```

经过babel转化之后，如下

```javascript
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}

function fn() {
  return _fn.apply(this, arguments);
}

function _fn() {
  _fn = _asyncToGenerator(function*() {
    yield Promise.resolve("success");
    yield Promise.reject("err1");
  });
  return _fn.apply(this, arguments);
}
```

可以看到Babel正是用Generator来实现低版本的Async

这里面最重要的前面两个函数

- `asyncGeneratorStep`  await的模拟
- `_asyncToGenerator` async的模拟

先看`_asyncToGenerator`这个函数

这个函数传入一个生成器，返回一个函数，返回的函数运行之后便返回了一个`Promise`，

这和我们之前讲到的一样，运行一个Async函数会返回一个`Promise`

其中最重要的就是这一段代码

```javascript
return new Promise(function(resolve, reject) {
  var gen = fn.apply(self, args);
  function _next(value) {
    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
  }
  function _throw(err) {
    asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
  }
  _next(undefined);
});
```

fn为我们传入的一个生成器。

这里不管this的指向和参数的传递，就简单地认为运行了这个生成器函数，因为我感觉这个不是重点

得到了gen这个生成器对象。

然后定义了两个函数，一个是`_next`，一个是`_throw`

这两个函数分别是执行到下一个`yield`或者对整个生成器函数抛出错误

这两个函数都传入这个生成器对象，这个返回promise的`resolve`（解决函数）和`reject`（拒绝函数）

以及自身`_next`，和`_throw`这两个函数

以及生成器对象的两个方法`next`和`throw`

然后调用了`next(undefined)`这里模拟了第一次的`yield`

进入了`asyncGeneratorStep`这个函数

这里需要明白一点，

`asyncGeneratorStep`这个函数中的`resolve`函数和`reject`函数都关系着整个返回的promise的状态

```javascript
try {
  var info = gen[key](arg);
  var value = info.value;
} catch (error) {
  reject(error);
  return;
}
```

这里就是运行生成器对象的`next`方法，获取了一个迭代器对象，

这里的`arg`就是我们前面从`next(undefined)`的`undefined`

然后获取了一个迭代器的`value`属性

如果这个过程出现错误，直接结束整个promise，这和Async中的逻辑一样，

如果某一个`await`出现了错误，那么就会直接退出这个Async函数了

然后如果迭代器的`done`属性已经是`true`的话，直接解决整个promise

还没到的话，进入下一个的`yield`（也就是`await`）

包装了一下前一个promise，回调就是`_next`和`_throw`函数

```javascript
if (info.done) {
  resolve(value);
} else {
  Promise.resolve(value).then(_next, _throw);
}
```

这样就能进入下一个`yield`（也就是`await`）

至于为啥要包装，因为可能我们会直接`yield`（`await`）一个同步的操作

```javascript
function* fn(){
  yield 2;
  yield 2 + 1;
}
```

这就是babel的转化了，可以说非常的巧妙，但我个人觉得不是很容易懂，

因为里面很多的函数都会去引用自身。

但是如果明白了，就会豁然开朗。

# 后记

搞完了腾讯前端的第二次面试，比第一次好了一点点，下个帖子就写腾讯的笔试总结。
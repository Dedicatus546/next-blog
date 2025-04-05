---
title: Promise上的一些工具函数的实现
key: 1605080745date: 2020-11-11 15:45:45
updated: 2023-02-13 18:28:45
tags:
  - Promise
  - JavaScript
categories:
  - 编程
---


# 前言

之前写过手写 Promise 的实现，这次来写写它的一些工具函数和对象函数的实现

<!-- more -->

本文基于之前`Promise`以及相关`then`方法。

之前自定义的`Promise`函数名字为`MyPromise`，下文都以`MyPromise`来表示

# 正文

## `Promise.resolve`

> [Promise.resolve - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)

根据文档上的解析

> `Promise.resolve(value)`方法返回一个以给定值解析后的`Promise`对象。如果这个值是一个`Promise`，那么将返回这个`Promise`；如果这个值是`thenable`（即带有`"then"` 方法），返回的`Promise`会“跟随”这个`thenable`的对象，采用它的最终状态；否则返回的`Promise`将以此值完成。此函数将类`Promise`对象的多层嵌套展平。

可以看到`Promise.resolve`是以参数`value`的类型来决定如何处理返回的`Promise`，而不是一味的`resolve`掉这个`Promise`

看到网上有如下的实现

```javascript
MyPromise.resolve = function (val) {
  return new MyPromise((resolve, reject) => {
    resolve(val);
  });
};
```

这样实现是百分百不对的，可以测试下面的代码

```javascript
Promise.resolve(Promise.reject(1)).then(
  (val) => console.log(`val: ${val}`),
  (err) => console.log(`err: ${err}`)
);
```

输出是执行第二个参数的回调，也就是输出`err: 1`，如下

![](https://i.loli.net/2020/11/12/9j8hUrfHgoTJZlu.png)

所以`Promise.resolve`只是通过传入参数`value`来决定，所以实现如下

```javascript
MyPromise.resolve = function (val) {
  let returnPromise;
  return (returnPromise = new MyPromise((resolve, reject) => {
    // MyPromiseResolve是之前实现Promise实现的
    MyPromiseResolve(returnPromise, val, resolve, reject);
  }));
};
```

## `Promise.reject`

> [Promise.reject - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject)

`Promise.reject`就没有`Promise.resolve`复杂，它的逻辑就非常单纯，就是以传入的值拒绝返回的`Promise`对象即可，比如

```javascript
Promise.reject(Promise.resolve(1)).then(
  (res) => console.log(`res: ${res}`),
  (err) => console.log(`err: ${err}`)
);
```

上面这个`Promise`会以`Promise.resolve(1)`作为失败原因被拒绝

![](https://i.loli.net/2020/11/12/8gW7HmNujoDS31R.png)

那么实现如下

```javascript
MyPromise.reject = function (val) {
  return new MyPromise((resolve, reject) => {
    reject(val);
  });
};
```

## `Promise.prototype.catch`

> [Promise.prototype.catch - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch)

`catch`方法用于注册一个`Promise`被`reject`时的回调，所以可以使用`then`方法来实现`catch`（可以说`catch`是一个特殊的`then`）

```javascript
MyPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};
```

由于`then`会返回新的`Promise`，所以无需我们去创建一个新的`Promise`返回

## `Promise.prototype.finally`

> [Promise.prototype.finally - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)

`finally`方法注册的回调不管在`resolved`状态或者`rejected`状态都会进行执行，所以根据`catch`很容易写出下面的实现代码

```javascript
MyPromise.prototype.finally = function (onFinally) {
  return this.then(onFinally, onFinally);
};
```

但这么写其实是有问题的，在提案上（现在已经为`ecma`的标准了）也有解释为啥不适用`then(f, f)`这种方式

> `finally`方法的提案地址：[tc39 / proposal-Promise-finally](https://github.com/tc39/proposal-Promise-finally)

在`README.md`中有一段

> Why not **`.then(f, f)`**?

为什么不使用`.then(f, f)`

> `Promise.finally(func)` is similar to `Promise.then(func, func)`, but is different in a few critical ways:

`Promise.finally(func)`和`Promise.then(func, func)`有点类似，但是在一些比较关键的地方有所不同。

> - When creating a function inline, you can pass it once, instead of being forced to either declare it twice, or create a variable for it
> - A `finally` callback will not receive any argument, since there's no reliable means of determining if the Promise was fulfilled or rejected. This use case is for precisely when you do not care about the rejection reason, or the fulfillment value, and so there's no need to provide it.
> - Unlike `Promise.resolve(2).then(() => {}, () => {})` (which will be resolved with undefined), `Promise.resolve(2).finally(() => {})` will be resolved with 2.
> - Similarly, unlike `Promise.reject(3).then(() => {}, () => {})` (which will be resolved with undefined), `Promise.reject(3).finally(() => {})` will be rejected with 3.

- 当创建一个内联的函数，你只需要传递一次，而不需要强制传递两次声明的函数，或者不需要为这个函数创建一个变量来保存
- 一个`finally`回调不会接收任何参数，因为没有可靠的方法来判断`Promise`是否已经被解决或者被拒绝。当你不关心`Promise`被拒绝的原因或者被解决的值时使用`finally`会更加精确。所以不需要提供参数。
- 不像`Promise.resolve(2).then(() => {}, () => {})`（这个`Promise`将会以`undefined`为值被解决），`Promise.resolve(2).finally(() => {})`将会以`2`为值被解决
- 类似地，不像`Promise.reject(3).then(() => {}, () => {})`（这个`Promise`将会以`undefined`为值被解决），`Promise.reject(3).finally(() => {})`将会以`3`为值被拒绝

> However, please note: a `throw` (or returning a rejected Promise) in the `finally` callback will reject the new Promise with that rejection reason.

然而，请注意：在`finally`中抛出（或者返回一个被拒绝的`Promise`对象）会使得新的`Promise`对象以这个原因被拒绝。

我们可以测试下原生的 Promise 的情况

### 情况 1

```javascript
const Promise = Promise.resolve("Promise.resolve");
// 这里finally不返回
Promise.finally(() => {
  console.log("finally");
}).then((res) => {
  console.log(res);
});
```

这时根据规范，最后一个`then`的`onResolved`中的`res`应该是`"Promise.resolve"`

![](https://i.loli.net/2020/11/12/NDYGvb3yZam6UAf.png)

测试结果符合规范

### 情况 2

```javascript
const Promise = Promise.resolve("Promise.resolve");
// 这里finally返回一个resolved的Promise
Promise.finally(() => {
  console.log("finally");
  return Promise.resolve("finally Promise.resolve");
}).then((res) => {
  console.log(res);
});
```

这时根据规范，最后一个`then`的`onResolved`中的`res`应该**依然是**`"Promise.resolve"`，而**不是**`"finally Promise.resolve"`

![](https://i.loli.net/2020/11/12/NDYGvb3yZam6UAf.png)

测试结果符合规范

### 情况 3

```javascript
const Promise = Promise.resolve("Promise.resolve");
// 这里finally返回一个rejected的Promise
Promise.finally(() => {
  console.log("finally");
  return Promise.reject("finally Promise.reject");
}).then(
  (res) => {
    console.log(`res: ${res}`);
  },
  (err) => {
    console.log(`err: ${err}`);
  }
);
```

这时根据规范，`finally`中返回了一个`reject`的`Promise`，那么要以这个`Promise`的拒绝原因来拒绝新的`Promise`对象。

那么最后一个`then`应该走`catch`的回调，然后对应参数`err`为`"finally Promise.reject"`。

![](https://i.loli.net/2020/11/12/Szn9YAcfMspw64r.png)

综上，我们讨论了`Promise.resolve`情况下`finally`的情况，还有`Promise.reject`情况下`finally`的情况。

但这两种情况对于`finally`的情况是一样的，所以这里不做测试，大家可以自行测试下。

所以，实现上必须和上面的行为保持一致

```javascript
MyPromise.prototype.finally = function (onFinally) {
  return this.then(
    (res) =>
      MyPromise.resolve(onFinally()).then(
        // finally回调正常，穿透原来的值
        () => res,
        // finally回调异常，抛出该异常
        (err) => {
          throw err;
        }
      ),
    (err) =>
      MyPromise.resolve(onFinally()).then(
        // finally回调正常，穿透原来的错误
        () => {
          throw err;
        },
        // finally回调异常，抛出该异常
        (_err) => {
          throw _err;
        }
      )
  );
};
```

可以看到实现都是通过`MyPromise.resolve`来包装`onFinally`执行后的返回值，对于`resolved`的情况就返回原来`Promise`的`value`或者`err`，如果`rejected`那么抛出对应原因，也就符合了规范

可以发现，第二个参数的回调都是直接返回传入的值，所以可以省略

```javascript
MyPromise.prototype.finally = function (onFinally) {
  return this.then(
    (res) => MyPromise.resolve(onFinally()).then(() => res),
    (err) =>
      MyPromise.resolve(onFinally()).then(() => {
        throw err;
      })
  );
};
```

## `Promise.all`

> [Promise.all - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

MDN 上对`Promise.all`的解释如下：

> `Promise.all(iterable)`方法返回一个`Promise`实例，此实例在`iterable`参数内所有的`Promise`都“完成（resolved）”或参数中不包含`Promise`时回调完成（resolve）；如果参数中`Promise`有一个失败（rejected），此实例回调失败（reject），失败的原因是第一个失败`Promise`的结果。

简单点讲，就是全部成功，返回的`Promise`才成功，只要一个失败，返回的`Promise`就失败。

那么对于全部这个状态，就需要有一个变量来计算当前是否已经全部完成。

以及对于数组中的非`Promise`对象，要包装成`Promise`。

实现如下

```javascript
MyPromise.prototype.all = function PromiseAll(promiseArr) {
  // 这里做了点小判断，支持直接传入一个Promise。
  // 然后浅拷贝一份，防止数组内的Promise动态的改变数组长度导致逻辑错误。
  if (!Array.isArray(promiseArr)) {
    promiseArr = [promiseArr];
  } else {
    promiseArr = promiseArr.slice();
  }
  return new MyPromise((resolve, reject) => {
    let completeCount = 0;
    const result = [];
    const len = promiseArr.length;
    for (let i = 0; i < len; i++) {
      // 统一通过Promise.resolve包装，就可以忽略非Promise对象
      MyPromise.resolve(promiseArr[i]).then(
        (res) => {
          // 把结果放在数组中的对应地方
          result[i] = res;
          // 计数判断是否完成
          completeCount++;
          if (completeCount === len) {
            // 已经全部解决了，用result来解决返回的Promise
            resolve(result);
          }
        },
        (err) => {
          reject(err);
        }
      );
    }
  });
};
```

## `Promise.allSettled`

> [Promise.allSettled - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

MDN 上解释如下

> 该`Promise.allSettled()`方法返回一个在所有给定的`Promise`都已经`fulfilled`或`rejected`后的`Promise`，并带有一个对象数组，每个对象表示对应的`Promise`结果。

> 当您有多个彼此不依赖的异步任务成功完成时，或者您总是想知道每个`Promise`的结果时，通常使用它。

简单点讲就是每个回调不管成功失败都放进结果，然后全部处理之后在解决返回的`Promise`。

```javascript
MyPromise.allSettled = function (promiseArr) {
  // 相同的处理
  if (!Array.isArray(promiseArr)) {
    promiseArr = [promiseArr];
  } else {
    promiseArr = promiseArr.slice();
  }
  return new MyPromise((resolve, reject) => {
    const len = promiseArr.length;
    const result = [];
    let completeCount = 0;
    for (let i = 0; i < promiseArr.length; i++) {
      // 这里分别在成功回调，失败回调在result对应位置写入成功结果或者失败原因
      // 在finally回调来计数，因为不管成功失败都要进行计数，然后一旦数组内的Promise全部执行完成，就解决返回的Promise
      MyPromise.resolve(promiseArr[i])
        .then(
          (res) => {
            result[i] = {
              status: "fulfilled",
              value: res,
            };
          },
          (err) => {
            result[i] = {
              status: "rejected",
              value: err,
            };
          }
        )
        .finally(() => {
          completeCount++;
          if (completeCount === len) {
            resolve(result);
          }
        });
    }
  });
};
```

上面的实现中，每个对象为`{ status: "Promise的状态", value: "对应的值"}`

这是规范中所定义的，目前`Promise.allSettled`已经在 es2020 中添加了

规范地址：[proposal-Promise-allSettled](https://github.com/tc39/proposal-Promise-allSettled)

## `Promise.any`

> [Promise.any - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

MDN 上的解释如下

> 接收一个`Promise`可迭代对象，只要其中的一个`Promise`成功，就返回那个已经成功的`Promise`。如果可迭代对象中没有一个`Promise`成功（即所有的`Promises`都失败/拒绝），就返回一个失败的`Promise`和`AggregateError`类型的实例，它是`Error`的一个子类，用于把单一的错误集合在一起。本质上，这个方法和`Promise.all()`是相反的。

解释上也很明显指出了，“和`Promise.all`相反”，也就是所有都失败才返回失败，一个成功就返回成功

```javascript
MyPromise.any = function (promiseArr) {
  if (!Array.isArray(promiseArr)) {
    promiseArr = [promiseArr];
  } else {
    promiseArr = promiseArr.slice();
  }
  return new MyPromise((resolve, reject) => {
    const len = promiseArr.length;
    const errResult = [];
    let completeCount = 0;
    for (let i = 0; i < promiseArr.length; i++) {
      // 这里和Promise.all相反，在reject回调中计数，在resolve回调中直接解决。
      MyPromise.resolve(promiseArr[i]).then(
        (res) => {
          resolve(res);
        },
        (err) => {
          errResult[i] = err;
          completeCount++;
          // 如果全部被拒绝
          if (completeCount === len) {
            // 拒绝返回的Promise
            reject({
              status: "AggregateError: No Promise in Promise.any was resolved",
              errResult,
            });
          }
        }
      );
    }
  });
};
```

对于拒绝对象`{ status: "AggregateError: No Promise in Promise.any was resolved", errArray}`

为提案中所定义的，所以这里我们直接构造即可，该 API 会在 es2021 中被加入

> [proposal-Promise-any](https://github.com/tc39/proposal-Promise-any)

## `Promise.race`

> [Promise.race - MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)

MDN 上解释如下

> `Promise.race(iterable)` 方法返回一个`Promise`，一旦迭代器中的某个`Promise`解决或拒绝，返回的`Promise`就会解决或拒绝。

简单点讲就是竞速，谁快谁决定，这个是比较好实现的

```javascript
MyPromise.race = function PromiseRace(promiseArr) {
  if (!Array.isArray(promiseArr)) {
    promiseArr = [promiseArr];
  } else {
    promiseArr = promiseArr.slice();
  }
  return new MyPromise((resolve, reject) => {
    for (let i = 0; i < promiseArr.length; i++) {
      // 谁快谁解决，由于Promise在被resolve之后就不可变了，所以之后的resolve操作不会影响
      MyPromise.resolve(promiseArr[i]).then(
        (res) => {
          resolve(res);
        },
        (err) => {
          reject(err);
        }
      );
    }
  });
};
```
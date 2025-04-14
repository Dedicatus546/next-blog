---
title: 手写一个Promise并通过Promise A+规范测试
key: 1591929418date: 2020-06-12 10:36:58
updated: 2023-02-13 18:28:45
tags:
  - JavaScript
  - Promise
categories:
  - 编程
---


手写一个`Promise`并通过`Promise A+`规范测试。

<!-- more -->

# `Promise`构造函数

在规范中，有一段

> the core Promises/A+ specification does not deal with how to create, fulfill, or reject promises, choosing instead to focus on providing an interoperable then method. Future work in companion specifications may touch on these subjects.

可以看出，规范并没有指出如何创建一个`Promise`，而是规范`then`方法的行为。

而在 ES6 中创建一个`Promise`是通过`new Promise(executor)`来实现的。具体可以看 MDN 上对 Promise 的解释。

> [Promise - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)

所以我们也从这一个角度入手，创建一个我们自己的`Promise`构造函数，命名为`MyPromise`。

```javascript
function MyPromise() {
  // ...
}
```

`ES6`的`Promise`构造函数需要传入一个`executor`函数，该函数在`Promise`内部会立即执行。

所以我们的构造函数也传入一个`executor`函数。

```javascript
function MyPromise(executor) {
  // ...
}
```

规范中提到：

> A promise must be in one of three states: pending, fulfilled, or rejected.

也就是一个`Promise`必须为三个状态中的其中一个。

OK，那我们定义三个状态的常量来表示：

```javascript
// pending状态
const PENDING = "pending";
// resolved状态
const RESOLVED = "resolved";
// rejected状态
const REJECTED = "rejected";
```

接下来我们应该初始化一个`Promise`对象上的一些属性。

```javascript
function MyPromise(executor) {
  // 以self指向this，方便等会在函数内的操作。
  const self = this;
  // 初始化状态为pending
  self.$status = PENDING;
  // 初始化数据为undefined
  self.$data = undefined;
  // 初始化一个成功的回调数组
  self.$onResolvedCallbacks = [];
  // 初始化一个失败的回调数组
  self.$onRejectedCallbacks = [];
}
```

对于传入的`executor`函数，有两个参数：

- `resolve` 完成这个`Promise`的函数；
- `reject` 拒绝这个`Promise`的函数；

所以我们在构造函数的内部需要实现这两个函数，并且在执行`executor`函数时，传进这两个函数。

在`ES6`的`Promise`实现中，一般我们会这么使用`Promise`

```javascript
var promise = new Pormise(function (resolve, reject) {
  // 成功就调用resolve，并传进一个成功的值
  // 失败就调用reject，传进失败的原因
  resolve(1);
});

promise.then((res) => {
  console.log(res); // 打印1
});
```

所以我们的实现也模仿它。

记住，`Promise`只能是三个状态中的一个，并且只能从：

- `pending` -> `resolved`
- `pending` -> `rejected`

```javascript
function MyPromise(executor) {
  // 以self指向this，方便等会在函数内的操作。
  const self = this;
  // 初始化状态为pending
  self.$status = PENDING;
  // 初始化数据为undefined
  self.$data = undefined;
  // 初始化一个成功的回调数组
  self.$onResolvedCallbacks = [];
  // 初始化一个失败的回调数组
  self.$onRejectedCallbacks = [];

  // 解决本Promise的函数，参数为解决的值
  function resolve(value) {
    if (self.$status === PENDING) {
      self.$status === RESOLVED;
      self.$data = value;
      self.$onResolvedCallbacks.forEach((fn) => {
        fn(value);
      });
    }
  }

  // 拒绝本Promise的函数，参数为拒绝的原因
  function reject(reason) {
    if (self.$status === PENDING) {
      self.$status === REJECTED;
      self.$data = reason;
      self.$onRejectedCallbacks.forEach((fn) => {
        fn(reason);
      });
    }
  }
}
```

两个函数都被`if`判定的语句包裹，防止一个已经`resolve`的`Promise`对象被`reject`，或者已经被`reject`的`Promise`对象被`resolve`。

其实这么写还是有问题的，不过后面再说。

现在我们的构造函数基本完成了大部分的工作，最后的一步就是执行`executor`函数，并传入`resolve`和`reject`函数了。

```javascript
function MyPromise(executor) {
  // 以self指向this，方便等会在函数内的操作。
  const self = this;
  // 初始化状态为pending
  self.$status = PENDING;
  // 初始化数据为undefined
  self.$data = undefined;
  // 初始化一个成功的回调数组
  self.$onResolvedCallbacks = [];
  // 初始化一个失败的回调数组
  self.$onRejectedCallbacks = [];

  // 解决本Promise的函数，参数为解决的值
  function resolve(value) {
    if (self.$status === PENDING) {
      self.$status === RESOLVED;
      self.$data = value;
      self.$onResolvedCallbacks.forEach((fn) => {
        fn(value);
      });
    }
  }

  // 拒绝本promise的函数，参数为拒绝的原因
  function reject(reason) {
    if (self.$status === PENDING) {
      self.$status === REJECTED;
      self.$data = reason;
      self.$onRejectedCallbacks.forEach((fn) => {
        fn(reason);
      });
    }
  }

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}
```

为什么执行`executor`函数要放在`try-catch`中呢？

因为如果`executor`执行过程出错我们希望以出错的原因来拒绝这个`Promise`。

`ES6`的实现也是如此。

```javascript
var promise = new Promise(function (resolve, reject) {
  throw new Error();
});

promise.then(null, (err) => {
  console.log("出错啦~"); // 打印
});
```

# `Promise`对象的`then`函数

每一个`Promise`对象都可以调用它的`then`方法来注册回调函数，所以`then`方法要写在构造函数的原型对象上：

```javascript
MyPromise.prototype.then = function () {
  // ...
};
```

在规范`2.2.1`中，提到`then`方法需要有两个参数：

> A promise’s then method accepts two arguments:  
> `promise.then(onFulfilled, onRejected)`

- `onFulfilled`：`Promise`被解决时的回调。（下文用`onResolved`代替，都是一个意思的。）
- `onRejected`：`promise`被拒绝时的回调。

所以我们的`then`方法也传进这两个参数：

```javascript
MyPromise.prototype.then = function (onResolved, onRejected) {
  // ...
};
```

紧接着，规范说明这两个参数都是可选的，当不是函数的时候要进行忽略。所以在函数的内部要进行判断。

```javascript
MyPromise.prototype.then = function (onResolved, onRejected) {
  onResolved =
    typeof onResolved === "function"
      ? onResolved
      : function (value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function (err) {
          throw err;
        };
};
```

规范`2.2.7`说明`then`方法必须返回一个新的`Promise`对象。

> then must return a promise.  
> `promise2 = promise1.then(onFulfilled, onRejected);`

因为`Promise`有三个状态，所以我们需要为每一个状态编写返回函数：

```javascript
MyPromise.prototype.then = function (onResolved, onRejected) {
  onResolved =
    typeof onResolved === "function"
      ? onResolved
      : function (value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function (err) {
          throw err;
        };

  // Promise状态为resolved时
  if (this.$status === RESOLVED) {
    return new MyPromise(function (resolve, reject) {
      // ...
    });
  }

  // Promise状态为rejected时
  if (this.$status === REJECTED) {
    return new MyPromise(function (resolve, reject) {
      // ...
    });
  }

  // Promise状态为pending时
  if (this.$status === PENDING) {
    return new MyPromise(function (resolve, reject) {
      // ...
    });
  }
};
```

规范`2.2.7.1 - 2.2.7.4` 说明了`then`方法放回的`Promise`的状态如何根据传入函数（`onFulfilled, onRejected`）的返回值决定。

> If either `onFulfilled` or `onRejected` returns a value `x`, run the Promise Resolution Procedure `[[Resolve]](promise2, x)`.  
> If either `onFulfilled` or `onRejected` throws an exception `e`, `promise2` must be rejected with `e` as the reason.  
> If `onFulfilled` is not a function and `promise1` is fulfilled, `promise2` must be fulfilled with the same value as `promise1`.  
> If `onRejected` is not a function and `promise1` is rejected, `promise2` must be rejected with the same reason as `promise1`.

这里的重点时如何根据返回值`x`来决定返回的`Promise`的状态，这里需要引出第一点的`[[Resolve]](promise2, x)`这个函数。

这个函数在`2.3`有详细的介绍，这里我们先不去管函数的内部如何实现，我们只要明白，这个函数根据`x`来决定`promise2`的状态。

```javascript
/**
 * @promise 需要决定的promise
 * @x       决定promise的x
 * @resolve promise的解决函数
 * @reject  promise的拒绝函数
 */
function PromiseResolution(promise, x, resolve, reject) {
  // ...
}
```

现在返回`Promise`的内部就可以写了，对于三个状态：

- `resolved`状态，直接调用`then`注册的`onResolved`函数即可。
- `rejected`状态，直接调用`then`注册的`onRejected`函数即可。
- `pending`状态，需要在状态变更的时候，调用注册的函数，也就是往`$onResolvedCallbacks`和`$onRejectedCallbacks`中储存一个函数。

并且规范`2.2.4`以及`3.1`指出`onResolved`和`onRejected`必须异步的执行，所以我们要包裹函数内的操作：

```javascript
MyPromise.prototype.then = function (onResolved, onRejected) {
  const self = this;
  let promise;

  onResolved =
    typeof onResolved === "function"
      ? onResolved
      : function (value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function (err) {
          throw err;
        };

  // Promise状态为resolved时
  if (this.$status === RESOLVED) {
    return (promise = new MyPromise(function (resolve, reject) {
      setTimeout(() => {
        try {
          // 这里和状态为rejected的区别为调用的回调函数不同。
          const res = onResolved(self.$data);
          PromiseResolution(promise, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    }));
  }

  // Promise状态为rejected时
  if (this.$status === REJECTED) {
    return (promise = new MyPromise(function (resolve, reject) {
      setTimeout(() => {
        try {
          const res = onRejected(self.$data);
          PromiseResolution(promise, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    }));
  }

  // Promise状态为pending时
  if (this.$status === PENDING) {
    return (promise = new MyPromise(function (resolve, reject) {
      self.$onResolvedCallbacks.push(function (value) {
        try {
          const res = onResolved(value);
          PromiseResolution(promise, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });

      self.$onRejectedCallbacks.push(function (err) {
        try {
          const res = onRejected(err);
          PromiseResolution(promise, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
};
```

至此，我们的主体代码部分基本完成，最后就差`PromiseResolution`这个函数的实现了。
这个函数的实现在规范中其实说的很详细，只要按着要求来基本就没啥大问题了。

```javascript
function PromiseResolution(promise, x, resolve, reject) {
  // 2.3.1 如果promise和x为同一个对象，就以TypeError来拒绝promise
  if (promise === x) {
    reject(new TypeError());
    return;
  }

  // 2.3.2.1 - 2.3.2.3 如果x是原生的Promise，那么就以x的最终的情况来决定promise
  if (x instanceof Promise) {
    x.then(resolve, reject);
  }
  // 2.3.3 如果x是一个对象或者函数
  else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    let then;
    try {
      // 2.3.3.1 尝试取x的then属性
      then = x.then;
    } catch (e) {
      // 2.3.3.2 如果取then属性出错，则以这个原因拒绝promise
      reject(e);
      return;
    }
    // 2.3.3.3 如果then属性为一个函数
    if (typeof then === "function") {
      let whoCall = false;
      try {
        // 2.3.3.3 以x为上下文调用then，并以它的结果来决定promise，whoCall的作用是防止多次的改变promise的值，
        then.call(
          x,
          (y) => {
            if (!whoCall) {
              // 2.3.3.3.1 以y再次来尝试决定promise
              whoCall = true;
              PromiseResolution(promise, y, resolve, reject);
            }
          },
          (err) => {
            if (!whoCall) {
              // 2.3.3.3.2 以err直接拒绝promise
              whoCall = true;
              reject(err);
            }
          }
        );
      } catch (e) {
        if (!whoCall) {
          // 2.3.3.3.4.1 - 2.3.3.3.4.2 如果调用then出错，就以这个出错信息直接拒绝promise
          whoCall = true;
          reject(e);
        }
      }
    } else {
      // 2.3.3.4 then不是函数，直接以x为值来解决promise
      resolve(x);
    }
  } else {
    // 2.3.4 x不是一个对象或者函数，直接以x为值来解决promise
    resolve(x);
  }
}
```

至此，我们的`Promise`实现基本完成。

但是如果以下面的代码来测试我们的`Promise`的话，会发现无法打印：

```javascript
const promise = new MyPromise(function (resolve, reject) {
  resolve(1);
});

promise.then((res) => {
  console.log(res); // 无法打印
});
```

这是为什么呢，重点就是我们在构造函数内部的`resolve`和`reject`函数，它们是同步，也就是：

```javascript
const promise = new MyPromise(function (resolve, reject) {
  resolve(1);
});
// 这里就已经遍历$onResolvedCallbacks或者$onRejectedCallbacks数组并执行了
// 而下面的注册的回调还没执行，导致了这个问题
promise.then((res) => {
  console.log(res); // 无法打印
});
```

解决的办法就是以异步的形式来解决`Promise`，以一个新的任务来解决`Promise`，也就是包裹在`setTimeout`中即可。

# 测试

现在来使用`Promise/A+`官方给定的测试数据来测试这个实现。

> github：[测试脚本](https://github.com/promises-aplus/promises-tests)

我们根据`README.md`，其实很简单，就是配置一个依赖，然后运行特定的命令即可。

首先先创建一个项目，使用`npm init`来初始化，`package.json`使用默认的即可。

接着导入这个库。

```json
{
  // ...
  "devDependencies": {
    "promises-aplus-tests": "*"
  }
  // ...
}
```

- 接着配置我们的`script`命令

```json
{
  // ...
  "devDependencies": {
    "promises-aplus-tests": "*"
  },
  "scripts": {
    // 这里的test/index.js修改成你想测试的文件路径
    "test": "promises-aplus-tests test/index.js"
  }
}
```

最后，需要以一个`es6 module`的形式来导出一个对象：

```javascript
// ...你的实现

const deferred = function () {
  let defer = {};
  defer.promise = new MyPromise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
};

module.exports = {
  deferred,
};
```

接着，就可以运行`npm test`的来进行愉快地测试了。

附上完整的代码：

```javascript
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

/**
 * @param executor 将会在未来执行的函数。
 * @constructor Promise构造函数
 */
function MyPromise(executor) {
  const self = this;

  self.$status = PENDING;
  self.$data = undefined;
  self.$onResolvedCallbacks = [];
  self.$onRejectedCallbacks = [];

  function resolve(value) {
    setTimeout(() => {
      if (self.$status === PENDING) {
        self.$status = RESOLVED;
        self.$data = value;
        self.$onResolvedCallbacks.forEach((fn) => {
          fn(value);
        });
      }
    }, 0);
  }

  function reject(err) {
    setTimeout(() => {
      if (self.$status === PENDING) {
        self.$status = REJECTED;
        self.$data = err;
        self.$onRejectedCallbacks.forEach((fn) => {
          fn(err);
        });
      }
    }, 0);
  }

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

MyPromise.prototype.then = function (onResolved, onRejected) {
  const self = this;
  let promise2;

  onResolved =
    typeof onResolved === "function"
      ? onResolved
      : function (value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function (err) {
          throw err;
        };

  if (self.$status === RESOLVED) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      setTimeout(() => {
        try {
          const res = onResolved(self.$data);
          PromiseResolve(promise2, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    }));
  }

  if (self.$status === REJECTED) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      setTimeout(() => {
        try {
          const res = onRejected(self.$data);
          PromiseResolve(promise2, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    }));
  }

  if (self.$status === PENDING) {
    return (promise2 = new MyPromise(function (resolve, reject) {
      self.$onResolvedCallbacks.push(function (value) {
        try {
          const res = onResolved(value);
          PromiseResolve(promise2, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });

      self.$onRejectedCallbacks.push(function (err) {
        try {
          const res = onRejected(err);
          PromiseResolve(promise2, res, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));
  }
};

function PromiseResolve(promise, x, resolve, reject) {
  if (promise === x) {
    reject(new TypeError());
    return;
  }

  if (x instanceof Promise) {
    x.then(resolve, reject);
  } else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    let then;
    try {
      then = x.then;
    } catch (e) {
      reject(e);
      return;
    }
    if (typeof then === "function") {
      let whoCall = false;
      try {
        then.call(
          x,
          (y) => {
            if (!whoCall) {
              whoCall = true;
              PromiseResolve(promise, y, resolve, reject);
            }
          },
          (err) => {
            if (!whoCall) {
              whoCall = true;
              reject(err);
            }
          }
        );
      } catch (e) {
        if (!whoCall) {
          whoCall = true;
          reject(e);
        }
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}

module.exports = MyPromise;
```

附上自己地测试截图

![](https://i.loli.net/2020/04/19/JZpKVgueaFxycwH.png)
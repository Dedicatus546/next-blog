---
title: JavaScript中的Promise
key: 1591889613date: 2020-06-11 23:33:33
updated: 2023-02-13 18:28:44
tags:
  - JavaScript
  - Promise
categories:
  - 编程
---


`JavaScript`中的`Promise`

<!-- more -->

# `Promise`

语法：`new Promise(function(resolve, reject){/*逻辑语句*/})`

所谓`Promise`，在英文中就是承诺的意思。

`Promise`接受一个函数，这个函数有两个参数：

- 第一个参数（一般名为`resolve`）：如果函数体内的操作成功，则应该调用这个函数，并传入成功的信息；
- 第二个参数（一般名为`reject`）：如果函数体内的操作失败或者出错，则应该调用这个函数，并传入失败的信息。

这个函数体内可以是同步或者异步操作。

每个`Promise`对象可以通过`.then`或者`.catch`的方式来定义成功或者错误的回调函数。

可以通过 `.finally`方法来定义回调的最后一定会执行的函数。

- `then(onFulfilled, onRejected)`：`then`方法传入两个函数作为参数；
  - `onFulfilled`函数有一个参数，表示`Promise`对象成功所传入的值；
  - `onRejected`函数有一个参数，表示`Promise`对象失败或者出错所传入的值；
- `catch(onRejected)`；
  - `onRejected`函数有一个参数，表示`Promise`对象失败或者出错所传入的值；
- `finally(onFinally)`；
  - `onFinally`函数有一个参数，无论`Promise`的状态是失败还是成功，最后都会执行这个函数。

PS：`Promise`对象的状态一旦确定，就不会再改变了。

如果一个`Promise`对象成功了之后，它就不会再变成失败的状态了。

同理，如果一个`Promise`对象失败了之后，它也就不会再变成成功的状态了。

比如现在我们希望在`3`s 之后向控制台打印数字`100`。

```javascript
var promise = new Promise(function (resolve, reject) {
  setTimeout(() => {
    resolve(100);
  }, 3000);
});
promise.then((val) => {
  console.log(val);
});
// 为了确定上面的log是异步的
console.log("不知道打印什么东西");
```

然后粘贴到控制台看看：

![](https://i.loli.net/2019/11/17/Z59LNCWTg4erlP6.png)

先打印了下面的一句`log`再打印了函数体里面的`log`。

可以证明这个`log`确实不是同步执行的。

而且可以发现，我们并没有执行传入`Promise`的函数，但是`setTimeout`确实是执行了。

也就是说当我们把这个函数作为参数传入时，这个函数就会开始执行了。

并且这个函数只执行一次。

我们可以试试失败的打印：

```javascript
var promise = new Promise(function (resolve, reject) {
  setTimeout(() => {
    reject("发生错误啦！！");
  }, 3000);
});
promise.then(null, (err) => {
  console.log("我是then方法捕获的错误" + err);
});
promise.catch((err) => {
  console.log("我是catch方法捕获的错误" + err);
});
// 为了确定上面的log是异步的
console.log("不知道打印什么东西");
```

运行代码，发现可以捕捉到错误：

![](https://i.loli.net/2019/11/18/bgTlIGN31aWkCKu.png)

现在如果希望不管`Promise`成功还是失败都执行一段逻辑。

很像从数据库读取数据的操作，不管读取数据的成功还是失败，最后都要关掉一些资源。

由于`Promise`的函数参数传入时就会开始执行。

可以通过一个函数每次返回一个新的`Promise`对象来查看不同的状态下的情况。

```javascript
var flag = true;

function testPromise() {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (flag) {
        resolve("运行成功方法啦!");
      } else {
        reject("运行失败方法啦！");
      }
      flag = !flag;
    }, 3000);
  });
}

testPromise()
  .then(
    (res) => {
      console.log(res);
    },
    (err) => {
      console.log(err);
    }
  )
  .finally(() => {
    console.log("我是最后要运行的逻辑啦!");
  });
```

运行代码：

![](https://i.loli.net/2019/11/18/6zTZv4Ne5ERypJa.png)

可以看到不管是成功或者是失败的状态下`finally`方法都会执行。

有时需要在几个异步操作都完成之后再执行一些操作。

这时就可以使用`Promise`上的静态`all`方法。

`all`方法传入一个可以迭代的对象，比如数组。

PS：这个数组里面可以是`Promise`对象也可以不是`Promise`对象，因为`Promise`都会对它进行包装。

然后返回一个新的`Promise`对象。

只有迭代对象内的`Promise`都成功（`resolve`）才会调用成功的方法。

参数为按照迭代对象内`Promise`成功的值所组成的数组。

如果迭代对象内某个`Promise`失败了话，就会调用失败的方法。

参数为某个`Promise`失败的原因。

```javascript
function testPromise(num, time) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (num < 10) {
        resolve(num);
      } else {
        reject("数字大于10，发生错误啦！");
      }
    }, time);
  });
}

var promiseArray = [
  testPromise(5, 2000),
  testPromise(4, 1000),
  testPromise(9, 500),
];

Promise.all(promiseArray).then((res) => {
  console.log(res);
});
```

运行代码：

![](https://i.loli.net/2019/11/18/HfUsWQdknZwOzRy.png)

因为这四个数都是小于`10`的，所以都会成功。

而且成功的执行函数的参数也是传入`all`方法中每个`Promise`对象成功的值组成的集合。

并且**保持着顺序**。

如果数组中有一个数大于`10`，那么整个`Promise`对象就会失败。

```javascript
function testPromise(num, time) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (num < 10) {
        resolve(num);
      } else {
        reject("数字" + num + "大于10，发生错误啦！");
      }
    }, time);
  });
}

var promiseArray = [
  testPromise(5, 2000),
  // 一个大于10的数
  testPromise(11, 1000),
  testPromise(9, 500),
];

Promise.all(promiseArray).then(
  (res) => {
    console.log(res);
  },
  (err) => {
    console.log(err);
  }
);
```

运行代码：

![](https://i.loli.net/2019/11/18/Ps9WSHkmUzOBh17.png)

整个`Promise`失败，并且传入了失败那个`Promise`的失败信息。

有时又并不想全部的异步执行完之后再执行操作。

只需要在一组异步操作中的某个异步执行完成之后就可以执行一段逻辑。

就可以使用`Promise.race`来包装一组`Promise`。

`race`方法和`all`方法的参数一样。

当数组中某一个`Promise`最先执行完成就会执行整个`Promise`的回调。

整个`Promise`的状态由数组中最先执行完成`Promise`的状态相等。

```javascript
function testPromise(num, time) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (num < 10) {
        resolve(num);
      } else {
        reject("数字" + num + "大于10，发生错误啦！");
      }
    }, time);
  });
}

var promiseArray = [
  testPromise(5, 2000),
  testPromise(4, 1000),
  testPromise(9, 500),
];

Promise.race(promiseArray).then((res) => {
  console.log(res);
});
```

运行代码：

![](https://i.loli.net/2019/11/18/ZxifMpIARVG6lsy.png)

`500`ms 的最先执行，所以整个`Promise`的状态就和第三个`Promise`的状态相等。

```javascript
function testPromise(num, time) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      if (num < 10) {
        resolve(num);
      } else {
        reject("数字" + num + "大于10，发生错误啦！");
      }
    }, time);
  });
}

var promiseArray = [
  testPromise(5, 2000),
  testPromise(11, 400),
  testPromise(9, 500),
];

Promise.race(promiseArray).then(
  (res) => {
    console.log(res);
  },
  (err) => {
    console.log(err);
  }
);
```

运行代码：

![](https://i.loli.net/2019/11/21/yWoZuVlwzHg3J6X.png)

`400`ms 的`Promise`最先执行，但是由于数字是`11`大于了`10`。

所以进入了错误处理的逻辑，打印了错误。

`Promise`解决了回调地狱的问题。

这里可以拿`jquery`的`ajax`方法来做例子。

之前要发起异步的网络请求的时候。

用`jquery`的`ajax`方法是这样写的。

```javascript
$.ajax({
  // 省略一些配置
  success: function () {
    // 成功的回调
  },
  error: function () {
    // 失败的回调
  },
});
```

如果我们想在特定的异步完成之后再执行另一个异步。

写起来就会是这样：

```javascript
$.ajax({
  // 省略一些配置
  success: function () {
    // 成功的回调
    $.ajax({
      // 省略一些配置
      success: function () {
        // 成功的回调
        $.ajax({
          // 省略一些配置
          success: function () {
            // 成功的回调
          },
          error: function () {
            // 失败的回调
          },
        });
      },
      error: function () {
        // 失败的回调
      },
    });
  },
  error: function () {
    // 失败的回调
  },
});
```

这样的代码就像是套娃一样。

一个套着一个。

非常不易读。

如果用`Promise`的话 上述代码可以改写成：

```javascript
// 定义一个网络请求的函数，返回一个Promise
// 省略一些参数
function fetch(url, data) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      // 省略一些配置
      success: function () {
        // 成功回调
        // 可以传入成功的值
        resolve();
      },
      error: function () {
        // 失败回调
        // 可以传入失败的原因
        reject();
      },
    });
  });
}

fetch("url1", {})
  .then((res) => {
    // 第一个网络请求成功
    // 执行第二个网络请求
    return fetch("url2", {});
  })
  .then((res) => {
    // 第二个网络请求成功
    // 执行第三个网络请求
    return fetch("url3", {});
  })
  .then((res) => {
    // 第三个网络请求成功
  })
  .catch((err) => {
    // 处理错误
  });
```

这里要说明下。

对于`then`方法，如果你在方法体内返回值的话。

都会被包装成一个`Promise`。

这样就可以进行链式调用了。

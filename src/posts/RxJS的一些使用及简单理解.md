---
title: RxJS 的一些使用及简单理解
key: 1651140761date: 2022-04-28 18:12:41
updated: 2023-02-13 18:28:45
tags:
- RxJavaScript
- JavaScript
categories:
- 编程
---


# 前言

这阵子在看 `Angular` ，谷歌的东西看着确实很让人感兴趣

<!-- more -->

虽然感觉国内公司用的不多

在写一些简单的 `demo` 时， 返回 `Observable` 对象很常见

so，一边学习 `Angular` ，一边来看 `RxJS` 的文档来学习学习

# 正文

`RxJS` 全称 `Reactive JavaScript` ，官方仓库：[ReactiveX / rxjs](https://github.com/ReactiveX/rxjs)

在 `RxJS` 文档中，我们开始其实只需要理解下面几个概念即可

- `Observable`
- `Observer`
- `Subscription`

理解上面的三个概念之后就可以愉快地使用 `RxJS` 了

## Observable 和 Observer

`Observable` 为可观察对象，简单点理解，这个对象可以产生一些值供使用

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.complete();
});
```

如何去获取 `next` 出来的值呢，这就要使用 `subscribe` 这个方法了

`subscribe` 需要我们传入一个 `Observer` 对象，使得我们能够取到 `next` 出来的数据

`Observer` 对象可以简单理解为一个包含了 `next` ，`complete` ，`error` 函数的简单对象即可

```javascript
// 上个片段代码...

const observer = {
  next(val) {
    // 得到数据
    console.log(val);
  },
  complete() {
    console.log('complete');
  }
}

observable.subscribe(observer);
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061619232.avif)

是不是莫名觉得有点熟悉，是的，很像 `Promise`

上面的代码可以理解为以下代码

```javascript
const promise = new Promise((resolve, reject) => {
  resolve(1);
});

promise.then((val) => {
  console.log(val);
});
```

那么 `Promise` 和 `Observable` 有什么不同的？

## `Promise` 和 `Observable` 的不同

### 多次生成值

`Observable` 可以多次生成值，而 `Promise` 只能生成一次值。在传入 `Observable` 的函数中，通过 `subscriber.next` 函数可以多次生成值，结束的标志是调用 `subscriber.complete` 函数

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.next(4);
  // ...
  
  // 结束
  subscriber.complete();
});
```

---

### 上下文隔离

对于每一次对 `Observable` 的 `subscribe` 调用，都会是一个新的上下文，而 `Promise` 对于多个 `then` 调用只有一个上下文

这点看起来不是很容易理解，写个代码就很清晰了

`Observable` 例子

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(Math.random());
});

// 以下两次 subscribe ，输出 val 的值是不同的
observable.subscribe((val) => console.log(val));
observable.subscribe((val) => console.log(val));
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061635148.avif)

`Promise` 例子

```javascript
const promise = new Promise((resolve, reject) => {
  resolve(Math.random());
});

// 以下两次 then ，输出 val 的值是相同
promise.then((val) => console.log(val));
promise.then((val) => console.log(val));
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061638952.avif)

从这两个结果我们可以看出，调用 `subscribe` 函数会重新运行传入 `Observable` 的函数来生成一份新的上下文，而 `Promise` 只会执行一次传入的回调

---

### 不支持链式调用

`Observable` 是不支持链式调用的，因为调用 `subscribe` 的返回值并不是 `Observable` ，而是 `Subscription` （这个后面会讲到）， 而 `Promise` 支持

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061717995.avif)

---

### 回调同步执行

- 执行传入 `subscribe` 的函数的时机取决于传入 `Observable` 函数的上下文，而 `Promise` 中通过 `then` 注册的函数会延迟到本轮的微任务队列中再执行

`Observable` 例子

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(Math.random());
  setTimeout(() => {
    console.log("setTimeout before");
    subscriber.next(200);
    console.log("setTimeout after");
  }, 2000);
});

console.log("before");
observable.subscribe(val => console.log(val));
console.log("after");
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061726433.avif)

`Promise` 例子

```javascript
const promise = new Promise((resolve, reject) => {
  resolve(Math.random());
});

console.log("before");
promise.then((val) => console.log(val));
console.log("after");
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061653788.avif)

通过例子，可以看出，不管如果 `Observable` 存在同步的 `next` 还是异步的 `next` ， `observer` 的回调都会在这个 `next` 之后立即执行

---

### 构造器传入函数延迟执行

传入 `Observable` 的函数只有在调用 `subscribe` 之后，才会执行，而 `Promise` 会在初始化对象时就会执行传入的函数

```javascript
import { Observable } from "rxjs";

// 不会执行传入的函数
new Observable((subscriber) => {
  console.log("observable init");
  subscriber.next(Math.random());
});

// 会执行传入的函数
new Promise((resolve) => {
  console.log("promise init");
  resolve(Math.random());
});
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/06/202205061710387.avif)

## Subscription

在上面的对比中，我们提到 `Observable` 是不支持链式调用的，即调用 `subscribe` 返回的对象不是 `Observable` ，而是 `Subscription` 

`Subscription` 对象只有一个方法，就是 `unsubscribe` ，这个方法用来取消 某个 `Observer` 对 `Observable` 的观察

不过前面我们都没用到这个功能，我们可以换个例子

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  let i = 0;
  setInterval(() => {
    subscriber.next(++i);
  }, 1000);
});

observable.subscribe((val) => console.log(val));
```

上面的例子为每一秒 `next` 出一个值

但是有个问题是，当我们不想要它继续产生值的话，我们可能会这样写

```javascript
import { Observable } from "rxjs";

let t = null;

const observable = new Observable((subscriber) => {
  let i = 0;
  t = setInterval(() => {
    subscriber.next(++i);
  }, 1000);
});

observable.subscribe((val) => console.log(val));

clearInterval(t);
```

当然这样写有一个很明显的问题，就是我们和外界的变量耦合了，这会影响系统的稳定性

所以我们可以换成下面的写法

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  let i = 0;
  const t = setInterval(() => {
    subscriber.next(++i);
  }, 1000);
  
  // 返回一个函数
  return () => {
    clearInterval(t);
  }
});

const subscription = observable.subscribe((val) => console.log(val));

// 5 秒后清除定时器
setTimeout(() => subscription.unsubscribe(), 5000);
```

可以简单理解为这个 `Subscription` 对象就是为了释放占用的资源

当然，如果 `Observable` 的结束是可以预测的话，即我们能够去调用 `complete` 方法，也是会执行内部返回的函数

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  let index = 0;
  const t = setInterval(() => {
    console.log(index++);
    // 在 5 的时候完成
    if (index === 5) {
      subscriber.complete();
    }
  }, 1000);
  return () => {
    console.log("clear timer");
    clearInterval(t);
  };
})

observable.subscribe((val) => console.log(val));
```

上面的例子会输出 `0 1 2 3 4 clear timer`

但是如果 `Observable` 的结束无法预测，比如上面的这个包装 `setInterval` 例子，这时候只能通过手动调用 `unsubscribe` 来清除定时器
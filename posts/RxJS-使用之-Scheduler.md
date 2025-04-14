---
title: RxJS 使用之 Scheduler
key: 1654826554date: 2022-06-10 10:02:34
updated: 2023-02-13 18:28:45
tags:
- RxJavaScript
- JavaScript
categories:
- 编程
---


# 前言

`RxJS` 使用之 `Scheduler` （调度器）

<!-- more -->

# 正文

`scheduler` 在英文中意思为调度器，放到 `RxJS` 中，它的作用是控制可观察对象如何在什么时候发出值

在何时这种说法看起来有点抽象，在 `JS` 中，其实就是对应几种异步的 `API`

- `setTimeout` / `setInterval`
- `Promise.resolve`
- `requestAnimationFrame`

光靠文字可能无法理解它是如何运行的，我们可以写几个例子

```javascript
import { observeOn, of } from "rxjs";

console.log("subscribe before.");
of(1, 2, 3)
  .subscribe((val) => console.log(val));
console.log("subscribe after.");
```

对于以上代码的输出，我们非常容易计算出来

```text
subscribe before.
1
2
3
subscribe after.
```

现在通过调度器，我们可以将可观察对象的输出延后

```javascript
import { observeOn, of, asyncScheduler } from "rxjs";

console.log("subscribe before.");
of(1, 2, 3)
  // 使用 observeOn 操作符应用了一个异步的调度器，返回了一个新的可观察对象
  .pipe(observeOn(asyncScheduler))
  .subscribe((val) => console.log(val));
console.log("subscribe after.");
```

现在，代码的输出就变为了

```text
subscribe before.
subscribe after.
1
2
3
```

可以发现，发出的值的时间发生了改变，这个顺序很熟悉，我们可以用 `setTimeout` 自写一个管道来完成这个功能

```javascript
import { of, Observable } from "rxjs";

const myPipe = () => {
  return (source) => {
    return new Observable((subscriber) => {
      source.subscribe({
        next(val) {
          // 异步延迟到下一个宏任务执行
          setTimeout(() => {
            subscriber.next(val);
          });
        },
        complete() {
          // 异步延迟到下一个宏任务执行
          setTimeout(() => {
            subscriber.complete();
          });
        },
        error(e) {
          // 异步延迟到下一个宏任务执行
          setTimeout(() => {
            subscriber.error(e);
          });
        },
      });
    });
  };
};

console.log("subscribe before.");
of(1, 2, 3)
  .pipe(myPipe())
  .subscribe((val) => console.log(val));
console.log("subscribe after.");
```

结果完全一样，但是要注意， `asyncScheduler` 内部是使用 `setInterval` 来模拟 `setTimeout` 的，这里要注意

不过这里我们的重点不是它的实现细节

在 `RxJS` 里面，提供了几种不同的调度器供我们使用

- `queueScheduler`
- `asapScheduler`
- `asyncScheduler`
- `animationFrameScheduler`

**大多数情况下，调度的策略都是同步执行的，即不指定任何的调度器**

其中 `asyncScheduler` 我们已经说过了，它的底层是 `setInterval`

而 `animationFrameScheduler` 的底层为 [`requestAnimateFrame`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame) ，它的执行时机是在浏览器下一次重绘之前

`asapScheduler` 的底层为 `Promise.resolve` ，即执行时机延迟到微任务中

`queueScheduler` 的继承于 `asyncScheduler` ，如果不指定延迟时间 `delay` ，那么它就是同步的，如果指定延迟时间 `delay` ，那么它使用的就是 `asyncScheduler` 的策略

在很多地方， `RxJS` 会应用合适的调度器，比如之前我们使用的防抖节流的管道 `debounceTime` 和 `throttleTime` ，内部都是使用 `asyncScheduler` 作为调度器的，对于使用者来说基本无感
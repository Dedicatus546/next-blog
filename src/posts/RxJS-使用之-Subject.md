---
title: RxJS 使用之 Subject
key: 1653287509date: 2022-05-23 14:31:49
updated: 2023-02-13 18:28:45
tags:
- RxJavaScript
- JavaScript
categories:
- 编程
---


# 前言

在写完 `pipe` 管道之后，写一写 `Subject`

<!-- more -->

# 正文

## 什么是 Subject

什么是 `Subject` ，官网的解释如下

> An RxJS `Subject` is a special type of `Observable` that allows values to be multicasted to many Observers. While plain Observables are unicast (each subscribed Observer owns an independent execution of the `Observable`), Subjects are multicast.

`Subject` 是一种特殊 `Observable` 可观察对象，它允许将值多播给多个观察者。普通的 `Observable` 是单播的，即每个 `subscribe` 的观察者都拥有独立的上下文，而 `Subject` 是多播的

在写《 `RxJS` 的一些使用及简单理解》的时候，提到过 `Observable` 的上下文是隔离的

```javascript
import { Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(Math.random());
  subscriber.complete();
});

observable.subscribe((val) => console.log(val));
observable.subscribe((val) => console.log(val));
```

上面的代码会输出不同的值，即每调用一次 `subscribe` ，都会执行一次传入 `Observable` 的函数，来生成一个新的上下文

如果使用了 `Subject` ，那么两次 `subscribe` 的结果将会一样

```javascript
import { Subject } from "rxjs";

const subject = new Subject();

subject.subscribe((val) => console.log(val));
subject.subscribe((val) => console.log(val));

subject.next(Math.random());
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/23/202205231458358.avif)

是不是感觉很熟悉，很像 `EventEmitter` 在注册一个事件？

完全可以看作在注册一个具名的事件， `next` 就像 `emit` ，而 `subscribe` 就像 `on` 

对于每个 `Subject`，它都维护了一个 `Observer` 队列，每当调用 `subscribe` 时把传入的 `Observer` 加入到队列中，当产生了新的值时，会遍历这个队列，将值发送给每个 `Observer`

PS：这里要注意，调用 `Subject` 的 `subscribe` 并不会和普通的 `Observable` （通过 `new  Observable` 产生的）对象调用 `subscribe` 一样，执行传入 `Observable` 回调（ `Subject` 的构造函数无需传入函数）生成一个新的上下文

这里可能会有疑问：你这个 `Subject` 怎么还有 `next` 方法，它不是可观察对象吗？

没错，`Subject` 是一个可观察对象（ `Observable` ），同时也是一个观察者（ `Observer` ）

换句话说， `Subject` 不仅可以被其他可观察对象订阅，也可以订阅其他的观察者

## Subject 有什么用

经过上面的分析，我们知道了 `Subject` 的核心能力就是可以把单播的 `Observable` 转成多播的 `Observable`

不过我们很难去想象实际的使用场景，所以我去扒了以下 ant-design 的 angular 版本，找到了比较优雅的应用

### 使用 Subject 来统一 unsubscribe 已 subscribe 的流

我们知道，当 `Observable` 被 `subscribe` 之后，会返回一个 `Subscription` ，调用它的 `unsubscribe` 可以执行预先定义的函数，一般用于释放一些资源或者结束定时器等

基于此，我们很容易写出下面这样的代码

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: '.test',
  template: `<div></div>`,
})
export class TestComponent implements OnInit, OnDestroy {
  subscription1 = Subscription.EMPTY;
  subscription2 = Subscription.EMPTY;

  observable1;
  observable2;

  constructor() {
    this.observable1 = new Observable((subscriber) => {
      let index = 0;
      const timer = setInterval(() => {
        subscriber.next(index++);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
    this.observable2 = new Observable((subscriber) => {
      let index = 0;
      const timer = setInterval(() => {
        subscriber.next(index++);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
  }

  ngOnInit() {
    this.subscription1 = this.observable1.subscribe((val) => console.log(val));
    this.subscription2 = this.observable2.subscribe((val) => console.log(val));
  }

  ngOnDestroy() {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
  }
}
```

看起来好像没什么问题，但是如果此时不是两个，而是 `20` 个 `Observable` 需要释放呢

写 `20` 个 `Subscription` 变量，然后去依次调用 `unsubscribe` ，有点憨憨

这时候我们就可以使用 `Subject` 以及 `pipe` 来简化代码

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: '.test',
  template: `<div></div>`,
})
export class TestComponent implements OnInit, OnDestroy {
  observable1;
  observable2;

  destory$ = new Subject<void>();

  constructor() {
    this.observable1 = new Observable((subscriber) => {
      let index = 0;
      const timer = setInterval(() => {
        subscriber.next(index++);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
    this.observable2 = new Observable((subscriber) => {
      let index = 0;
      const timer = setInterval(() => {
        subscriber.next(index++);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
  }

  ngOnInit() {
    this.observable1
      .pipe(takeUntil(this.destory$))
      .subscribe((val) => console.log(val));
    this.observable2
      .pipe(takeUntil(this.destory$))
      .subscribe((val) => console.log(val));
  }

  ngOnDestroy() {
    this.destory$.next();
    this.destory$.complete();
  }
}
```

这里使用了 `takeUntil` 这个管道，这个管道的作用就是在传入的流发出值时，结束源流的订阅（调用 `complete` ）

可以用官网的一张图来解释 `takeUntil`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/23/202205231724507.avif)

不过这似乎和多播特性无关，只是使用了 `Subject` 作为 `Observer` 的特性（可以调用 `next` 发出值）

### 模拟 EventBus 事件总线

可以创建一个 `Service` ，内部使用 `Subject` 来模拟 `EventBus`

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TestService implements OnDestroy {
  eventMap: Record<string, Subject<any[]>> = {};
  destroy$ = new Subject<void>();

  on<T extends any[]>(
    eventName: string,
    callback: (...args: T) => void
  ): Subscription {
    if (this.eventMap[eventName] === undefined) {
      this.eventMap[eventName] = new Subject<any[]>();
    }
    const subject = this.eventMap[eventName];
    return subject
      .pipe(takeUntil(this.destroy$))
      .subscribe((args) => callback(...(args as T)));
  }

  emit<T extends any[]>(eventName: string, ...args: T): void {
    if (this.eventMap[eventName] === undefined) {
      return;
    }
    this.eventMap[eventName].next(args);

    if (this.eventMap['*'] === undefined) {
      return;
    }
    this.eventMap['*'].next([...args, eventName]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

和 `mitt` 库的区别就是没有了 `off` 函数，而是使用 `Subscription` 的 `unsubscribe` 方法来取消监听

## 几种 Subject 子类

在官方的实现中，提供了几种 `Subject` 的子类供我们使用，每种子类 `Subject` 都有各自的特性

### BehaviorSubject

特征：能够向订阅的 `Observer` 立即发送“最近”的一个值

```javascript
import { BehaviorSubject } from "rxjs";

// 构造函数可以传入一个初始值
const subject = new BehaviorSubject(0);

subject.subscribe((val) => console.log("第一个 Observer ", val)); // 立即收到值 0

subject.next(1);    // 第一个 Observer 打印 1
subject.next(2);    // 第一个 Observer 打印 2

subject.subscribe((val) => console.log("第二个 Observer ", val)); // 立即收到值 2
```

上面的输出如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/24/202205241103582.avif)

注意，如果不向 `BehaviorSubject` 的构造函数传入默认的初始值，那么第一个 `Observer` 会打印 `undefined`，也就是默认的初始值被置为了 `undefined`

```javascript
import { BehaviorSubject } from "rxjs";

const subject = new BehaviorSubject();

subject.subscribe((val) => console.log("第一个 Observer ", val)); // 立即收到值 undefined
```

### ReplaySubject

特征：能够向订阅的 `Observer` 立即发送“最近”的**一些在限制范围内**的值

`BehaviorSubject` 可以理解为一个特殊的 `ReplaySubject` ， `ReplaySubject` 可以通过指定 `bufferSize` 来获取“最近”的**一些**值

```javascript
import { ReplaySubject } from "rxjs";

const subject = new ReplaySubject(3);

subject.subscribe((val) => console.log("第一个 Observer ", val)); // 不会输出任何东西

subject.next(1); //第一个 Observer 输出 1
subject.next(2); //第一个 Observer 输出 2
subject.next(3); //第一个 Observer 输出 3
subject.next(4); //第一个 Observer 输出 4

subject.subscribe((val) => console.log("第二个 Observer ", val)); // 第二个 Observer 立即输出 2，3，4

subject.next(5) // 两个 Observer 都输出 5
```

上面的输出如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/24/202205241135226.avif)

除了限定 `bufferSize` ，还可以通过第二个参数指定 `windowTime` 来进一步限定个数

即在 `subscribe` 之后，查找往前 `windowTime` 内，最大 `bufferSize` 个数的值，然后按顺序发送给 `Observer`

```javascript
import { ReplaySubject } from "rxjs";

const subject = new ReplaySubject(3, 500);

setTimeout(() => {
  subject.next(1);
}, 200);

setTimeout(() => {
  subject.next(2);
}, 400);

setTimeout(() => {
  subject.next(3);
}, 600);

setTimeout(() => {
  // 输出 2，3
  subject.subscribe((val) => console.log(val));
}, 800);
```

上面的输出如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/24/202205241147595.avif)

为什么输出 `2 3` ，而不是 `1 2 3` 呢

因为我们在 `800ms` 时 `subscribe` 了，这时往前找 `500ms` 内的值，即 `300ms` 之后发送的值，而 `1` 是 `200ms` 发送的值，所以不会发送给 `Observer`

简而言之，`bufferSize` 和 `windowTime` 共同限制给 `Observer` 发送值的数量

如果这 `bufferSize` 个值正好都是 `windowTime` 内发出的，那么皆大欢喜，全丢给 `Observer` 即可

如果某些值不在 `windowTime` 内发出（早于 `windowTime` ），那么就舍弃这部分值，把在 `windowTime` 内的值丢给 `Observer` 即可

### AsyncSubject

特征：只取**最后一个**值，在 `Subject` 完成之后（调用 `complete` ）

```javascript
import { AsyncSubject } from "rxjs";

const subject = new AsyncSubject();

subject.next(1);
subject.next(2);

subject.subscribe((val) => console.log(val));

subject.complete(); // 输出 2
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/05/24/202205241417686.avif)

`AsyncSubject` 很像普通的 `Observable` 配合 `last` 管道

```javascript
import { last, Observable } from "rxjs";

const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

observable.pipe(last()).subscribe((val) => console.log(val)); // 输出 3
```
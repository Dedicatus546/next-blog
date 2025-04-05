---
title: RxJS 源码解读之 Observable
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1697450498date: 2023-10-16 18:01:38
updated: 2023-10-16 18:01:38
---


# 前言

RxJS 源码解读之 `Observable` 。

<!-- more -->

之前的时候，我们写过几篇关于 RxJS 基本使用的文章：

- [RxJS 的一些使用及简单理解](/776cd3d8c7d9.html)
- [RxJS 一些有趣的 operate 操作符](/b4d3483087f0.html)
- [RxJS 使用之 pipe 管道](/0d441631e194.html)
- [RxJS 使用之 Subject](/93b17fcedd54.html)
- [RxJS 使用之 Scheduler](/dfd7127274b8.html)

这次，我们来写一些关于 RxJS 的一些内部实现。

# 正文

## 概念

RxJS 中最核心的类就是 `Observable` 了，很多东西都是通过 `Observable` 派生出来的，比如：

- operator 操作符 ， `of` 、`fromEvent`、`interval` 等等操作符。
- pipe 管道，管道内部都是通过返回一个新的 `Observable` 对象来实现数据的处理，这也表明管道的实现并不是一个黑盒，我们也可以手写自定义的管道。
- `Subject` 主题，继承自 `Observable` ，实现了多播，以及 `Subject` 本身又派生出了 `BehaviorSubject` 、 `ReplySubject` 、 `AsyncSubject` 等特殊的 `Subject` 。

Observable 在英文里的意思为可观察的，但其实 `Observable` 类本身并不承载关于“观察”本身详细的逻辑，更准确点讲它是一个抽象出来的容器，它能够接收“观察”逻辑以及“观察者”，然后在合适的时机就会进行订阅操作。

在官网上，也存在一个很经典的表格：

|          | SINGLE                                                                                              | MULTIPLE                                                                                          |
|----------|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **PULL** | [Function](https://developer.mozilla.org/en-US/docs/Glossary/Function)                              | [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) |
| **PUSH** | [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) | [Observable](https://rxjs.dev/api/index/class/Observable)                                         |

Single / Multiple 这个类别还是很好理解的， `Function` 和 `Promise` 都是只能“返回”一次， `Function` 自然不用多说，在一个函数体的内部，你只能有一个 `return` 语句生效；对于 `Promise` ，它只要调用 `resolve` 之后， `Promise` 的状态就从 pending 变为 resolved 了，这意味着你无法再 `resolve` 值出去了。而对于 `Iterator` 和 `Observable` ，它们可以产生多个值， `Iterator` 使用生成器函数来生成，在函数内部可以通过 `yield` 来多次“返回”值， `Observable` 则是通过传入的观察者的 `next` 函数来多次发出值。

这里你可能会误认为 SINGLE 是返回一个值，而 MULTIPLE 是返回多个值，即误认为是它们的区别是返回数据的个数，其实不然， `Function` 和 `Promise` 都可以通过构建对象来返回一个包含巨量信息的值，但是它们俩和后面 `Iterator` 和 `Observable` 的核心区别就是，它们俩只能“返回”一次。

Pull / Push 两者的区别在官网中也有[专门讨论](https://rxjs.dev/guide/observable#pull-versus-push)。 

> **Pull** and **Push** are two different protocols that describe how a data Producer can communicate with a data Consumer.

Pull 和 Push 是描述数据生产者是如何和数据消费者之间是如何联系的两种不同的协议。 在 Pull 模型中，消费者决定了何时从生产者获取值，而在 Push 模型中，是生产者决定何时向消费者推送值。 Push 模型相比 Pull 模型，其实就可以说是一种控制反转。

如果不懂的问题不大，其实写多了自然就会理解这个关系了，对于一些同步的操作，很多时候我们用的都是 Pull 模型，而很多的异步操作则较多时候会使用 Push 模型。

## 源码

这次我们先来瞧一瞧 `Observable` 在内部是如何运作的。

RxJS 的仓库地址：[点击直达](https://github.com/ReactiveX/rxjs)。

代码库中的核心实现都位于 `packages/rxjs/src/internal` 下，其他的文件夹，比如 `packages/rxjs/fetch` ，都是导出 `packages/rxjs/src/internal` 该文件夹下面的实现的。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/16/202310160949411.avif)

本文关于 `Observable` 实现的文件位置在 `packages/rxjs/src/internal/Observable.ts` 。

核心的实现包含下面这四个方法（ `pipe` 之后再讲）。

```typescript
export class Observable<T> implements Subscribable<T> {
  constructor(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    // ...
  }

  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    // ...
  }
  
  protected _trySubscribe(sink: Subscriber<T>): TeardownLogic {
    // ...
  }
  
  protected _subscribe(_subscriber: Subscriber<any>): TeardownLogic {
    // ...
  }
}
```

RxJS 内部使用了很多的简单类型来进行搭建，这里我们要先认识两个类型 `Subscribable` 和 `Unsubscribable` ，这俩的实现如下：

```typescript
// packages/rxjs/src/internal/types.ts

export interface Subscribable<T> {
  subscribe(observer: Partial<Observer<T>>): Unsubscribable;
}

export interface Unsubscribable {
  unsubscribe(): void;
}
```

这俩个类型其实就定义了如何订阅以及如何取消订阅，我们可以用下面的伪代码来表示：

```javascript
const observer = // ...

const subscribable = new Subscribable(observer);

// 订阅
const unsubscribable = subscribable.subscribe(observer);

// 取消订阅，也就是释放资源
unsubscribable.unsubscribe();
```

因为 `Observable` 实现了 `Subscribable` ，所以我们可以看到内部也有实现了 `subscribe` 方法：

```typescript
export class Observable<T> implements Subscribable<T> {
  // ...
  
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    const subscriber = observerOrNext instanceof Subscriber ? observerOrNext : new Subscriber(observerOrNext);
    subscriber.add(this._trySubscribe(subscriber));
    return subscriber;
  }
}
```

这里的 `Observer` 类型非常简单，它的定义如下：

```typescript
// packages/rxjs/src/internal/types.ts

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
```

其实就是一个包含了 `next` 、 `complete` 、 `error` 方法的对象，类似下面这样：

```typescript
const observer = {
  next(value) {
    // ...
  },
  complete() {
    // ...
  },
  error(e) {
    // ...
  }
}
```

这里我们先不管 `new Subscriber(observerOrNext)` 内部干了什么，我们只要简单地理解为规范化生成了一个 `Observer` 对象。

这里的 `Subscription` 类型我们也先不管，只要简单地理解为 `Subscription` 实现了 `Unsubscribable` 接口即可，即返回了一个 `unsubscribe` 的方法。

接着 `subscriber.add(this._trySubscribe(subscriber))` 这一句我们也不管，我们可以把这个方法简写为如下：

```typescript
export class Observable<T> implements Subscribable<T> {
  // ...
  
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    // 规范化 observer 对象结构
    const observer = normalizeObserver(observerOrNext);
    
    // 得到一个取消订阅的函数
    const unsuscribeFn = this._trySubscribe(observer);
    
    // 返回一个 Unsubscribable 类型对象
    return {
      unsubscribe: unsubscribeFn
    };
  }
}
```

经过简写之后，我们可以知道 `subscribe` 并不是真正执行订阅操作的地方，而是通过 `_trySubscribe` 方法来执行订阅：

```typescript
export class Observable<T> implements Subscribable<T> {
  
  protected _trySubscribe(observer: Subscriber<T>): TeardownLogic {
    try {
      return this._subscribe(observer);
    } catch (err) {
      observer.error(err);
    }
  }
}
```

这个逻辑很简单，把 `_subscribe` 的执行包在 `try-catch` 中 ，如果报错就调用相应的 `error` 方法通知，但是，为什么说执行了 `_subscribe` 函数就是执行了订阅了呢？

这里我们要看 `_subscribe` 函数本身以及 `constructor` 构造函数。

```typescript
export class Observable<T> implements Subscribable<T> {
  constructor(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    if (subscribe) {
      this._subscribe = subscribe;
    }
  }
  
  protected _subscribe(_subscriber: Subscriber<any>): TeardownLogic {
    return;
  }
}
```

`_subscribe` 默认情况下是一个空函数，也就是说不做任何的操作，在 `constructor` 构造函数中，如果传入了 `subscribe` 函数，则会重写到自身的 `_subscribe` 函数。

空函数意味着我们完全可以不传参数来 `new Observable()` ，而不会造成调用时产生 undefined 异常。

即可以理解为 `_subscribe` 保存了外部传入的 `subscribe` 函数的一个**引用**。

这里你可能就会有疑问了，为什么要再拆出一个 `trySubscribe` 函数呢？这不是脱裤子放屁吗？我完全可以写成如下啊：

```typescript
export class Observable<T> implements Subscribable<T> {
  // ...
  
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    // 规范化 observer 对象结构
    const observer = normalizeObserver(observerOrNext);
    
    // 得到一个取消订阅的函数
    let unsuscribeFn;
    try {
      unsuscribeFn = this._subscribe(subscriber);
    } catch (err) {
      subscriber.error(err);
    }
    
    // 返回一个 Unsubscribable 类型对象
    return {
      unsubscribe: unsubscribeFn
    };
  }
}
```

这里是由于其他的功能，比如 `Subject` 它也会继承 `Observable` ，通过分离规范化 `Observer` 对象操作以及真正的订阅操作，可以重写更少的范围。

`Subject` 和 `Observable` 都对外提供了一个 `subscribe` 方法，用来执行内部的 `_subscribe` 方法，这时，规范化 `Observer` 对象这个操作对这两者来说是不用变化的，也就是说规范化这个操作是与这两者无关的，只要需要“订阅”，那么就一定需要“规范化”入参。这里等到后面讲到 `Subject` 的时候大概就能理解了， `Subject` 内部会重写 `_subscribe` 方法来实现 `Subject` 提供的功能。

## 手写简单实现

到这里， `Observable` 的核心实现基本就解释完了。可能你会觉得：卧槽，这 TypeScript 类型看的我头疼，那么接下来，我们来手把手写一个迷你版的 `Observable` 实现。

我们将不去校验入参，以及不在意类型抽象，来重写。

第一步，我们需要创建一个 `Observable` 类，通过构造函数把传入的 `subscribe` 函数挂到自身。

```typescript
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe ?? function (){}
  }
}
```

第二步，我们实现 `subscribe` 方法，把传入的 `observer` 透传给 `_subscribe` 函数即可。同时包裹 `try-catch` 来捕获同步的错误。

```typescript
class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe ?? function (){}
  }
  
  subscribe(observer) {
    let unsubscribe;
    try {
      unsubscribe = this._subscribe(observer) ?? function (){};
    } catch (e) {
      observer.error(e);
    }
    return {
      unsubscribe,
    };
  }
}
```

至此，一个迷你的 `Observable` 就完成了，是不是很简单，我们可以简单地使用一下：

```typescript
const observable$ = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.complete();
  return () => {
    console.log("清理一下");
  }
});

const subscription = observable$.subscribe({
  next(value) {
    console.log("next: ", value);
  },
  complete() {
    console.log("complete");
  },
  error(e) {
    console.error(e);
  }
});

subscription.unsubscribe();
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/16/202310161139798.avif)

当然，我们这个实现还有很多的问题，除了前面我们所说的入参以及抽象，还有比如在执行 `complete` 函数的时候应该在执行完 `complete` 逻辑之后执行 `unsubscribe` 函数进行清理操作。

不过这个迷你版的实现基本上就道出了 `Observable` 的核心。

进一步简化的话，我们其实就是定义了一个函数以及一个对象，然后把这个对象传入这个函数而已。

```typescript
const subscribe = (subscriber) => {
  subscriber.next(1);
  subscriber.complete();
  return () => {
    console.log("清理一下");
  }
}

const observer = {
  next(value) {
    console.log("next: ", value);
  },
  complete() {
    console.log("complete");
  },
  error(e) {
    console.error(e);
  }
}

// 订阅
const unsubscribe = subscribe(observer);

// 取消订阅，即清理操作
unsubscribe();
```

通过抽象出 `Observable` 类，可以以面向对象的方式来进行调用，以及把一些逻辑隐藏在类的内部来实现更多的功能，比如 `Observable.prototype.pipe` 函数。

# 后记

下一篇我们会讲 `Subscriber` 、 `Subscription` 这俩类的实现，它们的实现和 `Observable` 的关系还是比较深的，也是比较基础的类。
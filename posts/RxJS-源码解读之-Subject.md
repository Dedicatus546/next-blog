---
title: RxJS 源码解读之 Subject
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1697766969date: 2023-10-20 09:56:09
updated: 2023-10-20 17:26:26
---


# 前言

RxJS 源码解读之 `Subject` 。

<!-- more -->

在前面三篇文章中，我们分别对 Observable 、 Subscriber 、 Subscription 进行了讲解。

本文主要讲的是基于 Observable 的扩展，能够多播的 Observable ，即 Subject 。

# 正文

## 概念

在 RxJS 中， Observable 是单播上下文隔离的，从源码中我们知道，当调用 Observable 的 `subscribe` 时，会执行传入的逻辑，这意味着每个 Subscriber 都是对应全新的不同的上下文，比如：

```typescript
const ob1$ = new Observable(subscriber => {
  subscriber.next(Math.random());
  subscriber.complete();
});

const observer = {
  next(value) {
    console.log("next: ", value);
  },
  complete() {
    console.log("complete");
  }
};

ob1$.subscribe(observer); 
ob1$.subscribe(observer);
```

这样两次 `subscribe` 产生的 next 值是不一样的：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/20/202310201032278.avif)

而 Subject 它是多播共享上下文的，这意味着一个 Subject 可以对应多个 Subscriber ，它们会共享一个上下文：

```typescript
const subject$ = new Subject();

const observer = {
  next(value) {
    console.log("next: ", value);
  },
  complete() {
    console.log("complete");
  }
};

subject$.subscribe(observer);
subject$.subscribe(observer);

subject$.next(Math.random());
subject$.complete();
```

多个 Subscriber 会持有同一个上下文，所以这里两个 Subscriber 的 next 的值都是一样：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/20/202310201052661.avif)

Subject 也是一个 Observable ，但是它可以关联多个 Subscriber ，这是它的独特的地方之一，其次， Subject 本身也是一个类 Observer （当然，源码内部并没有继承 Observer ，而是通过鸭子类型机制来让它看起来像个 Observer ），这意味着它可以调用 next 、 complete 、 error 等方法来发出值，所以你可以用 Subject 来订阅某个 Observable ：

```typescript
const ob$ = new Observable((subscriber) => {
  subscriber.next(Math.random());
  subscriber.complete();
});

const subject$ = new Subject();

ob$.subscribe(subject$);
```

结合这两个特性之后，我们可以通过 Subject 来把一个已经存在的 Observable 给转成多播的， RxJS 提供了一个简单地管道 `multiCast` 来实现这个特性：

```typescript
const ob$ = new Observable((subscriber) => {
  subscriber.next(Math.random());
  subscriber.complete();
});

const subject$ = new Subject();

const pipedOb$ = ob$.pipe(multicast(subject$))

const observer = {
  next(value) {
    console.log("next: ", value);
  },
  complete() {
    console.log("complete");
  }
};

pipedOb$.subscribe(observer);
pipedOb$.subscribe(observer);

// 开始订阅原始的 Observable
pipedOb$.connect();
```

当然， Observable 和 Subject 也有一些区别，比如 `subscribe` 的时机。

Observable 在 `subscribe` 会执行传入的函数，这意味着整个订阅过程 Subscriber 都可以拿到，而对于原始的 Subject ，如果你在 `next` 之后再 `subscribe` ，那么你就无法收到上一次 `next` 的值了，也就是说 Subject 的 `subscribe` 具有时效性。

```typescript
const subject$ = new Subject();

subject$.next(1);

subject$.subscribe((value) => {
  console.log("next: ", value); // 只会输出 2
});

subject$.next(2);
subject$.complete();
```

当然，肯定有人就会说，怎么不能拿到了，我用 BehaviorSubject 和 ReplySubject 不是随便拿？

确实没问题，所以我们在谈论的时候针对的是原始的 Subject 。

## 源码

我们先看看 Subject 的 class 长什么样：

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
}
```

可以看到它继承了 `Observable` ，实现了 `SubscriptionLike` 。

继承 `Observable` 意味着它可以 `subscribe` 某个 Subscriber ，而实现 `SubscriptionLike` 则意味着它可以取消订阅。

当然光只继承 `Observable` 是不够的， Subject 必须重写方法来实现自身的特性，所以它重写了 `_subscribe` 方法：

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
  
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    this._checkFinalizedStatuses(subscriber);
    return this._innerSubscribe(subscriber);
  }
}
```

这里涉及到了两个函数， `_checkFinalizedStatuses` 和 `_innerSubscribe` 。

其中 `_checkFinalizedStatuses` 用来检测当前的 Subject 是否还处于订阅中的状态。

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
  
  protected _checkFinalizedStatuses(subscriber: Subscriber<any>) {
    const { hasError, thrownError, _closed } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (_closed) {
      subscriber.complete();
    }
  }
}
```

可以看到这个函数主要判断两个事情

- 如果一个 Subject 已经出错了，对于后续的订阅触发 `error` 方法。
- 如果一个 Subject 已经完成了，那么后续的订阅触发 `complete` 方法。

接下来我们看 `_innerSubscribe` ：

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...

  protected _innerSubscribe(subscriber: Subscriber<any>) {
    // Subject 出错或完成，则直接返回
    if (this.hasError || this._closed) {
      return Subscription.EMPTY;
    }
    
    // 放到 map 里面
    const { currentObservers } = this;
    const observerId = this._observerCounter++;
    currentObservers.set(observerId, subscriber);
    this.observerSnapshot = undefined;
    
    // 取消订阅的逻辑，从 map 中删除。
    subscriber.add(() => {
      currentObservers.delete(observerId);
      this.observerSnapshot = undefined;
    });
    return subscriber;
  }
}
```

这里的 `currentObservers` 是一个 Map ，保存了 `id -> Subscriber` 键值对。

这个 id 是内部自增的，主要是 `observerSnapshot` 这个属性可能会让人迷惑。我们把用到它的地方列出来。

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
  
  private observerSnapshot: Observer<T>[] | undefined;
  
  get observers(): Observer<T>[] {
    return (this.observerSnapshot ??= Array.from(this.currentObservers.values()));
  }
}
```

可以看到 `observerSnapshot` 充当了一个手动构建缓存的作用，避免了如果我们像迭代所有的 Subscriber 的时候需要每次调用 `this.currentObservers.values()` 的问题。在所有修改的 `currentObservers` 的地方，我们都能看到会把 `observerSnapshot` 置为 `undefined` ，这样下次读取 `observers` 时就会重新获取最新的值并且缓存下来了。

observerSnapshot 是私有的，而 `observers` 是使用 `@internal` 文档注释修饰的，这意味着外部也不应该访问 `observers` 。在下文内部 `next` 、 `complete` 、 `error` 的实现中我们就可以看到关于这个属性的使用。

当然回过头来，如果我们使用数组来保存 Subscriber 的话，那么当我们添加 Subscriber 的时候我们可以通过 `push` 来增加，但是当我们像删除某个 Subscriber 的时候，我们就不得使用循环和 `splice` （或者生成新数组）来重新构建这个数组了，而使用 Map 则可以在 O(1) 时间内删除 Subscriber 。

接下来我们来看下作为一个 Observer ，它的实现是怎么样的：

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
  
  next(value: T) {
    if (!this._closed) {
      
      const { observers } = this;
      const len = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].next(value);
      }
    }
  }

  error(err: any) {
    if (!this._closed) {
      // 记录报错信息
      this.hasError = this._closed = true;
      this.thrownError = err;
      
      const { observers } = this;
      const len = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].error(err);
      }
      
      // 清除所有订阅者
      this._clearObservers();
    }
  }

  complete() {
    if (!this._closed) {
      this._closed = true;
      const { observers } = this;
      const len = observers.length;
      for (let i = 0; i < len; i++) {
        observers[i].complete();
      }

      // 清除所有订阅者
      this._clearObservers();
    }
  }
}
```

这三个方法都有一个共同的逻辑，就是通过 `observers` 拿到所有的 Subscriber ，然后执行对应的方法，这也对应我们之前说的，如果某个 Subject 持有了巨量的 Subscriber ，那么每次通过 `this.currentObservers.values()` 可能会造成性能影响。

对于 `complete` 和 `error` 还调用 `_clearObservers` 方法，这个方法很简单，就是把 Map 清空。这个方法也是 `unsubscribe` 方法中会调用到的：

```typescript
export class Subject<T> extends Observable<T> implements SubscriptionLike {
  // ...
  
  unsubscribe() {
    this._closed = true;
    this._clearObservers();
  }

  protected _clearObservers() {
    this.currentObservers.clear();
    this.observerSnapshot = undefined;
  }
}
```

这里有区别的就是如果一个 Subject 出错了，那么此时它接下来的传入的 Subscriber 会执行 `error` ，此时不管 Subject 是否完成了，而只有 Subject 未出现错误并结束之后，接下来的 Subscriber 才会走 `complete` （如果不明白可以看上面 `_checkFinalizedStatuses` 的实现）。从使用角度看也是很符合编程直觉的。

从上面的代码中可以看出来 Subject 并没有类似 Subscription 的概念，但是它是类 Subscription 的（实现了 SubscriptionLike ）。因为 Subject 并没有持有一段“可订阅”逻辑，它更像一个中转站，非常类似我们在浏览器中使用的 `addEventListener` ，而它的取消订阅的操作，仅仅就是把注册的 Subscriber 从它的 Map 中删除而已，这类似我们的在浏览器中使用 `removeEventListener` 。换句话说，他就像一个 EventEmitter 。

# 后记

Subject 即是一个 Observable ，又是一个 Observer ，而且作为一个 Observable ，它支持多播。

在 RxJS 中，通过 Subject 也派生出了其他一些功能更丰富的上层的 Subject 。当然，这些派生的 Subject 都是继承 Subject 的，通过重写方法来实现功能。再下文我们就来讲关于这几种派生 Subject 的内部实现。
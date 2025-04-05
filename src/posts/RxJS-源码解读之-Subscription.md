---
title: RxJS 源码解读之 Subscription
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1697624428date: 2023-10-18 18:20:28
updated: 2023-10-20 09:46:12
---







# 前言

RxJS 源码解读之 `Subscription` 。

<!-- more -->

在上篇中，我们讲了关于 `Subscriber` 类的相关实现，当时我们忽略了它所继承的 `Subscription` 类，以一个订阅者的角度来介绍了 Subscriber 。

本篇我们会讲 Subscription ，他处理了 RxJS 很重要的操作，即 unsubscribe 取消订阅的操作。

# 正文

## 概念

在前两篇中，我们讲到了 Observable 和 Subscriber ，它们之间彼此对应 ，如果我们的 Observable 很简单，那么我们基本不会使用到 Subscription 。而如果我们使用了诸如文件、网络、定时器等逻辑的话，那么在 Observable 调用 `complete` 方法或者对 Observable 对应的 Subscription 调用 `unsubscribe` 方法之后，所使用的资源就应该被释放掉，防止内存泄露。

比如如果我们使用 `setInterval` 定时器的话，我们会写成如下：

```typescript
const observable$ = new Observable((subscriber) => {
  let count = 0;
  const timer = setInterval(() => {
    subscriber.next(++count);
    // 执行 10 次就完成这个 Observable
    if (count >= 10) {
      subscriber.complete();
    }
  }, 1000);
  
  // 清理逻辑
  return () => {
    clearInterval(timer);
  }
});

const subscription = observable$.subscribe({
  next(value) {
    console.log("next = " + value);
  },
  complete() {
    console.log("complete");
  },
  error(e) {
    console.error("error: " + e);
  }
});

// 会执行返回的函数，清除定时器
subscription.unsubscribe();
```

我们会在传入的函数内返回一个新的函数，这个函数定义了我们应该如何执行一些清理操作来保证释放资源。

这里在内部如果我们调用了 `complete` 实际上也是会执行返回的函数。

简而言之，Subscription 维护了 Observable 和 Subscriber 之间的关系，当 Subscriber 调用了 `complete` 时，这时 Subscription 会“通知” Observable 结束订阅，执行相应的清理逻辑，而当 Subscription 手动要求取消 Observable 订阅的时候，那么取消完成之后所有的订阅操作都会失效，不会预期的执行诸如 `next` ， `complete` ，`error` 函数。

## 源码

我们先看一下 Subscription 类长什么样。

```typescript
// packages/rxjs/src/internal/Subscription.ts

export class Subscription implements SubscriptionLike {
  // ...
}
```

这里实现了一个 `SubscriptionLike` 的接口。而 `SubscriptionLike` 又继承了 `Unsubscribable` 接口，这两个分别如下：

```typescript
export interface SubscriptionLike extends Unsubscribable {
  unsubscribe(): void;
  readonly closed: boolean;
}

export interface Unsubscribable {
  unsubscribe(): void;
}
```

这里看起来有点啰嗦，可能是由于某些地方只希望传入一个 `Unsubscribable` 类型的对象，尽量不暴露其他的属性（比如 `closed` ）

Subscription 会有一个 `closed` 属性和 `unsubscribe` 方法，其中 `closed` 的作用是来辨别这个 Subscription 是否已经执行过清理逻辑了，在 `unsubscribe` 的实现里有体现，我们看一下 `unsubscribe` 的实现。

```typescript
export class Subscription implements SubscriptionLike {
  
  unsubscribe(): void {
    // 收集错误
    let errors: any[] | undefined;
    
    // 标志位，只处理一次
    if (!this.closed) {
      this.closed = true;

      // 在所有清理逻辑前的一段逻辑
      const { initialTeardown: initialFinalizer } = this;
      if (isFunction(initialFinalizer)) {
        try {
          initialFinalizer();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      }

      // 执行所有的清理逻辑
      const { _finalizers } = this;
      if (_finalizers) {
        this._finalizers = null;
        for (const finalizer of _finalizers) {
          try {
            execFinalizer(finalizer);
          } catch (err) {
            errors = errors ?? [];
            if (err instanceof UnsubscriptionError) {
              errors.push(...err.errors);
            } else {
              errors.push(err);
            }
          }
        }
      }

      // 统一抛出错误
      if (errors) {
        throw new UnsubscriptionError(errors);
      }
    }
  }
}
```

`unsubscribe` 的逻辑分为三段：

- 判断是否已经处理过了，未处理则往下执行。
- 判断是否有初始化的逻辑，这段初始化的逻辑会在所有清理过程前执行。
- 执行所有清理逻辑。

{% note warning %}
**注意：**这里 `unsubscribe` 使用 `try-catch` 包裹了每一个函数，这意味着某个注册的函数的报错并不会影响其他注册的函数的执行。在通过 `catch` 块中把错误收集起来之后，再在最后统一抛出。
{% endnote %}

这里的 `initialTeardown` 为在构造函数内初始化的：

```typescript
export class Subscription implements SubscriptionLike {
  // ...
  constructor(private initialTeardown?: () => void) {}
}
```

`_finalizers` 是挂载在自身的一个 Set ，用来保存清理函数：

```typescript
export class Subscription implements SubscriptionLike {
  // ...
  private _finalizers: Set<Exclude<TeardownLogic, void>> | null = null;
}
```

既然有了 Set ，那么就肯定得有接口来把逻辑添加到这个 `_finalizers` 里面。在 Subscription 中，提供了 `add` 和 `remove` 方法来供使用。

```typescript
export class Subscription implements SubscriptionLike {
  add(teardown: TeardownLogic): void {
    if (teardown && teardown !== this) {
      if (this.closed) {
        execFinalizer(teardown);
      } else {
        if (teardown && 'add' in teardown) {
          teardown.add(() => {
            this.remove(teardown);
          });
        }

        this._finalizers ??= new Set();
        this._finalizers.add(teardown);
      }
    }
  }
  
  remove(teardown: Exclude<TeardownLogic, void>): void {
    this._finalizers?.delete(teardown);
  }
}
```

这里的 `remove` 其实很简单，就是从 `_finalizers` 中删除而已，需要注意的是 `add` 函数，有几个点我们要理解：

首先是 Subscription 和 Subscriber 其实有点像，在 Subscription 的 `_finalizers` 中也是可以放 Subscription 类型的对象。这意味着一个 Subscription 也可以持有另一个 Subscription ，当执行 `unsubscribe` 时，如果发现在 `_finalizers` 存在其他的 Subscription ，那么会调用它的 `unsubscribe` ，这可以在 `execFinalizer` 的实现中可以看到：

```typescript
function execFinalizer(finalizer: Unsubscribable | (() => void)) {
  if (isFunction(finalizer)) {
    finalizer();
  } else {
    finalizer.unsubscribe();
  }
}
```

由于是一个链条，所以包含自己是没有意义的。

其次，如果一个 Subscription 已经执行过 `unsubscribe` 之后（即 `closed` 置为 `true` ），那么再通过 `add` 添加的话会直接执行，这对应 `if (this.closed) { execFinalizer(teardown); }` 这段代码。

以及，如果一个 Subscription（s1） 持有了另一个 Subscription（s2），即在 s1 的 `_finalizers` 中有 s2 ，如果 s2 调用了 `unsubscribe` 的话，那么应该通知 s1 删除这个 Subscription（s2），这对应 `teardown.add(() => { this.remove(teardown); });` 这段代码。

Subscription 就像一个函数收集器，通过 `add` 和 `remove` 收集函数，执行 `unsubscribe` 函数时内部把收集的函数执行一遍，它的核心逻辑就是这样简单。

在上篇中，我们并没有对 Subscriber 继承 Subscription 作解释，而现在我们就可以回过头来看看这部分的实现了。

我们先看 Subscriber 的实现， Subscriber 继承了 Subscription ，所以 Subscriber 本质上也是一个 Subscription ，在 Subscriber 中，它只重写了 `unsubscribe` 方法，并且多了一个标志位 `isStopped` ：

```typescript
export class Subscriber<T> extends Subscription implements Observer<T> {
  // ...
  
  unsubscribe(): void {
    if (!this.closed) {
      this.isStopped = true;
      // 执行父类的方法
      super.unsubscribe();
      // 额外的逻辑，再所有清理函数执行完成之后执行
      this._onFinalize?.();
    }
  }
}
```

这段函数其实功能上的本质就是多添加了一个在所有收集的函数执行完成之后，再执行一个 `_onFinalize` 函数，这个 `_onFinalize` 则是在构造函数中传入并初始化的：

```typescript
export class Subscriber<T> extends Subscription implements Observer<T> {
  constructor(
    destination?: Subscriber<T> | Partial<Observer<T>> | ((value: T) => void) | null,
    overrides?: SubscriberOverrides<T>
  ) {
    super();
    
    // ...
    this._onFinalize = overrides?.finalize ?? null;
    
    // ...
  }
}
```

那么它是在哪里把逻辑加入到 Subscription 的 Set 集合中的呢？我们回到 Observable 的 `subscribe` 实现中：

```typescript
export class Observable<T> implements Subscribable<T> {
  // ...
  
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    const subscriber = observerOrNext instanceof Subscriber ? observerOrNext : new Subscriber(observerOrNext);
    // 添加到 _finalizers 中
    subscriber.add(this._trySubscribe(subscriber));
    return subscriber;
  }

  protected _trySubscribe(sink: Subscriber<T>): TeardownLogic {
    try {
      // _subscribe 函数就是我们外部传入地
      // 这里返回了执行完之后的逻辑，即清理函数
      return this._subscribe(sink);
    } catch (err) {
      // We don't need to return anything in this case,
      // because it's just going to try to `add()` to a subscription
      // above.
      sink.error(err);
    }
  }
}
```

还记得我们之前说过的吗， Subscriber 也是一个 Subscription ，所以这里 `subscriber.add` 就是添加了 `_subscribe` 函数返回的清理函数。在 `complete` 中，我们可以看到它会调用 `unsubscribe` 方法，这样就会执行 Subscription 的 `unsubscribe` ，进而就是把收集的清理函数拿出来执行了：

```typescript
export class Subscriber<T> extends Subscription implements Observer<T> {
  // ...
  
  protected _complete(): void {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }
}
```

这里要注意，如果我们在 Subscriber 的 complete 方法未调用之前，就使用 Subscription 来执行 unsubscribe 方法的话，那么接下来的操作都会失效：

```typescript
export class Subscriber<T> extends Subscription implements Observer<T> {
  // ...

  complete(): void {
    if (this.isStopped) {
      // 已经取消订阅了，不应该再发值了
      // handleStoppedNotification 是一个处理错误的逻辑
      handleStoppedNotification(COMPLETE_NOTIFICATION, this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  }
}

```

在我们实际使用中，当我们对 Observable 调用 `subscribe` 之后，其实我们拿到的就是代理了传入 Observer 的一个 Subscriber ，不过由于 TypeScript 类型定义通过缩限使得它看起来只是一个 Subscription 。

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/19/202310191711972.avif)

还记得我们在 TypeScript 5.2 中提到的 `using` 关键字吗， Subscription 支持了这个特性：

```typescript
export interface Subscription {
  [Symbol.dispose](): void;
}

if (typeof Symbol.dispose === 'symbol') {
  Subscription.prototype[Symbol.dispose] = Subscription.prototype.unsubscribe;
}
```

它的实现原理其实就是把 `Symbol.dispose` 指定想了 `unsubscribe` 函数。

这意味着我们直接可以通过 `using` 关键字来调用 Observable 的 `subscribe` 方法了。

```typescript
using subscription = observable$.subscribe({
  complete() {
    console.log('complete');
  }
});
```

# 后记

至此，RxJS 的核心基本上就讲完了，操作符，管道等都可以通过这些核心扩展出来。

下篇我们要讲 Observable 的扩展，即 Subject ，一类既可被订阅又可以订阅别人的 Observable 。
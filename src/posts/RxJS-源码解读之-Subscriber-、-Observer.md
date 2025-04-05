---
title: RxJS 源码解读之 Subscriber 、 Observer
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1697534124date: 2023-10-17 17:15:24
updated: 2023-10-19 17:19:49
---




# 前言

RxJS 源码解读之 `Subscriber` 、 `Observer` 。

<!-- more -->

在[上一篇](/ca7063283d17.html)关于 `Observable` 的源码解读中，我们对于 `subscribe` 方法进行一些简写，我们忽略了 `Subscriber` 这个类的内部实现。

这一篇我们就来讲讲这个类，以及和这个类相关的 `Observer` 接口。

# 正文

## 概念

在上篇中，我们讲到了 `Observable` 类，它承载了一段可观察的逻辑，在发布订阅的模型中，很多时候称之为发布源，顾名思义，就是会发出值的程序。

在 RxJS 中，当我们创建一个 Observable 对象然后调用它的 `subscribe` 函数时，内部才会执行通过构造函数传入的 `_subscribe` 函数，这意味着此时才会开始订阅，也就是说 Observable 本身是惰性的，这点和 Promise 是不一样的，Promise 在创建的时候就会执行传入的函数了。

而订阅的过程我们会涉及到的概念一般就是 Observer 观察者了。

当把 RxJS 作为一个黑盒来使用的时候，我们很自然的会把传入 `.subscribe` 的对象称之为 Observer 观察者。

但在 RxJS 的内部， Observer 都会被转化为一个 Subscriber 订阅者。在下面的源码解析中我们就会知道 Subscriber 也实现了 Observer 接口，但它其实不承载真实的观察者的逻辑，而是通过持有一个真正的 Observer 对象来实现。我们可以称为 Subscriber 对象代理了 Observer 对象。

Subscriber 不仅是一个 Observer ，同时也是一个 Subscription 。（ Subscription 在下篇会讲）。

## 源码

回到上篇中我们简化的逻辑，原始的 `Observable.prototype.subscribe` 的代码如下：

```typescript
// packages/rxjs/src/internal/Observable.ts

export class Observable<T> implements Subscribable<T> {
  // ...
  
  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    const subscriber = observerOrNext instanceof Subscriber ? observerOrNext : new Subscriber(observerOrNext);
    subscriber.add(this._trySubscribe(subscriber));
    return subscriber;
  }
}
```

这里的 `subscriber.add(this._trySubscribe(subscriber))` 以及返回 `subscriber` 对象先不管，这是和 Subscription 有关的内容。

这里可以看到我们把传入的 `observerOrNext` 对象传给了 `Subscriber` 进行构造。

```typescript
// packages/rxjs/src/internal/Subscriber.ts

export class Subscriber<T> extends Subscription implements Observer<T> {
  constructor(
    destination?: Subscriber<T> | Partial<Observer<T>> | ((value: T) => void) | null, 
    overrides?: SubscriberOverrides<T>
  ) {
    super();
    // ...
    this.destination = destination instanceof Subscriber ? destination : createSafeObserver(destination);
    
    // ...
  }
}
```

这里我们先忽略 `extends Subscription` ，我们只关注 `class Subscriber<T> implements Observer<T>` 。

由于我们没有使用到 `overrides` 参数，所以把逻辑中的无关部分删除，可以发现，当我们传入一个 Observer 对象的时候，它会调用 `createSafeObserver` 来生成一个安全的 Observer 对象。

```typescript
function createSafeObserver<T>(
  observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null
): Observer<T> {
  return new ConsumerObserver(
    !observerOrNext || isFunction(observerOrNext) 
      ? { next: observerOrNext ?? undefined } 
      : observerOrNext
  );
}
```

`createSafeObserver` 内部的实现其实就是 new 了一个 `ConsumerObserver` 对象。

```typescript
class ConsumerObserver<T> implements Observer<T> {
  constructor(private partialObserver: Partial<Observer<T>>) {}

  next(value: T): void {
    const { partialObserver } = this;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        reportUnhandledError(error);
      }
    }
  }

  error(err: any): void {
    const { partialObserver } = this;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        reportUnhandledError(error);
      }
    } else {
      reportUnhandledError(err);
    }
  }

  complete(): void {
    const { partialObserver } = this;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        reportUnhandledError(error);
      }
    }
  }
}
```

创建安全的 Observer 其实就是我们之前说的规范化 Observer 的逻辑，即确保 Observer 对象的三个函数都是可以正常调用而不用做判断的。

回到 `Subscriber` 的构造函数中，我们会把这个规范化的 Observer 挂载到自身的 `destination` 属性上，根据类型上看， `destination` 属性可以是 `Subscriber` ，也可以是 `Observer` ，再看回 `Subscriber` ，它实现了 `Observer` ，所以它本身也是一个 Observer 。

我们来看看它是怎么实现 Observer 的：

```typescript
export class Subscriber<T> implements Observer<T> {
  // ...
  
  next(value: T): void {
    if (this.isStopped) {
      handleStoppedNotification(nextNotification(value), this);
    } else {
      this._next(value!);
    }
  }
  
  error(err?: any): void {
    if (this.isStopped) {
      handleStoppedNotification(errorNotification(err), this);
    } else {
      this.isStopped = true;
      this._error(err);
    }
  }
  
  complete(): void {
    if (this.isStopped) {
      handleStoppedNotification(COMPLETE_NOTIFICATION, this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  }
}
```

这里 `if (this.isStopped)` 处理的是非法的情况，我们可以不管，我们只看 `else` 分支即可，可以发现，它会调用对应的带 `_` 前缀的方法：

```typescript
export class Subscriber<T> implements Observer<T> {
  // ...
  
  protected _next(value: T): void {
    this.destination.next(value);
  }

  protected _error(err: any): void {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  }

  protected _complete(): void {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }
}
```

可以看到它就是调用了 `destination` 属性的方法，而 `destination` 在前面我们说过，它是一个 `ConsumerObserver` 对象，也就是我们传入的真实的 Observer 观察者。

那么我们就可以这么理解， `Observable` 使用 `Subscriber` 来分发值，而 `Subscriber` 内部使用 `Observer` 来分发值。

可能你就会说了，这不又是脱裤子放屁吗，直接用 `ConsumerObserver` 不好吗？

如果你自己写过 pipe 管道的话，你可能会理解它为什么这么做？想象一下我们现在正在写一个 filter 过滤管道（有官方实现），它长类似下面这样：

```typescript
const filter = (predicate: (value: any) => boolean) => {
  return (source: Observable) => {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          if (!!predicate(value)) {
            subscriber.next(value);
          }
        },
        complete() {
          subscriber.complete(value);
        },
        error(e) {
          subscriber.error(value);
        }
      });
    });
  };
}
```

你可能会疑问，这个和我们上面说的有什么关系吗，别急，我们换个写法：

```typescript
const filter = (predicate) => {
  return (source: Observable) => {
    return new Observable(subscriber => {
      const proxySubscriber = new Subscriber(subscriber);
      proxySubscriber._next = function (value) {
        if (!!predicate(value)) {
          // this.destination 就是 subscriber
          this.destination.next(value);
        }
      }
      source.subscribe(proxySubscriber);
    });
  };
}
```

可以发现，这里我们用一个代理的 Subscriber 来持有一个目标 Subscriber ，然后通过重写方法来实现 Subscriber 的链式调用。

没错，Subscriber 最有用的功能之一就是链式调用。链式调用可以说就是管道的根基。

如果以一个链条来看，它就像下面这样：

```text
Subscriber-1(destination = Subscriber(2)) 
-> Subscriber-2(destination = Subscriber(3)) 
-> Subscriber-3(destination = Observer)
-> Observer
```

为了快速创建出一个代理的 Subscriber ， RxJS 提供了一个工具函数 `operate` 来帮助我们生成 Subscriber 对象。

```typescript
export function operate<In, Out>({ destination, ...subscriberOverrides }: OperateConfig<In, Out>) {
  return new Subscriber(destination, subscriberOverrides);
}
```

它内部其实也是调用了 Subscriber 的构造函数，我们来看看带了 `overrides` 参数的构造函数：

```typescript
export class Subscriber<T> extends Subscription implements Observer<T> {
  constructor(
    destination?: Subscriber<T> | Partial<Observer<T>> | ((value: T) => void) | null, 
    overrides?: SubscriberOverrides<T>
  ) {
    super();
    // ...
    this.destination = destination instanceof Subscriber ? destination : createSafeObserver(destination);

    this._nextOverride = overrides?.next ?? null;
    this._errorOverride = overrides?.error ?? null;
    this._completeOverride = overrides?.complete ?? null;
    // ...
    
    this._next = this._nextOverride ? overrideNext : this._next;
    this._error = this._errorOverride ? overrideError : this._error;
    this._complete = this._completeOverride ? overrideComplete : this._complete;
    
    // ...
  }
}
```

这里还涉及了三个外部的函数， `overrideNext` 、 `overrideError` 和 `overrideComplete` ：

```typescript
function overrideNext<T>(this: Subscriber<T>, value: T): void {
  try {
    this._nextOverride!(value);
  } catch (error) {
    this.destination.error(error);
  }
}

function overrideError(this: Subscriber<unknown>, err: any): void {
  try {
    this._errorOverride!(err);
  } catch (error) {
    this.destination.error(error);
  } finally {
    this.unsubscribe();
  }
}

function overrideComplete(this: Subscriber<unknown>): void {
  try {
    this._completeOverride!();
  } catch (error) {
    this.destination.error(error);
  } finally {
    this.unsubscribe();
  }
}
```

这里的 `_nextOverride` 、` _errorOverride` 和 `_completeOverride` 就是我们想要重写的方法。

比如我们现在通过 `operate` 来创建 Subscriber 对象，代码如下：

```typescript
const subscriber = // ...

const proxySubscriber = operate({
  destination: subscriber,
  next(value) {
    console.log("proxy next");
    this.destination.next(value);
  }
});
```

那么此时 `next` 方法的调用流是这样的：

```text
proxySubscriber.next(实际上是 overrideNext) -> proxySubscriber._nextOverride -> 打印 proxy next -> destination(subscriber).next
```

而 `error` 方法和 `complete` 方法的调用流如下：

```text
proxySubscriber.complete -> proxySubscriber._complete -> destination(subscriber).complete
proxySubscriber.error -> proxySubscriber.error -> destination(subscriber).error
```

本质上讲 `error` 和 `complete` 就是透传，而 `next` 通过传入的方法来进行功能重写。

# 后记

Subscriber 本质上也是一个 Observer ，不过它扩展了更多有用的功能，除了本文的链式调用之外， Subscriber 本身也是一个 Subscription ，即 Subscriber 也维护了发布订阅这个关系。

在下篇我们会讲 Subscription ，它也是 RxJS 内核心的概念之一。
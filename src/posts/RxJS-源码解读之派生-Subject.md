---
title: RxJS 源码解读之派生 Subject
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1698042598date: 2023-10-23 14:29:58
updated: 2023-10-26 18:25:00
---



# 前言

RxJS 源码解读之派生 `Subject` ，即 `BehaviorSubject` 、 `ReplySubject` 、 `AsyncSubject` 、 `VoidSubject` 。

<!-- more -->

在上篇中，我们介绍了 Subject 的核心实现，在 RxJS 中， Subject 派生出了其他几种具有特殊功能的 Subject ：

- BehaviorSubject
- ReplySubject
- AsyncSubject
- VoidSubject

这些派生的 Subject 都继承自 Subject （ VoidSubject 除外）。

# 正文

## VoidSubject

VoidSubject ，其实就是原生的 Subject ，但是它发出的值为 void ，即发出空值的 Subject 。

```typescript
const subject$ = new Subject<void>();

subject$.subscribe({
  next() {
    console.log("next");
  }
});

subject$.next();
subject$.next();
```

VoidSubject 的实现就是 Subject 的实现，所以这里直接跳过。

## BehaviorSubject

BehaviorSubject 可以让观察者拿到最近的一个值。最近的一个值的意思是，当一个观察者订阅这个 Subject 时，会立马得到一个“上次发出的值”，如果该 Subject 还未发出值，则使用构造时的初始值。

```typescript
const subject$ = new BehaviorSubject<string>("init value");

subject$.subscribe({
  next() {
    console.log("next"); // 立即收到 init value 。
  }
});

subject$.next("second value");
subject$.next("third value");

subject$.subscribe({
  next() {
    console.log("next"); // 立即收到 third value 。
  }
});
```

为了实现这个特性， BehaviorSubject 在内部挂在了一个 `_value` 属性，在每次发出值的时候顺便把该值记录下来：

```typescript
export class BehaviorSubject<T> extends Subject<T> {
  // ...
  
  // 挂在 _value 属性
  constructor(private _value: T) {
    super();
  }

  next(value: T): void {
    super.next((this._value = value));
  }
}
```

接着在每次有新的观察者加入的时候，使用 `_value` 属性来执行 `next` 函数：

```typescript
export class BehaviorSubject<T> extends Subject<T> {
  // ...
    
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    // 正常走父类订阅
    const subscription = super._subscribe(subscriber);
    // 非关闭情况下使用 next 发出值。
    !subscription.closed && subscriber.next(this._value);
    return subscription;
  }
}
```

重写 `_subscribe` 内的核心其实就一句 `!subscription.closed && subscriber.next(this._value)` 。

## ReplaySubject

ReplaySubject ，它的功能比 BehaviorSubject 更“广泛”。简单点讲 BehaviorSubject 只能保存一个历史值，而 ReplaySubject 能保存多个历史值，并且能以次数和时间维度来进行约束。

虽然 BehaviorSubject 可以看作是一个特殊的 ReplaySubject ，但是 ReplaySubject 并不能保证加入的订阅一定能够接收到一个值，也就是说 ReplaySubject 的构造函数不会保存一个默认的初始值。 ReplaySubject 的本质是“回放”历史值。

在 ReplaySubject 中，为了从次数和时间方面来限制回放的个数，它新增了一个数组用来保存历史值，并且在构造的时候会指定回放的数量大小和最长有效时间：

```typescript
export class ReplaySubject<T> extends Subject<T> {
  // 缓冲容器
  private _buffer: Array<T | number> = [];
  // 是否指定了最长有效时长
  private _infiniteTimeWindow = true;
  
  constructor(
    // 最大的回放个数
    private _bufferSize = Infinity,
    // 回放项存在缓冲池内的最长有效时间，超过该时间会从缓冲池中删除
    private _windowTime = Infinity,
    // 回放使用的时间发生器，这里默认的内部实现是 Date.now 
    private _timestampProvider: TimestampProvider = dateTimestampProvider
  ) {
    super();
    this._infiniteTimeWindow = _windowTime === Infinity;
    this._bufferSize = Math.max(1, _bufferSize);
    this._windowTime = Math.max(1, _windowTime);
  }
}
```

可以在构造函数中看到：

- 默认情况下回放个数为无限大，即不会限制回放的个数。
- 默认情况下有效时间也是无限大，即所有的回放项都不会过期。

所以，如果不指定参数，那么 ReplaySubject 发出的值都会保存下来，当新的订阅者加入的时候，这些历史的值就会发送给这个新的订阅者。

`_infiniteTimeWindow` 属性用来标志是否开启了时间限制。

这里还有一个注意的点是 `_buffer` 属性的类型是 `Array<T | number>` ，这是因为在指定了回放时间的情况下， `_buffer` 的类型其实是 `[T, number, T, number , ...]` ，而如果不指定回放时间则 `_buffer` 的类型为 `Array<T>` 。这可以在重写的 `next` 方法中看到。

```typescript
export class ReplaySubject<T> extends Subject<T> {
  next(value: T): void {
    const { _closed, _buffer, _infiniteTimeWindow, _timestampProvider, _windowTime } = this;
    if (!_closed) {
      _buffer.push(value);
      // 开启时间的情况下往该值的后面放一个过期时间
      !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
    }
    // 更新
    this._trimBuffer();
    super.next(value);
  }
}
```

从 `next` 函数的代码中可以看到，在 `_buffer` 中存的是 `Date.now() + _windowTime` ，这表示的是该回放项的过期时间，接着调用了一个 `_trimBuffer` 函数，这个函数的作用是更新 `_buffer` ，把过期的回放项删除掉：

```typescript
export class ReplaySubject<T> extends Subject<T> {
  // ...
  
  private _trimBuffer() {
    const { _bufferSize, _timestampProvider, _buffer, _infiniteTimeWindow } = this;
    // 判断回放个数的最大值，如果开启了时间限制的话， 该值应该 x 2 ，因为开启了时间限制下每个元素在 _buffer 中占用俩个位置。
    const adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
    
    // 指定了回放大小且缓冲区内的个数已经超过了设定的最大回放个数情况。
    // 下面注释为原始代码，我们用 if 重写一下
    // _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
    if (_bufferSize < Infinity && adjustedBufferSize < _buffer.length) {
      // 切掉前面的部分。
      _buffer.splice(0, _buffer.length - adjustedBufferSize);
    }
    
    // 指定了回放时间情况
    if (!_infiniteTimeWindow) {
      const now = _timestampProvider.now();
      let last = 0;
      // 从前往后找，找到第一个过期的，然后切掉前面的部分。
      // 因为缓冲区是按时间顺序添加的，所以可以保证第一个非过期的项后面的项都是非过期的。
      for (let i = 1; i < _buffer.length && (_buffer[i] as number) <= now; i += 2) {
        last = i;
      }
      last && _buffer.splice(0, last + 1);
    }
  }
}
```

可以看到在清理 `_buffer` 的时候先按大小进行清理，然后如果开启了时间限制的情况下，再根据时间来把过期的项清理掉。

为了在观察者订阅的时候能够接收到需要回放的值， ReplaySubject 和 BehaviorSubject 一样重写了 `_subscribe` 方法：

```typescript
export class ReplaySubject<T> extends Subject<T> {
  // ...

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    // 清理
    this._trimBuffer();

    // 父类 Subject 的方法
    const subscription = this._innerSubscribe(subscriber);

    const { _infiniteTimeWindow, _buffer } = this;
    // 拷贝一份，防止中途被修改
    const copy = _buffer.slice();
    for (let i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
      subscriber.next(copy[i] as T);
    }

    // 父类 Subject 的方法
    this._checkFinalizedStatuses(subscriber);

    return subscription;
  }
}
```

这里可以看到它调用父类的两个方法 `_innerSubscribe` 和 `_checkFinalizedStatuses` ，在 Subject 中是先 `_checkFinalizedStatuses` 再 `_innerSubscribe` ，如果 Subject 出错或者完成，在 `_checkFinalizedStatuses` 中会调用相应的 `complete` 和 `error` ，而 `_innerSubscribe` 只是把 Subscriber 放到 Map 中而已，而由于 ReplaySubject 存在缓存，我们肯定希望能完整的回放整个流程，如果一上来就调用 `_checkFinalizedStatuses` 的话，就变成先得到了一个完成的通知，再接收到了缓存的值，这和 ReplaySubject （回放主题）的名字不对应。

这里还使用了一个 `_buffer` 的副本，防止在调用中出现修改 `_buffer` 的情况，即当一个订阅者加入时， `_buffer` 就已经确定，无法在观察过程中改变 `_buffer `。

看源码的时候感觉这个根据时间来判断最右的过期项的过程使用遍历不会导致性能问题吗，为什么不用二分搜索呢？毕竟每次 `next` 和 `subscribe` 都会清理一次缓存...

## AsyncSubject

AsyncSubject 看名字你可能会觉得可能和异步有什么关系，但其实关系不大， AsyncSubject 的核心就是只发出完成前的一个值，比如一个 AsyncSubject 通过发出了 99 个 1 ，然后发出了一个 0 ，接着调用 `complete` 表示完成，这样它的所有订阅者都只会收到一个 0 和一个完成的通知。

```typescript
const subject$ = new AsyncSubject<number>();

subject$.subscribe({
  next(value) {
    console.log("next: ", value); // 输出 next: 0 。
  }
});

for (let i = 0; i < 99; i++) {
  subject$.next(1);
}

subject$.next(0);
subject$.complete();
```

所以 AsyncSubject 第一个就要重写 `next` 函数，让它不要再通知所有的订阅者了，而是把每次发出的值记录下来：

```typescript
export class AsyncSubject<T> extends Subject<T> {
  // ...
  
  private _value: T | null = null;
  private _hasValue = false;
  
  next(value: T): void {
    if (!this._closed) {
      this._value = value;
      this._hasValue = true;
    }
  }
}
```

接着当一个 AsyncSubject 完成之后，把记录的值发出去（如果存在的话）：

```typescript
export class AsyncSubject<T> extends Subject<T> {
  // ...
  
  complete(): void {
    const { _hasValue, _value, _isComplete } = this;
    if (!_isComplete) {
      this._isComplete = true;
      // 存在值的话发出去， super.next 会通知所有的订阅者
      // 由于一个 Subject 是能不发出值而直接完成的，所以这里要判断
      _hasValue && super.next(_value!);
      // 通知之后再完成
      super.complete();
    }
  }
}
```

当然，重写这两个只是解决了在 AsyncSubject 完成前对已存在的订阅者进行通知，而如果此时有新的订阅者添加进来，那么是无法收到值的，这和预期的功能不符，所以还需要重写 `_checkFinalizedStatuses` 方法，让它在检测到完成的时候把值发送给当前的订阅者：

```typescript
export class AsyncSubject<T> extends Subject<T> {
  // ...
  
  protected _checkFinalizedStatuses(subscriber: Subscriber<T>) {
    const { hasError, _hasValue, _value, thrownError, _closed, _isComplete } = this;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (_closed || _isComplete) {
      // 通知
      _hasValue && subscriber.next(_value!);
      subscriber.complete();
    }
  }
}
```

这样新的订阅者加入的时候就会调用一次 `_checkFinalizedStatuses` 来进行判断了。

# 后记

至此， RxJS 的 Observable 、 Subscriber 、 Subscription 和 Subject 都讲完了。

下文我们会讲 RxJS 中的 Scheduler ，它和前面这四个的关系不是很大，它只是定义了订阅者获取值的时机。
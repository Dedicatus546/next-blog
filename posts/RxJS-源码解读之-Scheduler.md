---
title: RxJS 源码解读之 Scheduler
tags:
  - RxJS
  - JavaScript
categories:
  - 编程
key: 1698316019date: 2023-10-26 18:26:59
updated: 2023-11-04 01:12:59
---






# 前言

RxJS 源码解读之 `Scheduler` 。

<!-- more -->

在前面的文章中，我们讲了 RxJS 核心的几个概念，并且分析了它们源码中的实现。

本文我们讲 RxJS 中另一位维度的东西，它称之为 Scheduler 。

# 正文

## 概念

Scheduler ，在英文中的意思为调度器，一听到调度器我们可能就有点害怕了，跟这东西有关的都是让人头疼的东西，比如 Linux 内核中的调度器，用来调度进程。

在 RxJS 中，调度器是一个独立的概念，他其实完全可以单独拎出来使用。 RxJS 的调度器，本质就是决定函数执行的时机。

再简单点讲，它其实就是包装了诸如 `setInterval` 、 `Promise.then` 、 `requestAnimateFrame` 等的 API 。

## 源码

### Scheduler 和 Action

在 RxJS 中，调度器有两个核心的基类，一个是 `Scheduler` 、 一个是 `Action` 。

这两个基类的实现都非常的简单，源码如下：

```typescript
export class Scheduler implements SchedulerLike {
  public static now: () => number = dateTimestampProvider.now;

  constructor(private schedulerActionCtor: typeof Action, now: () => number = Scheduler.now) {
    this.now = now;
  }
  
  public now: () => number;
  
  // 核心函数
  public schedule<T>(work: (this: SchedulerAction<T>, state?: T) => void, delay: number = 0, state?: T): Subscription {
    return new this.schedulerActionCtor<T>(this, work).schedule(state, delay);
  }
}

export class Action<T> extends Subscription {
  constructor(scheduler: Scheduler, work: (this: SchedulerAction<T>, state?: T) => void) {
    super();
  }
  
  // 核心函数
  public schedule(state?: T, delay: number = 0): Subscription {
    return this;
  }
}
```

这里可以看到 `Action` 实现了 `Subscription` ，也就是 `Action` 应该也有一个取消订阅的操作，这个后面会说到，而 `Scheduler` 实现了 `SchedulerLike` 接口，这个接口抽象了类调度器的类型：

```typescript
export interface SchedulerLike extends TimestampProvider {
  schedule<T>(work: (this: SchedulerAction<T>, state: T) => void, delay: number, state: T): Subscription;
  schedule<T>(work: (this: SchedulerAction<T>, state?: T) => void, delay: number, state?: T): Subscription;
  schedule<T>(work: (this: SchedulerAction<T>, state?: T) => void, delay?: number, state?: T): Subscription;
}
export interface TimestampProvider {
  now(): number;
}
```

这里的 `TimestampProvider` 可以先忽略，在 `Scheduler` 的源码中，基本用不到这个属性。

回到 `Scheduler` 类，`Scheduler` 会通过构造函数持有一个 `Action` 的类（注意，这里是持有一个 `Action` 类，而不是一个 `Action` 类的实例），然后在 `schedule` 中实例化持有的 `Action` 类， 即代码中的 `new this.schedulerActionCtor<T>(this, work)` ，接着调用 `Action` 的 `schedule` 并返回自身，前面我们说过 `Action` 继承自 `Subscription` 。所以我们在通过 `Scheduler.prototype.schedule` 得到的对象其实就是一个 `Action` 对象。

我们可以简单地用箭头来描述此时的调用流向：

```text
Scheduler.schedule
-> new Action
-> Action.schedule
```

需要着重注意的是：我们的调度函数（ `work` ）是保存在 `Action` 中的，这点很重要。

在 RxJS 中，提供了四种不同的调度器，分别是 `asyncScheduler` 、 `asapScheduler` 、 `queueScheduler` 、 `animationFrameScheduler` ，需要注意，这些导出的对象已经是类的实例了，可以直接使用，不能通过 `new` 来调用。比如 `asyncScheduler` ，它的导出是下面这样子的：

```typescript
export const asyncScheduler = new AsyncScheduler(AsyncAction);
```

其中 `AsapScheduler` 、 `QueueScheduler` 和 `AnimationFrameScheduler` 都是从 `AsyncScheduler` 派生出来的，所以我们先看一下 `AsyncScheduler` 的实现。

### AsyncScheduler 和 AsyncAction

`AsyncScheduler` 的实现本质就是包装了 `setInterval` 。我们先看 `AsyncScheduler` 的整体实现：

```typescript
export class AsyncScheduler extends Scheduler {
  // 持有的 Action 实例，先不管
  public actions: Array<AsyncAction<any>> = [];
 
  // 调度的过程是否在执行中
  public _active: boolean = false;
  
  // 最近一次调度对应的 id ，可能是 setInterval 、 setInterval 或者 requestAnimationFrame 的返回值
  public _scheduled: TimerHandle | undefined;

  // 持有 Action 类
  constructor(SchedulerAction: typeof Action, now: () => number = Scheduler.now) {
    super(SchedulerAction, now);
  }

  public flush(action: AsyncAction<any>): void {
    // ...
  }
}
```

可以看到 `AsyncScheduler` 并没有重写 `Scheduler` 的 `schedule` ，所以当我们使用 `schedule` 的时候还是调用的 `Scheduler` 的 `schedule` 实现。 `AsyncScheduler` 还多了一个 `flush` 方法，这里我们先不管。

接着我们来看 `AsyncAction` 的实现：

```typescript
export class AsyncAction<T> extends Action<T> {
  // 调度对应的 id ，在这里指 setInterval 返回的值
  public id: TimerHandle | undefined;
  
  // 调度的上下文，通俗点讲就是回调的入参
  public state?: T;
  
  // 调度延迟的时间，可以理解为传递给 setInterval 的第二个参数
  public delay: number;
  
  // 是否处于调度过程中
  protected pending: boolean = false;

  // scheduler 为该实例对应的 Scheduler 实例
  // work 为持有的调度函数
  constructor(protected scheduler: AsyncScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  public schedule(state?: T, delay: number = 0): Subscription {}
  protected requestAsyncId(scheduler: AsyncScheduler, _id?: TimerHandle, delay: number = 0): TimerHandle {}
  protected recycleAsyncId(_scheduler: AsyncScheduler, id?: TimerHandle, delay: number | null = 0): TimerHandle | undefined {}
  public execute(state: T, delay: number): any {}
  protected _execute(state: T, _delay: number): any {}
  unsubscribe() {}
}
```

看起来多了好多方法，我们可以先从重写的 `Action` 的 `schedule` 方法的位置开始：

```typescript
export class AsyncAction<T> extends Action<T> {
  // ...
  
  public schedule(state?: T, delay: number = 0): Subscription {
    
    // 已经取消订阅了
    if (this.closed) {
      return this;
    }
    
    // 更新参数，后面入参会替换
    this.state = state;

    // 得到调度对应的 id
    const id = this.id;
    
    // 该 Action 对应的 Scheduler 实例
    const scheduler = this.scheduler;
    
    // 非第一次调度
    if (id != null) {
      // 重新得到一个定时器 id 
      // 这里可能会重新请求一个新的 id ，即类似调用 clearInterval 然后再调用 setInterval
      // 或者复用原本的 id ，因为这里我们包装的是 setInterval
      this.id = this.recycleAsyncId(scheduler, id, delay);
    }
    
    // 调度即将开始，进入调度等待状态
    this.pending = true;
    
    // 更新调度的延迟时间
    // 这里的 delay 放在后面更新是因为上面的 recycleAsyncId 会比较新旧的 delay 值来做一些操作
    this.delay = delay;
    
    // 没有调度的话调用 requestAsyncId 来开始调度
    this.id = this.id ?? this.requestAsyncId(scheduler, this.id, delay);

    // 返回自身，因为自身就是一个 Subscription
    return this;
  }
}
```

这里有几个重要的点：

- 通过 `Scheduler` 的 `schedule` 来调用，每个 `Action` 只会执行一次，如果想获得类似 `setInterval` 的效果，需要手动在函数内部使用 `this.schedule` 来重新调用。

```typescript
// 只执行一次
asyncScheduler.schedule(() => {
  console.log("hello world!");
}, 2000);

// 类似 setInterval 
let work;
asyncScheduler.schedule((work = () => {
  console.log("hello world!");
  // 手动重新调度
  asyncScheduler.schedule(work, 2000);
}), 2000);
```

- 在 `AsyncScheduler` 内部中使用的是 `setInterval` 而非 `setTimeout` 作为底层实现，对此 RxJS 官方的解释是： 单个 `setInterval` 的执行间隔比起多个 `setTimeout` 的间隔更精确。

> However, JS runtimes and timers distinguish between intervals achieved by serial `setTimeout` calls vs. a single `setInterval` call. An interval of serial `setTimeout` calls can be individually delayed, which delays scheduling the next `setTimeout`, and so on. `setInterval` attempts to guarantee the interval callback will be invoked more precisely to the interval period, regardless of load.

- 所有的 `Scheduler` 在内部都不会自动调用 `unsubscribe` 来取消自身的订阅，这是因为即使在多次的调度中，我们可能会通过额外的定时器来启动调度，比如：

```typescript
asyncScheduler.schedule(function () {
  // 下面的调度在一个异步的操作中
  // 同步的代码无法确认“未来”是否会被重新调度
  setTimeout(() => {
    this.schedule(undefined, 2000);
  }, 1000);
}, 2000);
```
所以如果你只想执行单次的调度，最好在调度函数执行结束后调用 `unsubscribe` ，或者对返回的对象在合适的时机调用 `unsubscribe` ：

```typescript
const subscription = asyncScheduler.schedule(function () {
  // 下面的调度在一个异步的操作中
  // 同步的代码无法确认“未来”是否会被重新调度
  // ... 一些操作
    
  // 取消订阅
  this.unsubscribe();
}, 2000);

// ... 一些操作

// 在合适的时机取消订阅
subscription.unsubscribe();
```

回到 `schedule` 实现中，我们发现它主要关联了两个函数，一个是 `requestAsyncId` ，一个是 `recycleAsyncId` ，根据名字我们大致可以知道， `requestAsyncId` 应该就是请求调度，然后返回一个该调度的 id ，而 `recycleAsyncId` 大致是回收一个调度，这里的回收可以是取消调度器或者让调度器继续执行（什么都不做）。

我们先看 `requestAsyncId` ：

```typescript
export class AsyncAction<T> extends Action<T> {
  protected requestAsyncId(scheduler: AsyncScheduler, _id?: TimerHandle, delay: number = 0): TimerHandle {
    return intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
  }
}
```

可以看到它调用的不是原生的 `setInterval` ，而是在一个 `intervalProvider` 对象上的 `setInterval` ，我们看一下 `intervalProvider` 的实现： 

```typescript
export const intervalProvider: IntervalProvider = {
  setInterval(handler: () => void, timeout?: number, ...args) {
    const { delegate } = intervalProvider;
    if (delegate?.setInterval) {
      return delegate.setInterval(handler, timeout, ...args);
    }
    return setInterval(handler, timeout, ...args);
  },
  clearInterval(handle) {
    const { delegate } = intervalProvider;
    return (delegate?.clearInterval || clearInterval)(handle as any);
  },
  delegate: undefined,
};
```

可以发现默认情况下就是调用的 `setInterval` ，但是 RxJS 提供了一个 `delegate` 委派对象，我们可以通过它来覆盖默认的实现，比如：

```typescript
intervalProvider.delegate = {
  setInterval(handler, timeout, ...args) {
    // 在每个宏任务执行完毕后再执行
    return setInterval((...args) => Promise.resolve().then(() => handler(...args)), timeout, ...args);
  },
  clearInterval(handler) {
    clearInterval(handler);
  }
}
```

当然很多时候我们并不会去覆盖默认的实现，所以 `requestAsyncId` 可以简单重写为：

```typescript
export class AsyncAction<T> extends Action<T> {
  protected requestAsyncId(scheduler: AsyncScheduler, _id?: TimerHandle, delay: number = 0): TimerHandle {
    return setInterval(scheduler.flush.bind(scheduler, this), delay);
  }
}
```

可以看到它的目标调度函数是 `Scheduler` 的 `flush` ，这可能就有点让人不解了，不是说需要调度的函数保存在了 `Action` 上吗，怎么又跑去调用 `Scheduler` 的方法了，别急，我们先看 `recycleAsyncId` 是如何实现的：

```typescript
export class AsyncAction<T> extends Action<T> {
  protected recycleAsyncId(_scheduler: AsyncScheduler, id?: TimerHandle, delay: number | null = 0): TimerHandle | undefined {
    // 复用
    if (delay != null && this.delay === delay && this.pending === false) {
      return id;
    }
    
    // 清除掉
    if (id != null) {
      intervalProvider.clearInterval(id);
    }

    return undefined;
  }
}
```

这段逻辑主要包括两个部分，一个是复用定时器，即不清除定时器，另一个就是清除定时器了，在前面我们说过， `Action` 中调用 `work` 是单次的，如果需要重复调度，我们需要手动的在函数内部使用 `this.schedule` 来重新调度。在判断中我们可以知道，只要延迟时间相同，那么就不会清除掉定时器，即：

```typescript
console.log("schedule before.");
asyncScheduler.schedule<void>(function () {
  console.log("schedule");
  // 复用调度器
  this.schedule(undefined, 3000);
}, 3000);
console.log("schedule after");
```

理解了这两个函数之后，我们再回到 `Scheduler` 看它的 `flush` 实现：

```typescript
export class AsyncScheduler extends Scheduler {
  
  public flush(action: AsyncAction<any>): void {
    const { actions } = this;

    // 当前正在执行调度函数中，只需放入待执行队列即可
    if (this._active) {
      actions.push(action);
      return;
    }

    // 调度完成，开始执行
    let error: any;
    // 标志位，表示已进入执行过程
    this._active = true;

    // 遍历所有 actions 属性中保存的所有 Action 
    do {
      // 核心，我们实际调用的是 Action 的 execute 方法
      if ((error = action.execute(action.state, action.delay))) {
        // 出错立即退出
        break;
      }
    } while ((action = actions.shift()!));

    // 执行过程结束
    this._active = false;

    // 某个 Action 报错，它后面所有的 Action 直接取消掉
    if (error) {
      while ((action = actions.shift()!)) {
        action.unsubscribe();
      }
      // 抛出错误
      throw error;
    }
  }
}
```

这里需要搞清一个点，为什么需要用 `actions` 来保存同个 `Action` 的多个实例？

在需要调度的函数的内部，我们可能会通过 `this.schedule` 来创建一个新的调度，在 `AsyncScheduler` 中，这个 `actions` 实际上并不会有值，因为每次我们通过 `this.schedule `创建一个新的调度的时候，它会有两种情况，复用原来的调度器或者取消原来的调度器然后再创建一个，这两种都是延迟到接下来的宏任务中执行，而 `flush` 本身是同步执行的，所以在 `AsyncScheduler` 下， `actions` 不会有值， 即下面的代码不会执行到：

```typescript
export class AsyncScheduler extends Scheduler {
  
  public flush(action: AsyncAction<any>): void {
    const { actions } = this;

    // 不会执行到下面这个 if 内
    if (this._active) {
      actions.push(action);
      return;
    }
    
    // ...
  }
}
```

在 `AsyncScheduler` 中， `actions` 属性用不到，但是在 `AsyncScheduler` 派生出的几种调度器中， `actions` 属性就发挥了作用，它为多个任务在**同一个调度中**进行统一处理提供了代码上的能力。

回到 `flush` 实现，在上面我们标注了核心为执行 `Action` 的 `execute` 方法，我们看一下它的实现：

```typescript
export class AsyncAction<T> extends Action<T> {
  public execute(state: T, delay: number): any {
    if (this.closed) {
      return new Error('executing a cancelled action');
    }

    // 调度已经结束，接下来要开始执行
    this.pending = false;
    // 核心，执行过程
    const error = this._execute(state, delay);
    
    // 存在错误的话返回错误
    if (error) {
      return error;
    }
    // 清除掉定时器
    // 这里就是我们前面说过的，调度器的实现是单次非循环的
    else if (this.pending === false && this.id != null) {
      this.id = this.recycleAsyncId(this.scheduler, this.id, null);
    }
  }
}
```

这段代码还没有接触到执行 `work` 的核心， `work` 实际上是在 `_execute` 中执行的：

```typescript
export class AsyncAction<T> extends Action<T> {
  protected _execute(state: T, _delay: number): any {
    let errored: boolean = false;
    let errorValue: any;
    try {
      // 执行了调度的函数
      this.work(state);
    } catch (e) {
      errored = true;
      errorValue = e ? e : new Error('Scheduled action threw falsy error');
    }
    // 错误取消订阅
    if (errored) {
      this.unsubscribe();
      return errorValue;
    }
  }
}
```

RxJS 很多这种 `execute` 和 `_execute` 的设计，目的都是为了解耦一些操作，方便后续的子类进行重写的时候能够在最小的范围内进行。

到这里，我们就把 `AsyncScheduler` 的流程走完了，可能你会觉得很乱，我们可以梳理一下它的调用流程：

```text
AsyncScheduler.schedule
-> new AsyncAction
-> AsyncAction.schedule
-> AsyncAction.requestAsyncId （开始调度，目标执行函数为 flush ，此时 pending 置为 true ）
-> AsyncScheduler.flush （调度（等待）结束，开始执行 flush ，此时 pending 置为 false ）
-> AsyncAction.execute
-> AsyncAction._execute （执行实际 work 函数的地方）
```

在 Chrome 的 debug 中，我们也能清晰的看到对应的调用栈：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/27/202310271142144.avif)

另外作为一个 `Subscription` ，它的 `unsubscribe` 其实并不复杂：

```typescript
export class AsyncAction<T> extends Action<T> {
  unsubscribe() {
    // 没关闭过才执行一次关闭
    if (!this.closed) {
      const { id, scheduler } = this;
      const { actions } = scheduler;

      // 清理状态
      this.work = this.state = this.scheduler = null!;
      // 调度的状态置为 false ，因为我们不再执行这个函数了
      this.pending = false;

      // 核心，从 actions 中删除自己
      // 对于 AsyncAction 自身，下面这段代码不会执行到，前面我们说过 AsyncAction 并不会存储到 actions 中。
      arrRemove(actions, this);
      
      // 取消掉定时器
      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, null);
      }

      // 跟之前 schedule 一样，由于 recycleAsyncId 需要判断新旧 delay ，所以放到 recycleAsyncId 后清理状态
      this.delay = null!;
      
      // 父类的实现
      super.unsubscribe();
    }
  }
}
```

对于 `AsyncAction` 来说，如果已经在调度状态了，那么核心就是取消掉定时器。

### AsapScheduler 和 AsapAction

可能很多人和我一样，在第一次看到这个的实现的时候，一头污水， Asap ，什么意思？

在英文中，它是 as soon as possible 的缩写，意思是“尽可能快的”。

比如最近 cs2 转会期间猪猪对宝蓝被下放一事发出建议，希望有队伍能尽快签下他：

![Someone sign him ASAP](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2023/10/30/202310300947615.avif)

（PS： NIP 终于不再执着 60 万了，猪猪你也不看看宝蓝最近打的什么鬼样子，被 bench 完全不意外，意外的是竟然这么久才 bench ...）

不要被它的名字吓到，在内部中它其实就是包装了 `Promise.then` 而已。

如果你懂一点浏览器宏任务微任务的八股文的话，应该就能理解 `Promise.then` 比 `setTimeout` 或者 `setInterval` 快的原因了。

`AsapScheduler` 和 `AsapAction` 分别继承了 `AsyncScheduler` 和 `AsyncAction` ，也就是是说它们的执行流程大体是相似的。

我们先看下 `AsapScheduler` 如何继承 `AsyncScheduler` ：

```typescript
export class AsapScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {}
}
```

这里我们先不管它是如何重写 `flush` 方法的，我们再看下 `AsapAction` 是如何继承的：

```typescript
export class AsapAction<T> extends AsyncAction<T> {
  constructor(protected scheduler: AsapScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  protected requestAsyncId(scheduler: AsapScheduler, id?: TimerHandle, delay: number = 0): TimerHandle {}
  protected recycleAsyncId(scheduler: AsapScheduler, id?: TimerHandle, delay: number = 0): TimerHandle | undefined {}
}
```

可以看到重写了 `requestAsyncId` 和 `recycleAsyncId` 方法。

从 `AsyncScheduler` 执行的过程，我们先看 `requestAsyncId` 的实现：

```typescript
export class AsapAction<T> extends AsyncAction<T> {
  protected requestAsyncId(scheduler: AsapScheduler, id?: TimerHandle, delay: number = 0): TimerHandle {
    // 如果设定了延迟时间，那么回退到 AsyncAction
    if (delay !== null && delay > 0) {
      return super.requestAsyncId(scheduler, id, delay);
    }
    
    // 这里就和 AsyncAction 显著不同了
    // AsyncAction 直接调用 flush ，而这里是手动 push 进 actions 中，再进行 setImmediate（默认下为 Promise.then ） 调度 
    scheduler.actions.push(this);
    // 在未处于调度过程时，启动调度，并把调度的 id 挂载到 Scheduler 的 _scheduled 属性上
    // 如果处于调度过程中，则复用已有的调度器 id
    return scheduler._scheduled || (scheduler._scheduled = immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
  }
}
```

这里使用的是一个 `setImmediate` 的函数，和 `setInterval` 一样， RxJS 封装了它们，并且我们也能通过 `delegate` 对象来覆盖。

```typescript
// immediateProvider.ts
import type { TimerHandle } from './timerHandle';
const { setImmediate, clearImmediate } = Immediate;

export const immediateProvider: ImmediateProvider = {
  // When accessing the delegate, use the variable rather than `this` so that
  // the functions can be called without being bound to the provider.
  setImmediate(...args) {
    const { delegate } = immediateProvider;
    return (delegate?.setImmediate || setImmediate)(...args);
  },
  clearImmediate(handle) {
    const { delegate } = immediateProvider;
    return (delegate?.clearImmediate || clearImmediate)(handle as any);
  },
  delegate: undefined,
};


// Immediate.ts
export const Immediate = {
  setImmediate(cb: () => void): number {
    const handle = nextHandle++;
    activeHandles[handle] = true;
    if (!resolved) {
      resolved = Promise.resolve();
    }
    resolved.then(() => findAndClearHandle(handle) && cb());
    return handle;
  },

  clearImmediate(handle: number): void {
    findAndClearHandle(handle);
  },
};
```

在前面我们说过， `AsapScheduler` 实际上就是封装了 `Promise.then` ， `Promise.then` 和 `setInterval` 的区别还是很大的，除了执行时机的不同之外， `setInterval` 调用之后会返回一个 id ，后面我们可以通过 `clearInterval` 来取消掉这个定时器，而 `Promise.then` 是没有这个原生的功能的，在 RxJS 中，通过计数器以及一个用来标记的字面对象来实现：

```typescript
// 每个 Promise.then 对应一个唯一的 id
// 每调用 Promise.then 就自增 nextHandle，确保 id 唯一
let nextHandle = 1;
// 一个 Promise 对象，用来调用 then 生成一个微任务
// 要注意这里是懒加载的，不然 zone.js 可能无法代理这个 Promise 对象
let resolved: Promise<any>;

// 用来保存当前正在调度的 id 的状态，如果 activeHandles[id] = true 则此时调度依然存在，如果不存在则调度应该被取消，也就是不执行 Promise.then 的回调
const activeHandles: { [key: number]: any } = {};

// 取消一个微任务
function findAndClearHandle(handle: number): boolean {
  if (handle in activeHandles) {
    delete activeHandles[handle];
    return true;
  }
  return false;
}

// 封装
export const Immediate = {
  setImmediate(cb: () => void): number {
    // 生成一个唯一 id
    const handle = nextHandle++;
    // 标记为需要调度
    activeHandles[handle] = true;
    // 初始化全局的 Promise 对象
    if (!resolved) {
      resolved = Promise.resolve();
    }
    // 开始调度
    // 核心，如果 findAndClearHandle 返回了 true ，那么才执行 cb
    resolved.then(() => findAndClearHandle(handle) && cb());
    // 返回 id
    return handle;
  },

  clearImmediate(handle: number): void {
    // 清除调度
    findAndClearHandle(handle);
  },
};
```

原生的 `Promise` 并没有取消这一说法， `Promise` 是对“未来”的一种承诺，要么成功，要么失败， RxJS 通过一个唯一的 id 来标记一个 `Promise.then` 的回调，它的简化代码类似下面这样：

```typescript
let pId = 1;
let map = {}
let resolved = Promise.resolve();

const cb = () => {}

resolved.then(() => {
  if (map[pId]) {
    cb();
    delete map[pId];
  }
});

// 执行一些操作
// 让 cb 调度
map[pId] = true;

// 执行一些操作
// 不想让 cb 调度了
delete map[pId];
```

实际上， `Promise.then` 确实执行了，但是通过包括一段对标记的判断来实现“取消”调度，实际上是没执行到调度（ `&&` 操作符短路了）。

接下来我们看一下 `recycleAsyncId` 的实现：

```typescript
export class AsapAction<T> extends AsyncAction<T> {
  protected recycleAsyncId(scheduler: AsapScheduler, id?: TimerHandle, delay: number = 0): TimerHandle | undefined {
    // 如果设定了延迟时间，那么回退到 AsyncAction
    if (delay != null ? delay > 0 : this.delay > 0) {
      return super.recycleAsyncId(scheduler, id, delay);
    }
    
    // 如果已经没有任务需要执行了的话，清掉调度器的 id
    // 这样下一次的调度才能正确获取新的调度器 id
    const { actions } = scheduler;
    if (id != null && actions[actions.length - 1]?.id !== id) {
      immediateProvider.clearImmediate(id);
      // 重要判断，由于我们会嵌套调用 schedule ，此时在执行外层 schedule 结束后我们会调用本方法来复用或者取消调度器，但是在内部执行的时候 _scheduled 就会更新成新的调度器 id 的值了，所以要判断两者是否一致，不然会导致嵌套的调度调用不全，具体可以看 https://github.com/ReactiveX/rxjs/issues/6747
      if (scheduler._scheduled === id) {
        scheduler._scheduled = undefined;
      }
    }
    
    return undefined;
  }
}
```

这里可能需对两个重写的函数配合起来理解。

在 `AsapScheduler` 中，在一次同步执行的过程中产生的新的调度都会共用一个调度器的 id ，而这个 id 挂载在父类 `AsyncScheduler` 的 `_schedule` 属性上。

之前我们说过 `AsyncScheduler` 中暂时使用不到 `_schedule` 属性，因为对于 `AsyncScheduler` ，每次调度都会产生新的调度器 id ，而 `AsapScheduler` 则是共用一个调度器 id ，在一次调度中对于所有嵌套的调度统一批处理。我们可以用下面的例子来解释：

```typescript
// 启动一个调度，得到一个 id = 1
// 放到 actions 中
asapScheduler.schedule(function () {
  // 启动一个调度，得到一个 id = 2
  // 放到 actions 中
  asapScheduler.schedule(function () {
    console.log("3");
  });
  console.log("1");
  // 放到 actions 中
  // 复用前面的调度 id = 2
  asapScheduler.schedule(function () {
    console.log("4");
  });
  console.log("2");
});
```

上面的代码会输出 1 2 3 4 ，即最外层的 `schedule` 使用一次 `Promise.then` 调度，内部两个 `schedule` 使用一次 `Promise.then` ，即合并执行。

这也符合原生 `Promise.then` 的执行顺序，如果在一个微任务中继续启动一个微任务，那么新的微任务将会放到当前微任务的后面，在当前微任务执行完成后立即执行新的微任务，上面的写法就类似如下 `Promise.then` 的写法：

```typescript
Promise.resolve().then(() => {
  Promise.resolve().then(() => {
    console.log("3");
  });
  console.log("1");
  Promise.resolve().then(() => {
    console.log("4");
  });
  console.log("2");
});

// 输出 1 2 3 4
```

接着我们回到 `AsapScheduler` 中，看看 `flush` 是如何重写的：

```typescript
export class AsapScheduler extends AsyncScheduler {
  public flush(action?: AsyncAction<any>): void {
    this._active = true;
    // 当前的 Asap 调度器 id ，可能不存在
    // 如果把 AsapScheduler 当作 AsyncScheduler 使用的话，这里的 _scheduled 就不会有值
    // 因为我们前面说过， AsyncScheduler 的调度器 id 位于每个 Action 实例中
    const flushId = this._scheduled;
    
    // 清除调度器 id ，如果调度器 id 存在，（这个调度器 id 一定是基于 Promise.then 的）那么本次的执行就会执行全部的任务
    // 清除掉，其他调度才能正确地通过 requestAsyncId 获取一个新的调度 id
    this._scheduled = undefined;

    const { actions } = this;
    let error: any;
    action = action || actions.shift()!;

    do {
      // 批处理，把所有调度器 id 相同的 Action 都执行掉
      if ((error = action.execute(action.state, action.delay))) {
        break;
      }
      // 如果当前处理的是 AsyncAction ，那么 while 只会执行一次，因为如果我们在一个 AsyncAction 中请求 AsapAction 的话， action.id === flushId 不成立， flushId 此时一定是 undefined 。
      // 而如果处理的是 AsapAction 则此时则会一次性执行掉所有存在的任务。直到某个 action 的 id 不为当前批处理的 id （比如嵌套调用的情况）。
    } while ((action = actions[0]) && action.id === flushId && actions.shift());

    this._active = false;

    // 错误情况
    if (error) {
      while ((action = actions[0]) && action.id === flushId && actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  }
}
```

可能你在看这个实现的时候有点晕，其实只要明白以下的两点

- 在传入的 `Action` 是 `AsyncAction` 时，此时 `actions` 数组可能为空也可能不为空，这取决于你在传入的 `AsyncAction` 中所进行的动作，但是可以肯定的是，这个 `AsyncAction` 前面一定不会有 `AsapAction` 了，因为我们处在一个宏任务中，如果此时它的前面存在未执行的 `AsapAction` ，那么这是矛盾的，因为这些 `AsapAction` 应该在上一个微任务队列就被清空了。
- 在传入的 `Action` 是 `AsapAction` 时，此时 `actions` 可能为空也可能不为空，这取决于你在传入的 `AsapAction` 中所进行的动作。但是 `actions` 一定不会有 `AsyncAction` 实例，这是因为 `AsyncAction` 只会在 `flush` 的时候传入，并不会手动加入到 `actions` 中。

这个方法其实就是兼容了 `AsyncScheduler` 的 `flush` 实现，并且额外实现了批处理本次微任务的全部 `Action` 的功能。

### AnimationFrameScheduler 和 AnimationFrameAction 

这两者的实现和 `AsapScheduler` 和 `AsapAction` 几乎一样，唯一的区别就是从 `Promise.then` 切换到了 `requestAnimateFrame` ，所以这里就不讲了。

需要注意的一点是， `AnimationFrameScheduler` 似乎有个遗留的 bug ，在之前修复 `AsapScheduler` 的时候没有顺道修好像？

不过这也只是我的猜测，贴上相关的 [asapScheduler: Scheduling inside of an executing action only works once](https://github.com/ReactiveX/rxjs/issues/7196)

对于 `AnimationFrameScheduler` ，现在的问题是如果嵌套使用的话会导致只执行一次嵌套的调度，如下图所示：

![](https://user-images.githubusercontent.com/48575405/279329977-5427887c-3aab-4594-aee3-b6e709336b8d.png)

而如果使用原生的 `requestAnimateFrame` 则没有这个问题，如下图：

![](https://user-images.githubusercontent.com/48575405/279330102-0745fb8d-be07-44c3-a452-2699e161630d.png)

我也在上面的 issue 中询问了维护者，看他是怎么回复的吧。

### QueueScheduler 和 QueueAction

`QueueScheduler` 是一种“同步”的 `AsapScheduler` ，可能这句话会让你觉得很懵逼。

在 `AsapScheduler` 中，我们会把任务延迟到微任务队列中执行，如果在微任务中继续启动 `AsapScheduler` 的话，那么这些任务会被放到 `actions` 属性中，然后在当前 Action 执行完毕之后，继续执行 `actions` 中的剩余 Action 。

而 `QueueScheduler` 则是立即执行任务，如果在执行的任务中继续调用 `QueueScheduler` ，那么会放到 `actions` 属性中，在当前 Action 执行完毕之后继续执行 `actions` 中的剩余 Action 。

我们可以用下面的代码来表示两者的区别：

```typescript
console.log("before");
asapScheduler.schedule(() => {
  console.log("1");
  asapScheduler.schedule(() => {
    console.log("2");
  });
  asapScheduler.schedule(() => {
    console.log("3");
  });
  console.log("4");
});
console.log("after");

// 上面例子输出：
// before
// after
// 1
// 4
// 2
// 3

console.log("before");
queueScheduler.schedule(() => {
  console.log("1");
  queueScheduler.schedule(() => {
    console.log("2");
  });
  queueScheduler.schedule(() => {
    console.log("3");
  });
  console.log("4");
});
console.log("after");

// 上面例子输出：
// before
// 1
// 4
// 2
// 3
// after
```

`QueueScheduler` 只是继承了 `AsyncScheduler` 而已，并没有重写什么：

```typescript
export class QueueScheduler extends AsyncScheduler {
}
```

这里我们的重点主要是 `QueueAction` ，它继承了 `AsyncAction` ：

```typescript
export class QueueAction<T> extends AsyncAction<T> {
  constructor(protected scheduler: QueueScheduler, protected work: (this: SchedulerAction<T>, state?: T) => void) {
    super(scheduler, work);
  }

  public schedule(state?: T, delay: number = 0): Subscription {
    // 回退到 AsyncScheduler
    if (delay > 0) {
      return super.schedule(state, delay);
    }
    this.delay = delay;
    this.state = state;
    // 核心，放到 actions 属性中
    this.scheduler.flush(this);
    return this;
  }

  public execute(state: T, delay: number): any {
    return delay > 0 || this.closed
        // 回退到 AsyncScheduler
      ? super.execute(state, delay)
      : this._execute(state, delay);
  }

  protected requestAsyncId(scheduler: QueueScheduler, id?: TimerHandle, delay: number = 0): TimerHandle {
      // 回退到 AsyncScheduler
    if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
      return super.requestAsyncId(scheduler, id, delay);
    }

    // 放到 actions 中
    scheduler.flush(this);
    
    // 返回 0 ，并不是意味着一个调度器的 id 为 0， 而是表示调度器已被清除，这里返回 0 只是类型需要。
    return 0;
  }
}
```

通过代码我们可以知道，当我们通过 `queueScheduler.schedule` 进行调度的时候，它会同步执行到 `requestAsyncId` 方法，此时直接执行了 `scheduler.flush` ，此时会直接开始调度，而嵌套的 `queueScheduler.schedule` 调用，也会走到 `scheduler.flush` ，但是此时 `_active` 此时为 `true` ，只会把它推入到 `actions` 中，然后当第一个执行完毕之后，剩余 `actions` 内的 `Action` 就会被依次执行。

## Scheduler 和 Observable

对于一个 `Observable` ，有两个地方我们可以让 `Scheduler` 织入，一个是 `subscribe` 的时候，一个是 `next` （或者 `complete` 或者 `error` ） 的时候。

RxJS 提供了两个管道 `subscribeOn` 和 ``observeOn`` 来对应这两种情况。

### subscribeOn

`subscribeOn` 决定的是订阅操作的时机。

它的实现很简单，通过传入的 `Scheduler` 来启动一个调度，在调度函数的内部执行 `subscribe` 操作：

```typescript
export function subscribeOn(scheduler, delay = 0){
  return (source) =>
    new Observable((subscriber) => {
      // .schedule 返回了一个 Subscription 
      subscriber.add(scheduler.schedule(() => source.subscribe(subscriber), delay));
    });
}
```

### ObserveOn

`observeOn` 决定的是订阅了之后发出值的时机。

它的实现同样不难，通过代理原来的 `subscriber` ，重写对应的三个方法来实现：

```typescript
export function observeOn(scheduler, delay = 0) {
  return (source) =>
    new Observable((destination) => {
      source.subscribe(
        // 之前我们写过的 operate 操作符，可以代理 subscriber ，重写方法。
        operate({
          destination,
          next: (value) => executeSchedule(destination, scheduler, () => destination.next(value), delay),
          error: (err) => executeSchedule(destination, scheduler, () => destination.error(err), delay),
          complete: () => executeSchedule(destination, scheduler, () => destination.complete(), delay),
        })
      );
    });
}
```

这里使用了 `executeSchedule` ，它的内部实现就是通过调度器来启动相应的 `work` 。

```typescript
export function executeSchedule(
  parentSubscription,
  scheduler,
  work,
  delay = 0,
  repeat = false
){
  // 启动调度
  const scheduleSubscription = scheduler.schedule(function (this: SchedulerAction<any>) {
    work();
    if (repeat) {
      // 这里如果是同步的调度器，那么我们需要手动添加
      parentSubscription.add(this.schedule(null, delay));
    } else {
      // 这里的 observeOn 只会走到这里
      // 执行一次之后不再执行，需要手动取消订阅
      this.unsubscribe();
    }
  }, delay);

  // 添加，即使重复添加也没有关系，因为 Subscription 是通过 Set 来保存这些 Subscription 的
  parentSubscription.add(scheduleSubscription);

  // 这个返回我们在 observeOn 不会用到所以不管。
  if (!repeat) {
    return scheduleSubscription;
  }
}
```

### 其他操作符和管道

在 RxJS 中，虽然很多时候我们不会明显的使用到 `Scheduler` ，但是某些操作符或者管道默认情况下都是可以通过最后一个入参来控制，比如 `delay` 管道，在默认情况下它会使用 `asyncScheduler` 作为调度器：

```typescript
export function delay<T>(
  due: number | Date, 
  // 默认调度器
  scheduler: SchedulerLike = asyncScheduler
): MonoTypeOperatorFunction<T> {
  const duration = timer(due, scheduler);
  return delayWhen(() => duration);
}
```

# 后记

在逛 issue 的时候，发现了作者说在 8.0 可能会发布一个更加轻巧的调度器，说实话，作为一个切图仔，我还是不是很喜欢继承，这东西对脑的算力有点高，恰好我的🧠又很一般，方法跳来跳去，很容易就阅读疲劳，每次调用方法都得思考它的子类是不是重写了，他这段逻辑是不是只对子类有作用的？

而且我总觉得这个调度器的继承关系有点让人懵逼，作为基类的 `AsyncScheduler` 竟然会有 `_schedule` 这种子类才要用到的属性... 当然，这里只是小小的吐槽，咱也不是什么 OOP 高手，而且写代码有时候真的不是那样一定对这样一定错，有可能在某些情况下必须写成错的方式才能好处理，所以保持谦虚，不要妄自菲薄。

在逛 issue 的时候，发现有人抱怨作者维护的太慢了，作者回了句：

> A friendly reminder to some of the snark in here: This is free software maintained by unpaid volunteers. I understand you're frustrated, but I'm quite literally not paid to deal with you.

大意就是“免费软件，我没空修你得等着，抱怨是没用的”。 我还是很支持作者的，选择开源软件，你就应该明白，免费的往往就是最贵的，大家可以为爱发电，也可以立马崩撤卖溜。不过 RxJS 作为 Angular 的一个重要的依赖库（另一个应该是 zone.js ），它的稳定还是很重要的，虽然国内 Angular 开发者可能并不多。

RxJS 的源码部分应该就到这里了，在大半年前，我发了几篇关于 RxJS 使用的帖子，而现在，我发了关于 RxJS 的几篇源码解析的文章。当然我写的可能会有错误，可能写的不能让所有对 RxJS 感兴趣的人明白它的内部实现，但如果有某个人了解了，领悟了，那么我的价值就实现了。如果你发现帖子中有任何代码错误，逻辑错误，书写错误的问题，可以通过下面的评论来反馈，非常感谢！
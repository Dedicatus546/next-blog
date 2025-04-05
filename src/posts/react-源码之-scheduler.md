---
title: react 源码之 scheduler
tags:
  - react
  - react-scheduler
categories:
  - 编程
key: 1671615982date: 2022-12-21 17:46:22
updated: 2023-02-13 18:28:44
---



# 前言

最近在看 `react` 的源码，来写一写在 `react` 中的任务调度模块

<!-- more -->

在 `react` 中， `react` 自己实现了一套任务调度系统，这个系统成为一个单独的模块，即 `scheduler`

为什么写这个，是因为其实 `scheduler` 包和 `react` 的耦合基本没有，而且实现比较简洁，所以拿出来写写

（~~最重要的一点是其他模块我看不懂啊~~)

# 正文

本文一切的源码来源于 `react 18.2.0`

`scheduler` 包的源码在 `package/scheduler` 下

其核心的文件为 `package/scheduler/src/forks/Scheduler.js` ，主要的逻辑都在这个文件中

在 `scheduler` 模块中定义了几种不同的优先级，放在 `package/scheduler/src/SchedulerPriorities.js` 中

```typescript
export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
```

数字越低，则优先级越高，意味着任务需要更快的被执行

对于每种优先级，他们都对应了某个超时时间，在 `package/scheduler/src/forks/Scheduler.js` 的 `78 ~ 85` 行中，定义了几种如下的超时时间

```typescript
var maxSigned31BitInt = 1073741823;

// 立即执行
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// 在 x ms 内执行
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// 可以无限超时
var IDLE_PRIORITY_TIMEOUT = 1073741823;
```

对于每个优先级对应的超时时间，则是在 `unstable_scheduleCallback` 函数中匹配的

```typescript
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
  // ...
  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  // ...
}
```

在后面我们也会讲到，通过这个函数来向调度系统中注册任务

在调度系统中，主要使用两个最小堆来存放任务列表，一个是处于调度中的任务列表，一个是延迟调度的任务列表

在 `package/scheduler/src/forks/Scheduler.js` 的 `88 ~ 89` 行中

```typescript
var taskQueue: Array<Task> = [];
var timerQueue: Array<Task> = [];
```

在调度系统中，存在两种任务，又或者说任务的两种状态，一种是正在调度中任务，一种是延迟任务

延迟任务会放到 `timerQueue` 中，如果延迟时间结束，那么它就会被放到 `taskQueue` 中执行调度过程

这里要注意，`react` 自己实现了一个最小堆的算法，在 `package/scheduler/src/SchedulerMinHeap.js` 下

该文件导出一些操作堆的工具函数，如下

```typescript
function push<T: Node>(heap: Heap<T>, node: T): void {
  // ...
}
function peek<T: Node>(heap: Heap<T>): T | null {
  // ...
}
function pop<T: Node>(heap: Heap<T>): T | null {
  // ...
}
```

当然，这些函数的实现都不是重点，这里我们需要注意的是任务间的比较函数，即小根堆的堆顶是如何比较出来的

```typescript
function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
```

可以看到，任务的优先级和两个字段关联，一个是 `sortIndex`， 一个是 `id`

在小根堆中存放的是任务对象 `Task`，每一个 `Task` 它的 `js` 对象结构如下

```typescript
type Task = {
  id: number,
  callback: Callback | null,
  priorityLevel: PriorityLevel,
  startTime: number,
  expirationTime: number,
  sortIndex: number,
};
```

其中 `id` 为数字，在全局有一个 `id` 自增变量，在 `package/scheduler/src/forks/Scheduler.js` 的 `92` 行

```typescript
// Incrementing id counter. Used to maintain insertion order.
var taskIdCounter = 1;
```

每次有新的任务进来，就会把任务的 `id` 置为这个 `taskIdCounter` 的值，然后 `taskIdCounter` 自增，为下一个 `Task` 做准备

`callback` 即回调函数

`priorityLevel` 为该任务的优先级

`startTime` 有两个含义，如果此时是立即调度任务的话，那么这个值为 `currentTime()` 即注册这个任务的时间

如果是延时任务的话，那么此时的值为 `currentTime() + delay` ，这里的 `delay` 为用户指定的延迟时间，后面在 `unstable_scheduleCallback` 函数也还会讲到

也可以可以简单理解为开始调度的时间，在 `startTime` 开始调度任务

`expirationTime` 即任务的过期时间，可以简单理解为任务最晚执行的时间，即 `startTime + priorityLevel__timeout`

`priorityLevel__timeout` 即该任务对应的优先级所对应的超时时间，前面的 `unstable_scheduleCallback` 函数内的 `switch` 有讲过

对于 `sortIndex`， 它在调度队列和延时队列中的含义不同，在 `unstable_scheduleCallback` 函数中，分别赋予了不同的值，如下

```typescript
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
  var currentTime = getCurrentTime();

  var startTime;
  // ... 确定 startTime ，有 delay 那么就是 currentTime() + delay ，没有就是 currentTime()

  var timeout;
  // ... 确定优先级的 timeout

  var newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  // ...

  if (startTime > currentTime) {
    // 延时任务
    newTask.sortIndex = startTime;
    // ...
  } else {
    newTask.sortIndex = expirationTime;
    // ...
  }

  return newTask;
}
```

可以看到，调度队列的 `sortIndex` 为 `expirationTime` ，即任务的过期时间，也即任务的最晚执行时间

如果任务 `A` 的过期时间比任务 `B` 早，那么 `A` 是一定要先执行的

而延时任务的 `sortIndex` 则是任务的 `startTime` ，即任务应该**从延时队列放到调度队列**的时间

当 `sortIndex` 相同的时候，此时会按照 `id` 进行判断，即先加入的会先执行，而后加入的会后执行

在函数 `advanceTimers` 中，我们也可以看到，当一个延时任务从延时队列放到调度队列之后， `sortIndex` 属性也会更新成 `expirationTime`

```javascript
function advanceTimers(currentTime: number) {
  // 延时队列是否还有任务
  let timer = peek(timerQueue);
  while (timer !== null) {
    // 由于小根堆无法指定删除某个 Task
    // 而接口暴露了一个 unstable_cancelCallback 函数，内部就是把 Task 的 callback 属性置空
    // 所以这里要过滤掉这些被取消的 Task
    if (timer.callback === null) {
      pop(timerQueue);
    } 
    // 检测到当前时间已经大于延时任务的启动时间了
    else if (timer.startTime <= currentTime) {
      // 延时任务从延时队列弹出
      pop(timerQueue);
      // 更新 sortIndex ，此时它就是一个调度任务了
      timer.sortIndex = timer.expirationTime;
      // 放到调度队列中
      push(taskQueue, timer);
    } else {
      // 没走到上面两个分支，那么确定此时的延时任务 startTime > currentTime ，此时还不用将它放到调度队列中
      // 而又由于延时队列是最小堆，可以判断后面的延时任务的 startTime 都会大于 currentTime ，这里就直接跳出循环结束函数即可
      return;
    }
    // 查看下个延时任务
    timer = peek(timerQueue);
  }
}
```

`advanceTimers` 可以简单理解为把延时队列中应该放入调度队列的任务放到调度队列中

前面我们分析了 `Task` 的数据结构以及 `Task` 的优先级，超时时间等

对于每个 `Task` ，当轮到它执行的时候，并不是同步执行的，而是通过异步形式来执行

在代码中的 `599 ~ 630` 行，我们可以发现有几个异步的 `api` ，`setImmediate` ，`MessageChannel` 以及 `setTimeout`

```javascript
let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
} else if (typeof MessageChannel !== 'undefined') {
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
} else {
  schedulePerformWorkUntilDeadline = () => {
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}
```

从上往下，层层地降级，最优的选择是 `setImmediate` ，次优选择 `MessageChannel` ，如果前面都不支持，那么选择 `setTimeout` 

在该段代码的注释中，提到了使用每个 `api` 的原因

对于 `setImmediate`

> Node.js and old IE. 
> There's a few reasons for why we prefer setImmediate.
> Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
> (Even though this is a DOM fork of the Scheduler, you could get here
> with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
> https://github.com/facebook/react/issues/20756
>
> But also, it runs earlier which is the semantic we want.
> If other browsers ever implement it, it's better to use it.
> Although both of these would be inferior to native scheduling.

大意就是，这个 `api` 是 `node` 和老 `IE` 下支持的，对比 `MessageChannel` ，`setImmediate` 不会阻碍 `node` 进程的退出，以及会被更早的执行

我们知道，`react` 在 `SSR` 下会跑在 `node` 端，所以这里会先判断 `setImmediate`

对于 `MessageChannel` ，对于很多人来说可能不是特别熟悉，这里放一个 `MDN` 的地址 [MessageChannel - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)

> DOM and Worker environments.
> We prefer MessageChannel because of the 4ms setTimeout clamping.

这个 `api` 在 `DOM` 和 `Worker` 环境下可用，优先使用它的原因是 `setTimeout` 存在最小 `4ms` 的延迟，而 `MessageChannel` 没有这个限制

关于 `setTimeout` 的 `4ms` 延迟，这里贴一个链接，讲的很好 [为什么 setTimeout 有最小时延 4ms ? - 知乎](https://zhuanlan.zhihu.com/p/155752686)

`react` 中会有嵌套 `setTimeout` 的情况，而在调度器的设置中，每个时间片为 `5ms` ，如果触发了 `4ms` 的限制，那么也就是说只剩 `1ms` 用于执行了，这对于调度来说是无法接受了

接下来我们回到 `unstable_scheduleCallback` 这个函数

在判断完是调度任务还是延时任务之后，这个函数除了把任务推入相应的小根堆之后，还会执行一些操作

```typescript
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
  // ...

  if (startTime > currentTime) {
    // 延时任务
    // ...
    requestHostTimeout(handleTimeout, startTime - currentTime);
  } else {
    // 调度任务
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

这里面有四个函数，`requestHostTimeout` 、 `requestHostCallback` 、 `handleTimeout` 、 `flushWork`

首先我们先看 `requestHostTimeout` 和 `requestHostCallback` 这两个函数

```typescript
function requestHostTimeout(callback, ms: number) {
  taskTimeoutID = localSetTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}
```

其中 `requestHostTimeout` 很简单，就是启动了一个 `setTimeout` 宏任务，记录了任务的 `ID`

传入 `requestHostTimeout` 的 `callback` 为 `handleTimeout`

```typescript
function handleTimeout(currentTime: number) {
  // 恢复标志位
  isHostTimeoutScheduled = false;
  // 处理可以放到调度任务队列的延迟任务
  advanceTimers(currentTime);

  // 如果此时未调度，但是调度任务队列存在任务，要启动调度
  // 如果此时未调度，但是调度任务队列空了，而延迟任务队列非空，则要启动一个 setTimeout 来递归执行 handleTimeout 
  // 用于下一次重新执行 advanceTimers 来处理能放入调度任务队列的延迟任务
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```

简单讲 `handleTimeout` 就是 `advanceTimers` 包了一层，然后在能启动调度的情况下启动调度

对于 `requestHostTimeout(handleTimeout)` ，在整个调度过程中，某一时刻只会有一个 `setTimeout` 会真正地执行到

因为延时队列任务的堆顶是在不断变化的，假设我们现在推入了三个延时任务 `2 1 3` 数字代表延迟的时间（单位：`s`）

当我们把 `2` 放入延迟任务队列之后，调度系统会启动一个 `setTimeout` ，在 `2s` 之后执行一次 `handleTimeout`

而在 `0.5s` 之后我们放入了任务 `1` ，此时延时任务堆顶已经不是任务 `2` 了（任务 `2` 的 `startTime` 比任务 `1` 要大，即任务 `1` 的延迟时间比任务 `2` 要短），但是任务 `2` 的回调依然存在

所以这时我们需要取消任务 `2` 的回调，再启动任务 `1` 的回调，这样逻辑上才是正确的

接着我们立马加入延时任务 `3` ，由于此时延时任务 `3` 的 `startTime` 比任务 `1` 的大，此时延时任务队列堆顶还是任务 `1` ，此时则不用进行操作

在代码中，有两处清理的情况，其中一处为 `unstable_scheduleCallback` 中，在处理延时任务时，会先清理回调

```typescript
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
  // ...
  
  if (startTime > currentTime) {
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    // 如果调度任务队列为空，且此时新的任务是最先该放到调度任务的队列的话
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // 原本的回调要取消，因为此时第一个该放到调度任务队列的任务已经改变
      if (isHostTimeoutScheduled) {
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // 启动定时器
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // ...
  }

  return newTask;
}
```

另一处为 `flushWork` 中，在执行 `workLoop` 前会执行一次，因为 `workLoop` 结束前会把延迟任务队列的堆顶拿出来开一个 `setTimeout`

```typescript
function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  // ...
  
  // 存在的话要取消掉，因为 workLoop 会重新启动 handleTimeout
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }
  
  // ...
  try {
    // ...
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    // ...
  }
}

function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (
    currentTask !== null &&
    !(enableSchedulerDebugging && isSchedulerPaused)
    ) {
    // ...
  }
  
  if (currentTask !== null) {
    return true;
  } else {
    // 延迟任务队列非空，取堆顶开启定时器
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
```

对于 `requestHostCallback` ，它会把回调赋给 `scheduledHostCallback` 变量

然后判断 `isMessageLoopRunning` ，在非调度状态下才执行一次调度，即执行 `schedulePerformWorkUntilDeadline` 函数

```typescript
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}
```

在前面我们知道 `schedulePerformWorkUntilDeadline` 就是取 `setImmediate` 、 `MessageChannel` 、 `setTimeout` 中的一个

然后真正执行的是 `performWorkUntilDeadline` 这个函数，通过名字不难理解，就是执行任务直到截至时间

```typescript
const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    const hasTimeRemaining = true;
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  needsPaint = false;
};
```

这里可以看到上来就判断了 `scheduledHostCallback` 是否存在，然后在 `try` 里面执行了

这里要注意，这个 `scheduledHostCallback` 其实就是 `flushWork` 这个函数，因为之前在 `unstable_scheduleCallback` 中，就调用了 `requestHostCallback(flushWork)`

在 `finally` 里面，会根据 `scheduledHostCallback` 返回的情况来判断是否继续进行调度，如果 `hasMoreWork` 为真，那么表明此时还有任务，需要继续进行调度

如果为假，那么把全局变量 `isMessageLoopRunning` 置为假，意味着此时没有调度， `scheduledHostCallback` 置为 `null` ，等待下一次的 `flushWork`

接下来我们来看 `flushWork` 这个函数

```typescript
function flushWork(hasTimeRemaining: boolean, initialTime: number) {

  // 调度已完成
  isHostCallbackScheduled = false;
  
  // ...
  
  // 开始执行回调
  isPerformingWork = true;
  // 保存之前的优先级
  const previousPriorityLevel = currentPriorityLevel;
  try {
    // 执行回调
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    // 更新标志位
    currentTask = null;
    // 恢复之前优先级
    currentPriorityLevel = previousPriorityLevel;
    // 回调执行完成
    isPerformingWork = false;
  }
}
```

可以看到核心逻辑为 `workLoop`

```typescript
function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  // 取调度队列堆顶元素
  currentTask = peek(taskQueue);
  // 调度队列非空情况下开始循环 （enableSchedulerDebugging && isSchedulerPaused 这个条件不用看，调试用的）
  while (
    currentTask !== null &&
    !(enableSchedulerDebugging && isSchedulerPaused)
  ) {
    // 当前任务过期时间大于当前时间且此时无剩余时间
    // 或者此时前任务过期时间大于当前时间且此时应该交还主线程控制权
    // 则退出循环
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      break;
    }
    
    const callback = currentTask.callback;
    // 只处理 callback 为函数的情况
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      // 任务是否超时了
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // 执行任务，任务可能返回一个函数
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      // 返回了函数，则当前任务的 callback 更新为这个返回的函数
      // 然后进行下一次的调度
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } 
      // 返回非函数，则表明当前任务执行完成了，直接弹出
      else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // 任务还有，即上面的 while 提前退出
  // 此时返回 true ，表明还有任务未处理，performWorkUntilDeadline 里的 hasMoreWork 为 true
  // 这样会再次执行 schedulePerformWorkUntilDeadline ，在下一个宏任务时执行 performWorkUntilDeadline 函数，构成一个循环
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
```

在这里面的逻辑中，有两个很重要的点，一个是 `shouldYieldToHost` 以及 `continuationCallback` 

`shouldYieldToHost` 会计算时间片是否有剩余，有的话就会继续执行任务，无剩余就会结束循环

```typescript
function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime;
  // frameInterval 为 5ms ，即时间片长度
  if (timeElapsed < frameInterval) {
    return false;
  }
  
  // 这个 enableIsInputPending 目前是 false 不管
  if (enableIsInputPending) {
    if (needsPaint) {
      return true;
    }
    if (timeElapsed < continuousInputInterval) {
      if (isInputPending !== null) {
        return isInputPending();
      }
    } else if (timeElapsed < maxInterval) {
      if (isInputPending !== null) {
        return isInputPending(continuousOptions);
      }
    } else {
      return true;
    }
  }
  
  // 还没到时间片长度，可以继续执行
  return true;
}
```

中间这一段其实目前可以不管，因为 `enableIsInputPending` 这个配置目前是关闭的

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/12/21/202212211704785.avif)

所以整段的逻辑就是时间片是否消耗完

然后是 `continuationCallback` ，在调度中，其实是执行单位是一个 `callback` ，调度系统在执行完一个 `callback` 之后才能执行时间片判断

这会导致如果一个 `callback` 如果时间过长，那么调度系统就起不了作用了，所以这个 `continuationCallback` 可以看成暴露给调用者的一个接口

调用者可以自行对 `callback` 进行分割，返回一个新的 `callback` ，用于下一轮的调度

到此，核心的代码就基本讲完了，整个流程我们可以总结如下

在不引入延时任务这个概念的前提下，可以很简单地概括调度流程

每次通过 `MessageChannel` 启动调度，调度的内容为，如果当前时间片还有剩余，则拿出调度队列里的任务执行，直到时间片消耗完成或者调度任务队列为空

如果时间片消耗完，但是此时调度队列不为空，那么重新启动一个 `MessageChannel` 回调，然后重复上一行的流程

而延时任务也很简单，先放延时任务队列里面，然后把最应该先调度的延时任务通过 `setTimeout` 放入调度任务队列中，然后按照上面的流程执行

# 后记

虽然 `scheduler` 包和 `react` 的整体关系不大，但是看起来对于我来说还是有一些难度

当然，除了整体的逻辑，还有一些写法可以学习，比如代码里会保存 `setTimeout` 等一些定时器的引用

保证执行过程中调度系统的稳定性

```typescript
const localSetTimeout = typeof setTimeout === 'function' ? setTimeout : null;
const localClearTimeout =
  typeof clearTimeout === 'function' ? clearTimeout : null;
const localSetImmediate =
  typeof setImmediate !== 'undefined' ? setImmediate : null;
```
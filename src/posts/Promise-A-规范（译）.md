---
title: Promise A+规范（译）  
key: 1591925197date: 2020-06-12 09:26:37  
updated: 2023-02-13 18:28:45
tags:
 - JavaScript
categories:
 - 编程
---


# 前言

试着翻译下ECMA中对Promise实现规范，顺便学习下Promise（承诺）。

<!-- more -->

# 译文

> 原文地址 [Promise/A+](https://promisesaplus.com)

ok，开始一段一段的翻译

> **An open standard for sound, interoperable JavaScript promises—by implementers, for implementers.**

译：一个完整开放的，可互相操作的JavaScript Promise的开放标准，由实现者指定，面向实现者。

> A _promise_ represents the eventual result of an asynchronous operation. The primary way of interacting with a promise is through its `then` method, which registers callbacks to receive either a promise’s eventual value or the reason why the promise cannot be fulfilled.

译：一个promise意味着一个不是现在发生（非共时）的操作的最终结果。与一个promise进行交流的基本的方式是通过它的`then`方法，`then`方法注册了一个的回调函数，这个函数要么接收Promise的最终值，要么接收为什么这个promise不能转为完成状态（fulfilled）的原因。

> This specification details the behavior of the `then` method, providing an interoperable base which all Promises/A+ conformant promise implementations can be depended on to provide. As such, the specification should be considered very stable. Although the Promises/A+ organization may occasionally revise this specification with minor backward-compatible changes to address newly-discovered corner cases, we will integrate large or backward-incompatible changes only after careful consideration, discussion, and testing.

译：规范详细说明了`then`方法的的行为，提供了一个可以互相操作的基础来规定行为，所有和Promise/A+规范一致的promise实现依赖这个基础。因此，规范应该被认为是非常稳定的。虽然Promise/A+组织可能偶尔修改这份规范中少数的可以向后兼容的变化来解决新发现的极端情况，但是只有在经过深思熟虑，讨论和测试后才会合并大型的或者不能向后兼容的变化。

> Historically, Promises/A+ clarifies the behavioral clauses of the earlier [Promises/A proposal](http://wiki.commonjs.org/wiki/Promises/A), extending it to cover _de facto_ behaviors and omitting parts that are underspecified or problematic.

译：历史上，Promise/A+阐明了早期Promise/A提案中的行为条文，并扩展到覆盖实际上的行为和忽略未指定和有问题的部分。

> Finally, the core Promises/A+ specification does not deal with how to create, fulfill, or reject promises, choosing instead to focus on providing an interoperable `then` method. Future work in companion specifications may touch on these subjects.

译：最后，核心的Promise/A+规范没有处理如何创建，完成，或者拒绝Promise，而是专注于提供一个可以互相操作的`then`方法，在未来的配套规范中会涉及这些问题。

## 1. Terminology（术语）
> * 'promise' is an object or function with a `then` method whose behaior conforms to this specification.
> * 'thenable' is an object or function that defines a `then` method.
> * 'value' is any legal JavaScript value (including `undefined`, a thenable, or a promise).
> * 'exception' is a value that is thrown using the `throw` statement.
> * 'reason' is a value that indicates why a promise was rejected.

译：

* “promise”应该是一个带有`then`方法的对象或者函数，这个`then`方法的行为符合这份规范。
* “thenable”是一个定义了`then`方法的对象或者函数。
* “value”可以是任何合法的JavaScript的值（包括`undefined`，一个thenable或者一个promise）。
* “exception”是一个使用了异常语句所抛出的值。
* “reason”是一个表示为什么promise被拒绝的值。

## 2. Requirements（要求）

### 2.1 Promise States（Promise的状态）
> A promise must be in one of three states: pending, fulfilled, or rejected.

译：一个Promise的状态必须是等待状态，完成状态，或者拒绝状态中的一个。

> * When pending, a promise:
>   * may transition to either the fulfilled or rejected state.
> * When fulfilled, a promise:
>   * must not transition to any other state.
>   * must have a value, which must not change.
> * When rejected, a promise:
>   * must not transition to any other state.
>   * must have a reason, which must not change.

译：

* 当promise处于等待状态的时候：
  * promise可以转变成完成状态或者拒绝状态的其中一个状态。
* 当promise处于完成状态的时候：
  * 不能转变成其他任何状态。
  * 必须有一个value，并且这个value不能改变。
* 当promise处于拒绝状态的时候：
  * 不能转变成其他任何状态。
  * 必须有一个reason，并且这个reason不能改变。
  
> Here, “must not change” means immutable identity (i.e. `===`), but does not imply deep immutability.

译：这里的”不能改变”的意思是特征不变（即严格相等 `===` ），但不是意味着深层次的不变。（意思应该是浅相等，但不是深相等）

### 2.2 The `then` Method（`then`方法）

> A promise must provide a `then` method to access its current or eventual value or reason.

译：一个promise必须提供一个`then`方法来使用它当前或者最终的值或者（拒绝状态的）原因。

> A promise’s `then` method accepts two arguments:

译：promise的`then`方法接收两个参数

> `promise.then(onFulfilled, onRejected)`
> * Both `onFulfilled` and `onRejected` are optional arguments:
>   * If `onFulfilled` is not a function, it must be ignored.
>   * If `onRejected` is not a function, it must be ignored.

译：

* `onFulfilled`和`onRejected`参数都是可选的的参数:
  * 如果`onFulfilled`不是一个函数，则将被忽略。
  * 如果`onRejected`不是一个函数，则将被忽略。
  
  
> * If `onFulfilled` is a function:
>   * it must be called after `promise` is fulfilled, with `promise`‘s value as its first argument.
>   * it must not be called before `promise` is fulfilled.
>   * it must not be called more than once.

译：

* 如果`onFulfilled`是一个函数：
  * 在`promise`完成之后调用，并且函数的第一个参数为`promise`的`value`。
  * 在`promise`完成之前不能被调用。
  * 不能被调用超过一次。

> * If `onRejected` is a function:
>   * it must be called after `promise` is rejected, with `promise`’s reason as its first argument.
>   * it must not be called before `promise` is rejected.
>   * it must not be called more than once.

译：

* 如果`onRejected`是一个函数
  * 在`promise`被拒绝之后调用，并且函数的第一个参数为`promise`被拒绝的原因。
  * 在`promise`被拒绝之前不能被调用。
  * 不能被调用超过一次。
  
> `onFulfilled` or `onRejected` must not be called until the execution context stack contains only platform code.[#3.1](#3-1)

译：在执行上下文的堆栈中仅包含平台代码之前，`onFulfilled`和`onRejected`不能被调用。

> * `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value).[#3.2](#3-2)

译：

* `onFulfilled`和`onRejected`函数必须以函数方式调用（即不能是`this`这个值）。

> * `then` may be called multiple times on the same promise.
>   * If/when `promise` is fulfilled, all respective `onFulfilled` callbacks must execute in the order of their originating calls to `then`.
>   * If/when `promise` is rejected, all respective `onRejected` callbacks must execute in the order of their originating calls to `then`.

译：

* 在同一个`promise`中`then`方法可以重复调用。
  * 如果或者说当`promise`完成时，各自的`onFulfilled`回调函数必须按照它们最初在`then`方法上调用的顺序执行。
  * 如果或者说当`promise`被拒绝时，各自的`onRejected`回调函数必须按照它们最初在`then`方法上调用的顺序执行。

> * `then` must return a promise.[#3.3](#3-3)  
> `promise2 = promise1.then(onFulfilled, onRejected);`
> * If either `onFulfilled` or `onRejected` returns a value `x`, run the Promise Resolution Procedure `[[Resolve]](promise2, x)`.
>   * If either `onFulfilled` or `onRejected` throws an exception `e`, `promise2` must be rejected with `e` as the reason.
>   * If `onFulfilled` is not a function and `promise1` is fulfilled, `promise2` must be fulfilled with the same value as `promise1`.
>   * If `onRejected` is not a function and `promise1` is rejected, `promise2` must be rejected with the same reason as `promise1`.

译：

* `then`方法必须返回一个promise
  `promise2 = promise1.then(onFulfilled, onRejected);`
* 如果`onFulfilled`或者`onRejected`其中一个函数返回了一个值`x`，那么执行Promise的解决过程`[[Resolve]](promise2,x)`
  * 如果`onFulfilled`或者`onRejected`其中一个函数抛出了一个异常`e`，那么promise2必须为以`e`为原因的拒绝状态。
  * 如果`onFulfilled`不是一个函数而且promise1为完成态时，promise2必须为完成态并且带有和promise1相同的值
  * 如果`onRejected`不是一个函数而且promise1为拒绝态时，promise2必须为拒绝态并且带有和promise1相同的原因。

###  2.3 The Promise Resolution Procedure（Promise的解决程序）

> The **promise resolution procedure** is an abstract operation taking as input a promise and a value, which we denote as `[[Resolve]](promise, x)`. If `x` is a thenable, it attempts to make `promise` adopt the state of `x`, under the assumption that `x` behaves at least somewhat like a promise. Otherwise, it fulfills `promise` with the value `x`.

译：promise解决过程是一个输入一个promise或者一个值抽象的操作，这个操作我们用`[[Resolve]](promise, x)`这个标记来表示。如果`x`是一个thenable对象的话，在`x`的行为至少有点像一个promise的假设下，这个方法尝试将`promise`采用`x`的状态，否则，这个方法将以`x`的值来完成`promise`。

> This treatment of thenables allows promise implementations to interoperate, as long as they expose a Promises/A+-compliant `then` method. It also allows Promises/A+ implementations to “assimilate” nonconformant implementations with reasonable `then` methods.

译：对于thenables的论述允许promise的实现可以相互操作，只要它们暴露了一个Promise/A+一致性的`then`方法。它也允许Promise/A+实现以合理的`then`方法来”同化”不一致的实现。

> To run `[[Resolve]](promise, x)`, perform the following steps:

译：为了执行`[[Resolve]](promise, x)`，需要履行以下步骤：

> * If `promise` and `x` refer to the same object, reject `promise` with a `TypeError` as the reason.

译：

* 如果`promise`和`x`是同一个对象的话，以`TypeError`为原因拒绝这个promise。

> * If `x` is a promise, adopt its state[#3.4](#3-4):
>   * If `x` is pending, `promise` must remain pending until `x` is fulfilled or rejected.
>   * If/when `x` is fulfilled, fulfill `promise` with the same value.
>   * If/when `x` is rejected, reject `promise` with the same reason.

译：

* 如果`x`是一个promise，采用它的状态：
  * 如果`x`即将发生，`promise`必须保持即将发生的状态直到x完成或者被拒绝。
  * 如果或者当`x`完成，使得这个`promise`以相同的值完成
  * 如果或者当`x`被拒绝，使得这个`promise`以相同的原因被拒绝。
  

> * Otherwise, if `x` is an object or function,
>   * Let `then` be `x.then`.[#3.5](#3-5)
>   * If retrieving the property `x.then` results in a thrown exception `e`, reject `promise` with `e` as the reason.
>   * If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and second argument `rejectPromise`, where:
>     * If/when `resolvePromise` is called with a value `y`, run [[Resolve]](promise, y).
>     * If/when `rejectPromise` is called with a reason `r`, reject `promise` with `r`.
>     * If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
>     * If calling `then` throws an exception `e`,
>       * If `resolvePromise` or `rejectPromise` have been called, ignore it.
>        * Otherwise, reject `promise` with `e` as the reason.
>   * If `then` is not a function, fulfill `promise` with `x`.

译：

* 否则，如果`x`是一个对象或者函数，
  * 设置`then`方法为`x.then`
  * 如果检索`x.then`的属性导致一个抛出的异常`e`的话，以异常`e`为原因拒绝`promise`。
  * 如果`then`是一个函数，以`x`为`this`(上下文)的方式调用，第一个参数为`resolvePromise`，第二个参数为`rejectPromise`：
    * 如果或者当`resolvePromise`以一个值`y`被调用，执行`[[Resolve]](promise,y)`。
    * 如果或者当`rejectPromise`以一个原因`r`被调用，以`r`来拒绝这个promise。
    * 如果`resolvePromise`和`rejectPromise`都被调用，或者对同一个参数进行了多次的调用，只有第一次调用生效，其他即将的调用被忽略。
    * 如果执行`then`抛出了一个异常`e`
      * 如果`resolvePromise`或者`rejectPromise`已经被调用，则忽略它。
      * 否则，以`e`作为原因拒绝这个`promise`。
  * 如果`then`不是一个函数，则以`x`为值完成`promise`。
  
> * If `x` is not an object or function, fulfill `promise` with `x`.

译：

* 如果x不是一个对象或者函数，以`x`为值完成promise。

> If a promise is resolved with a thenable that participates in a circular thenable chain, such that the recursive nature of `[[Resolve]](promise, thenable)` eventually causes `[[Resolve]](promise, thenable)` to be called again, following the above algorithm will lead to infinite recursion. Implementations are encouraged, but not required, to detect such recursion and reject `promise` with an informative `TypeError` as the reason.[#3.6](#3-6)

译：如果一个promise通过一个thenable解决，而这个thenable参与了一个环形的thenable链，以至于`[[Resolve]](promise, thenable)`的递归性质最终造成`[[Resolve]](promise, thenable)`被再一次的调用，以上的计算将会导致无限的递归。实现应该鼓励去发现这样的递归然后提供一个`TypeError`错误作为原因来拒绝promise，但这并不是规定的。

## 3.Notes（一些地方的解释）

### 3.1
> Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that `onFulfilled` and `onRejected` execute asynchronously, after the event loop turn in which `then` is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as `setTimeout` or `setImmediate`, or with a “micro-task” mechanism such as `MutationObserver` or `process.nextTick`. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

译：这里的”平台代码”意思是指引擎，环境和promise实现的代码。实际上，这个要求确保`onFulfilled`和`onRejected`函数在`then`方法调用的事件循环之后以一个新的堆栈异步执行。可以以宏任务机制比如`setTimeout`或者`setImmediate`来实现，又或者以微任务机制比如`MutationObserver`或者`process.nextTick`来实现。由于promise实现被认为是平台代码，它自身可能包含一个调用处理程序的任务调度队列或者”蹦床”。

### 3.2
> That is, in strict mode `this` will be `undefined` inside of them; in sloppy mode, it will be the global object.

译：在严格模式下`this`在内部将会是`undefined`，而在非严格模式下，它将会是全局对象。

### 3.3
> Implementations may allow `promise2 === promise1`, provided the implementation meets all requirements. Each implementation should document whether it can produce promise2 === promise1 and under what conditions.

译：假设实现满足所有要求，实现可能允许`promise2 === promise1`。每个实现应该记录在什么情况下是否产生`promise2 === promise1`。

### 3.4
> Generally, it will only be known that `x` is a true promise if it comes from the current implementation. This clause allows the use of implementation-specific means to adopt the state of known-conformant promises.

译：一般地，只有在promise来自当前（自身）的实现的情况才能知道`x`是一个真的promise。这个条文允许具体实现的方式去采用已知一致的promise。

### 3.5
> This procedure of first storing a reference to x.then, then testing that reference, and then calling that reference, avoids multiple accesses to the x.then property. Such precautions are important for ensuring consistency in the face of an accessor property, whose value could change between retrievals.

译：程序的第一步储存`x.then`的引用，然后检验引用，然后调用引用，避免多次获取`x.then`的属性。这样的预防对于确保那些可能在检索过程中变化的存储属性的一致性很重要。

### 3.6
> Implementations should not set arbitrary limits on the depth of thenable chains, and assume that beyond that arbitrary limit the recursion will be infinite. Only true cycles should lead to a `TypeError`; if an infinite chain of distinct thenables is encountered, recursing forever is the correct behavior.

译：实现不应该对thenable链的深度设置任意的限制，并假设超过这个任意的限制递归将是无限的。只有正确的循环应该导致一个`TypeError`的错误；如果遇到一个不同的thenables组成的无限的链，永久的递归才是正确的行为。

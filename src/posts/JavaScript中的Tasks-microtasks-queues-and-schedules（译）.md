---
title: JavaScript中的Tasks, microtasks, queues and schedules（译）
key: 1591928364date: 2020-06-12 10:19:24
updated: 2023-02-13 18:28:44
tags:
- JavaScript
categories:
- 译文
---


# 前言

网上看到的，关于JavaScript的文章，感觉挺不错的，谷歌的一个工程师写的（应该），试着翻译学习下

<!-- more -->

# 译文

## Tasks, microtasks, queues and schedules

> 原文地址 [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
> When I told my colleague [Matt Gaunt](https://twitter.com/gauntface) I was thinking of writing a piece on microtask queueing and execution within the browser’s event loop, he said “I’ll be honest with you Jake, I’m not going to read that”. Well, I’ve written it anyway, so we’re all going to sit here and enjoy it, ok?

译：当我告诉我的同事Matt Gaunt我想写一篇关于微任务在浏览器事件循环内的队列和执行的文章时，他和我说：“老实讲，我不会去读这篇文章的”。emmm，反正我都写了，所以我们就坐下来（泡个茶）享受（<del>折磨自己</del>）下吧。

上来就是一段吐槽，可以的，是我喜欢的程序员<del>男人</del>。

> Actually, if video’s more your thing, [Philip Roberts](https://twitter.com/philip_roberts) gave a great talk at [JSConf on the event loop](https://www.youtube.com/watch?v=8aGhZQkoFbQ) - microtasks aren’t covered, but it’s a great introduction to the rest. Anyway, on with the show…

译：事实上，如果（你觉得）视频可以学到更多东西的话，Philip Rpberts提供了一段关于**JSConf on event loop**的很棒的演讲，虽然没有覆盖微任务，但是可以作为在休息时的一篇很好的读物。ok，接下来开始是正文…

> Take this little bit of JavaScript:

译：观察这一小块的JavaScript代码

```javascript
console.log('script start');

setTimeout(function () {
    console.log('setTimeout');
}, 0);

Promise.resolve().then(function () {
    console.log('promise1');
}).then(function () {
    console.log('promise2');
});

console.log('script end');
```

> In what order should the logs appear?

译：打印的文本将会以什么顺序展现呢？

> The correct answer: `script start`, `script end`, `promise1`, `promise2`, `setTimeout`, but it’s pretty wild out there in terms of browser support.

译：正确的答案为`script start`，`script end`，`promise1`，`promise2`，`setTimeout`
，但是在浏览器支持的方面来说，这是相当放荡的（应该是指这个结果不受控制，在不同浏览器中有不同的表现）。

> Microsoft Edge, Firefox 40, iOS Safari and desktop Safari 8.0.8 log `setTimeout` before `promise1` and `promise2` - although it appears to be a race condition. This is really weird, as Firefox 39 and Safari 8.0.7 get it consistently right.

译：在Edge，火狐40和桌面的Safari8.0.8的版本下，`setTimeout`会在`promise1`和`promise2`
之前打印，虽然似乎是一种竟态状况。这是相当奇怪的，因为火狐39和Safari8.0.7的版本下，对于这种行为却是一致正确的。

## Why this happens （为什么会发生呢）

> To understand this you need to know how the event loop handles tasks and microtasks. This can be a lot to get your head around the first time you encounter it. Deep breath…

译：为了理解这个你需要知道eventloop（事件循环机制）如何处理tasks（任务）和microitasks（微任务）。第一次听到这个概念可能会让你头皮发麻，深呼吸（<del>我呼吸啦，还是看不懂，有什么好说哒</del>）。

> Each ‘thread’ gets its own event loop, so each web worker gets its own, so it can execute independently, whereas all windows on the same origin share an event loop as they can synchronously communicate. The event loop runs continually, executing any tasks queued. An event loop has multiple task sources which guarantees execution order within that source (specs [such as IndexedDB](https://w3c.github.io/IndexedDB/#database-access-task-source) define their own), but the browser gets to pick which source to take a task from on each turn of the loop. This allows the browser to give preference to performance sensitive tasks such as user-input. Ok ok, stay with me…

译：每个线程都有自己的事件循环系统，所以每个web
worker（JavaScript下多线程的子线程）有自己的事件循环系统，他能独立地执行，鉴于所有的同源窗口共享一个事件循环，因此它们可以同步地通信。事件循环系统不断地运行，执行任何排进来的任务，一个事件循环有多个任务源，这些任务源保证了在该源中的执行顺序（就像IndexDB定义他们自己的（事件循环系统）规范），但是浏览器要去在每轮循环中选择哪一个源来获取任务。这允许了浏览器优先考虑表现敏感的任务，比如用户的输入。

> **Tasks** are scheduled so the browser can get from its internals into JavaScript/DOM land and ensures these actions happen sequentially. Between tasks, the browser may render updates. Getting from a mouse click to an event callback requires scheduling a task, as does parsing HTML, and in the above example, `setTimeout`.

译：任务被安排进来，浏览器便可以从它的内部进入JavaScript/DOM
并且确保这些行为可以按顺序执行。在任务之间，浏览器可能进行渲染更新。从一个鼠标的点击到一个事件的回调需要安排一个任务，就像解析html一样，对于以上的例子，对应`setTimeout`。

> `setTimeout` waits for a given delay then schedules a new task for its callback. This is why `setTimeout` is logged after `script end`, as logging `script end` is part of the first task, and `setTimeout` is logged in a separate task. Right, we’re almost through this, but I need you to stay strong for this next bit…

译：`setTimeout`函数等待一个指定的延迟后安排一个回调函数任务。这也就是为什么`setTimeout`打印在`script end`之后，因为打印`script end`是第一个任务的一部分，而打印`setTimeout`
在一个独立的任务中。ok，我们基本理解了这个Task这个概念，但是我建议你对接下来的内容保持专注。

> **Microtasks** are usually scheduled for things that should happen straight after the currently executing script, such as reacting to a batch of actions, or to make something async without taking the penalty of a whole new task. The microtask queue is processed after callbacks as long as no other JavaScript is mid-execution, and at the end of each task. Any additional microtasks queued during microtasks are added to the end of the queue and also processed. Microtasks include mutation observer callbacks, and as in the above example, promise callbacks.

译：微任务通常用来安排那些应该在当前正在执行的脚本之后直接发生的事情，比如对一批操作作出反应，或者使得某些操作不以一个新的任务（也就是上一段说到的情况）为代价异步执行。微任务队列在每个任务的结束阶段触发回调后被处理，只要没有其他的JavaScript脚本在执行中。任何额外的微任务在被添加进队列尾端排队处理。微任务包括变动观察者回调，对于以上的例子，对应promise的回调。

> Once a promise settles, or if it has already settled, it queues a microtask for its reactionary callbacks. This ensures promise callbacks are async even if the promise has already settled. So calling `.then(yey, nay)` against a settled promise immediately queues a microtask. This is why `promise1`and `promise2` are logged after script end, as the currently running script must finish before microtasks are handled. promise1 and promise2 are logged before setTimeout, as microtasks always happen before the next task.

译：一旦一个promise解决，或者如果它早已解决，它会以它的反应函数为一个微任务排进队列，这确保了promise的回调是异步，即使它是早已解决的。所以对一个已经解决的promise调用`.then(yey, nay)`
会立即地排一个微任务。这就是为什么`promise1`和`promise2`打印在`script end`之后，因为当前正在执行地脚本必须在微任务被处理之前完成。`promise1`和`promise2`打印在`setTimeout`
之后，因为微任务发生在下一个任务之前。

### What are some browsers doing differently?（为什么浏览器会有不同的反应）

> Some browsers log `script start`, `script end`, `setTimeout`, `promise1`, `promise2`. They’re running promise callbacks after `setTimeout`. It’s likely that they’re calling promise callbacks as part of a new task rather than as a microtask.

译：一些浏览器打印`script start`, `script end`, `setTimeout`, `promise1`, `promise2`。它们在`setTimeout`
之后执行promise的回调，这或许是以一个新的任务而不是以一个微任务来执行promise的回调。

> This is sort-of excusable, as promises come from ECMAScript rather than HTML. ECMAScript has the concept of “jobs” which are similar to microtasks, but the relationship isn’t explicit aside from [vague mailing list discussions](https://esdiscuss.org/topic/the-initialization-steps-for-web-browsers#content-16). However, the general consensus is that promises should be part of the microtask queue, and for good reason.

译：这是可以解释的，因为promise来自于ecma而不是html。ECMA中”job”的概念类似微任务，但是在vague mailing list
discussions的讨论中它们的关系是不是明确的在一边的。然而，一般的共识是promise是微任务队列的一部分，并且有充分的理由说明它。

> Treating promises as tasks leads to performance problems, as callbacks may be unnecessarily delayed by task-related things such as rendering. It also causes non-determinism due to interaction with other task sources, and can break interactions with other APIs, but more on that later.

译：将promise视为任务会导致表现的问题，因为回调会被和任务有关的事情比如渲染造成不必要的延迟。由于和其他的任务源有相互作用，并且可以中断和其他api的相互作用，也造成了不确定性。之后会介绍更多。

> Here’s [an Edge ticket](https://connect.microsoft.com/IE/feedback/details/1658365) for making promises use microtasks. WebKit nightly is doing the right thing, so I assume Safari will pick up the fix eventually, and it appears to be fixed in Firefox 43.

译：这是一个关于edge浏览器的ticket，关于让promise使用微任务的形式，WebKit不久便修复了它，所以我猜想Safari最终会修复（这个bug），它将在Firefox43被修复。

> Really interesting that both Safari and Firefox suffered a regression here that’s since been fixed. I wonder if it’s just a coincidence.

译：有趣的是，Safari和Firefox都遭遇过这个bug并且已经修复了，我怀疑这不仅仅是一个巧合。

## How to tell if something uses tasks or microtasks（如何知道是使用了任务还是微任务）

> Testing is one way. See when logs appear relative to promises &amp; `setTimeout`, although you’re relying on the implementation to be correct.

译：有一种方法可以测试，观察打印的日志对于promises和`setTimeout`的相对位置，不过应该依赖实现来判断才是正确的。

> The certain way, is to look up the spec. For instance, [step 14 of setTimeout](https://html.spec.whatwg.org/multipage/webappapis.html#timer-initialisation-steps) queues a task, whereas [step 5 of queuing a mutation record](https://dom.spec.whatwg.org/#queue-a-mutation-record) queues a microtask.

译：另一种方式，可以去查阅文档，比如，setTimeout在第14步排队进一个任务。而排队一个变化的记录的第5步为排队进一个微任务。

> As mentioned, in ECMAScript land, they call microtasks “jobs”. In [step 8.a of `PerformPromiseThen`](https://www.ecma-international.org/ecma-262/6.0/#sec-performpromisethen), `EnqueueJob` is called to queue a microtask.

译：就跟提及到的一样，在ecma的世界中，它们把微任务称为”jobs”。在`PerformPromiseThen`的第8.a步，`EnqueueJob`被称为排队一个微任务。

> Now, let’s look at a more complicated example. Cut to a concerned apprentice “No, they’re not ready!”. Ignore him, you’re ready. Let’s do this…

译：现在，我们看一个更复杂的例子。你可能会说：“我前面的还没理解，我还没有准备好”，忘却他，你已经准备好了，让我们开始…

## Level 1 bossfight（译不出来…）

> Before writing this post I’d have gotten this wrong. Here’s a bit of html:

译：在写这篇文章之前，我弄错了一件事。这是一段html代码。

```html

<div class="outer">
  <div class="inner"></div>
</div>
```

> Given the following JS, what will be logged if I click `div.inner`?

译：在下面这段js代码的执行下，当我点击`div.inner`的时候会打印什么？

```javascript
// Let's get hold of those elements
// 先获取这些元素
var outer = document.querySelector('.outer');
var inner = document.querySelector('.inner');

// Let's listen for attribute changes on the
// outer element
// 监听outer element的属性值变化。
new MutationObserver(function () {
    console.log('mutate');
}).observe(outer, {
    attributes: true
});

// Here's a click listener…
// 点击事件
function onClick() {
    console.log('click');

    setTimeout(function () {
        console.log('timeout');
    }, 0);

    Promise.resolve().then(function () {
        console.log('promise');
    });

    outer.setAttribute('data-random', Math.random());
}

// …which we'll attach to both elements
// 将点击事件应用到这两个元素上。
inner.addEventListener('click', onClick);
outer.addEventListener('click', onClick);
```

PS:
我自己猜的顺序是

click  
mutate  
promise  
timeout  
click  
mutate  
promise  
timeout

原文这里有个可以在线运行查看的框，有兴趣的可以自己去测试。

我在chrome81下测试的结果是

click  
promise  
mutate  
click  
promise  
mutate  
timeout  
timeout

> Was your guess different? If so, you may still be right. Unfortunately the browsers don’t really agree here:

译：和你想象的不同？如果是，你可能是对的。不幸的是，众多的浏览器可能不同意这种结果。

| Chrome                                             | Firefox                                            | Safari                                             | EDGE                                               |
|----------------------------------------------------|----------------------------------------------------|----------------------------------------------------|----------------------------------------------------|
| click <br>  promise <br> mutate <br> click <br> promise <br> mutate <br> timeout <br> timeout | click <br> mutate <br>  click <br> mutate <br> timeout <br> promise <br> promise <br>timeout | click <br> mutate <br> click <br> mutate <br> promise <br> promise <br> timeout <br> timeout | click <br> click <br> mutate <br> timeout <br> promise <br> timeout <br> promise |

## [](#Who’s-right-（谁是正确的？） "Who’s right?（谁是正确的？）")Who’s right?（谁是正确的？）

> Dispatching the ‘click’ event is a task. Mutation observer and promise callbacks are queued as microtasks. The `setTimeout` callback is queued as a task. So here’s how it goes:

译：分发点击事件是任务。Mutation observer和promise回调是排进微任务队列。`setTimeout`回调排进任务队列。所以它的工作应该是这样的。

这里有一个动画，有兴趣的可以去观看。结果为chrome的执行顺序。

> So it’s Chrome that gets it right. The bit that was ‘news to me’ is that microtasks are processed after callbacks (as long as no other JavaScript is mid-execution), I thought it was limited to end-of-task. This rule comes from the HTML spec for calling a callback:

译：所以是chrome的结果是正确的。这一段对于我来说新的东西为微任务可以在回调之后被处理（只要没有其他的JavaScript代码在执行中），我认为这种情况仅限于任务队列的末尾。这个规则来自html规范中的调用一个回调。

> > If [the stack of script settings objects](https://html.spec.whatwg.org/multipage/webappapis.html#stack-of-script-settings-objects) is now empty, [perform a microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint) — [HTML: Cleaning up after a callback](https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-a-callback) step 3

译：如果脚本设置对象的堆栈已经为空时，执行微任务检查点 - HTML：在会调用回调后进行清理的步骤3.

> …and a microtask checkpoint involves going through the microtask queue, unless we’re already processing the microtask queue. Similarly, ECMAScript says this of jobs:

译：一个微任务检查点需要通过微任务队列，除非我们早已处理微任务队列。与之类似地，ECMAScript中把这个说成jobs：

> Execution of a Job can be initiated only when there is no running execution context and the execution context stack is empty… — [ECMAScript: Jobs and Job Queues](https://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues)

译：一个job的执行可以被发起，只有当没有正在执行的上下文并且执行上下文的堆栈为空… - ECMAScript：Jobs and Job Queues

> …although the “can be” becomes “must be” when in an HTML context.

译：…尽管在HTML的上下文中“can be”变成了“must be”。

## What did browsers get wrong?（浏览器出了什么错误？）

> Firefox and Safari are correctly exhausting the microtask queue between click listeners, as shown by the mutation callbacks, but promises appear to be queued differently. This is sort-of excusable given that the link between jobs &amp; microtasks is vague, but I’d still expect them to execute between listener callbacks. [Firefox ticket](https://bugzilla.mozilla.org/show_bug.cgi?id=1193394). [Safari ticket](https://bugs.webkit.org/show_bug.cgi?id=147933).

译：Firefox和Safari正确地在点击事件用尽了微任务的队列，就跟mutation的回调一样，但是promise似乎有不同的排队顺序。这是稍微情有可原的，因为在jobs的定义和mircrotasks的定义之间的联系是模糊的，但我仍然期望在监听的回调之间执行。

> With Edge we’ve already seen it queue promises incorrectly, but it also fails to exhaust the microtask queue between click listeners, instead it does so after calling all listeners, which accounts for the single mutate log after both click logs. Bug ticket.

译：对于Edge我们早已发现它对promise的排队不正确，但它是未能在点击事件之间处理完微任务队列，而是在调用完所有的监听之后在处理微任务队列，即在打印完两个点击的log之后接着一个mutate的log。

## Level 1 boss’s angry older brother（不知道什么意思…）

> Ohh boy. Using the same example from above, what happens if we execute:

译：使用上面同样的例子，如果我们执行下面的代码，会发生什么：

```javascript
inner.click();
```

> This will start the event dispatching as before, but using script rather than a real interaction.

译：这会和之前一样开始事件的分发，但是使用脚本来执行而不是一个真实的互动。

| Chrome                                             | Firefox                                            | Safari                                             | EDGE                                               |
|----------------------------------------------------|----------------------------------------------------|----------------------------------------------------|----------------------------------------------------|
| click <br> click <br> promise <br> mutate <br> promise <br> timeout <br> timeout | click <br> click <br> mutate <br> timeout <br> promise <br> promise <br>timeout | click <br> click <br> mutate <br> promise <br> promise <br> timeout <br> timeout | click <br> click <br> mutate <br> timeout <br> promise <br> timeout <br> promise |

> And I swear I keep getting different results from Chrome, I’ve updated this chart a ton of times thinking I was testing Canary by mistake. If you get different results in Chrome, tell me which version in the comments.

译：我发誓我从chrome得到了不同的结果。我已经更新了很多次这个表格，以为一直测试出错。如果你在chrome中得到了不同的结果，可以在评论中告诉我并附上chrome的版本号。

## Why is it different?（为什么会不同）

PS：这里原文有个可操作动画。

> So the correct order is: `click`, `click`, `promise`, `mutate`, `promise`, `timeout`, `timeout`, which Chrome seems to get right.

译：所以正确的顺序是`click`, `click`, `promise`, `mutate`, `promise`, `timeout`, `timeout`，chrome似乎是正确的。

> After each listener callback is called…

译：在每一个监听回调都被调用之后…

> > If the stack of script settings objects is now empty, perform a microtask checkpoint — HTML: Cleaning up after a callback step 3

译：如果脚本设置对象的堆栈已经为空时，执行微任务检查点 - HTML：在会调用回调后进行清理的步骤3.

> Previously, this meant that microtasks ran between listener callbacks, but `.click()` causes the event to dispatch synchronously, so the script that calls `.click()` is still in the stack between callbacks. The above rule ensures microtasks don’t interrupt JavaScript that’s mid-execution. This means we don’t process the microtask queue between listener callbacks, they’re processed after both listeners.

译：之前，这意味着微任务在监听地回调之前运行，但是`.click()`这个操作造成了事件的同步分发，所以调用`.click()`
在回调之前仍然存在堆栈中。上面的规则确保了微任务不会打断执行中的JavaScript。这意味着我们不能处理微任务队列在监听回调之间，它们得在两个监听回调之后才能被处理。

## Does any of this matter?（这些情况有问题吗）

> Yeah, it’ll bite you in obscure places (ouch). I encountered this while trying to create a simple wrapper library for IndexedDB that uses promises rather than weird `IDBRequest` objects. It almost makes IDB fun to use.

译：emmm，可能会在晦涩的地方让你栽跟头。我遇到这种情况，当我尝试去创建一个简单包装的IndexedDB的js库，使用了promise而不是奇怪的IDBRequest对象。这几乎使得IDB使用起来很顺手。

> When IDB fires a success event, the related [transaction object becomes inactive after dispatching](https://w3c.github.io/IndexedDB/#fire-a-success-event) (step 4). If I create a promise that resolves when this event fires, the callbacks should run before step 4 while the transaction is still active, but that doesn’t happen in browsers other than Chrome, rendering the library kinda useless.

译：当IDB发射一个成功的事件时，相关的事物对象在分发后会变得不活跃（在步骤4）。如果我创建一个promise，当这个事件发射的时候resolve它，回调可以在第4步之前执行，这时的事务对象仍然活跃。但是那不能在chrome以外的浏览器中发生，使得这个js库有点没用。

> You can actually work around this problem in Firefox, because promise polyfills such as [es6-promise](https://github.com/jakearchibald/es6-promise) use mutation observers for callbacks, which correctly use microtasks. Safari seems to suffer from race conditions with that fix, but that could just be their [broken implementation of IDB](http://www.raymondcamden.com/2014/09/25/IndexedDB-on-iOS-8-Broken-Bad). Unfortunately, things consistently fail in IE/Edge, as mutation events aren’t handled after callbacks.

译：事实上你可以在Firefox中解决这个问题，因为promise的polyfills（低版本浏览器实现）使用了可变观察者作为回调，这个实现正确使用了微任务。对于这个修复，Safari好像会有竞争问题，但是那存在于它们的坏的IDB的实现中。不幸的是，这个修复在IE/Edge中一致失败，因为可变的事件在回调之后不被处理。

> Hopefully we’ll start to see some interoperability here soon.

译：希望我们可以很快找到这里面的一些互通性。

## You made it!（你做到了！）

> In summary:
>
> * Tasks execute in order, and the browser may render between them
> * Microtasks execute in order, and are executed:
    >

* after every callback, as long as no other JavaScript is mid-execution

> * at the end of each task

译：

综上所属：

* 任务按顺序执行，浏览器可能在它们之间渲染
* 微任务按顺序执行
    * 在每一个回调之后执行，只有没有其他的JavaScript在执行中时。
    * 在每一个任务的最后。

> Hopefully you now know your way around the event loop, or at least have an excuse to go and have a lie down.

译：希望你现在可以以你的方式理解事件循环，或者至少有一个借口去躺下（？？？）。

> Actually, is anyone still reading? Hello? Hello?

译：实际上，有人读到这里了吗，hello？hello？

# 后记

还是挺有意思的，虽然有些地方翻译起来怪怪的，并且有些指向链接已经失效了，但是单纯的在这篇文章还是能学到很多有趣的知识的。

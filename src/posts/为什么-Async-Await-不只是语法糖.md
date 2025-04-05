---
title: 为什么 Async/Await 不只是语法糖
tags:
  - JavaScript
  - Async/Await
  - Promise
categories:
  - 译文
key: 1677484217date: 2023-02-27 15:50:17
updated: 2023-02-27 15:50:17
---

# 前言

原文地址：[Why Async/Await Is More Than Just Syntactic Sugar](https://www.zhenghao.io/posts/await-vs-promise)

<!-- more -->

# 正文

本文主要是我对 async/await 对比 Promise 的一些见解。

尽管网络上已经存在了许许多多的关于 `async/await` 对比 `Promise` 的文章，但是都有很多值得改进的地方，所以我就自己写了一篇。

在这篇文章中，我关注的点是 `async/await` 不仅仅是 `Promise` 之上的语法糖，因为 `async/await` 确实提供了显著的好处。

- `async/await` 允许我们去使用那些在同步程序中可用的所有的语法，从而我们能写出更加有表现力和更加可读的代码。
- `async/await` 统一了异步编程的经验。
- `async/await` 提供了更好的错误堆栈跟踪信息。

> 这篇文章假定读者有关于 `Promise` 和 `async/await` 的基础知识。本文并不是类似 [MDN](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous) 和 [javascript.info](https://javascript.info/promise-basics) 的基础教程。

## 在 JavaScript 中关于异步编程的一小部分历史

异步编程在 JavaScript 中很常见。每当我们需要调用一个 web 服务，或者进行文件访问，或者进行数据库操作，尽管语言本身是单线程的，但是异步特性却能够让我们防止 UI 被阻塞。

在 ES2015（ES6） 对 JavaScript 进行重大升级之前，解决异步编程的方式是回调。我们表达时间依赖（即异步操作的执行顺序）的唯一方法是将一个回调嵌套在另一个回调中。这会导致所谓的[回调地狱](http://callbackhell.com/)。

> reddit 上的一位用户 [@theQuandary](https://www.reddit.com/r/javascript/comments/wmpdsu/comment/ik2cnoh/?utm_source=share&utm_medium=web2x&context=3) 指出，在 ES6 之前，在 JavaScript 中异步编程有比回调更好的其他可选择的方式。很抱歉这里不是 100% 确定，因为我没有亲自经历过这段历史。

在 ES2015， JavaScript 引入了 `Promise` 。对于异步操作来说它是最优的对象，我们可以很简单地使用它来进行传递，组合，聚合以及应用变换操作。时间依赖也可以通过链式调用 `then` 方法来清晰地表达。

{% details 更多历史... %}
在 JavaScript 中引入 `Promise` 的点子并不是独创的。它是受到一个年代非常久远的语言—— [E 语言](http://wiki.erights.org/wiki/Promise)所启发的。 E 语言的创造者 [Mark Miller](https://twitter.com/marksammiller) 也是 [TC39 的成员](https://tc39wiki.calculist.org/about/people/)。 `async/await` 语法也借鉴了 [C#](https://docs.microsoft.com/en-us/dotnet/csharp/async) 。
{% enddetails %}

随着 `Promise` 成为一个强大的原始对象，这似乎意味着在 JavaScript 中异步编程已经被解决了，是这样吗？

这不一定，因为有些时候使用 `Promise` 会让代码看起来很低级

## 有些时候使用 Promise 会让代码看起来很低级

尽管 Promise 有优点，但是在 JavaScript 中需要一个更加高级的语法来处理异步编程。

我们可以考虑如下的例子，我们需要一个函数来延迟的轮询某个接口。如果轮询次数达到给定最大值，那么以 `null` 值来解决（resolve）这个 Promise 对象

下面是一个使用 `Promise` 的可能的解决方法

```javascript
let count = 0;

function apiCall() {
  return new Promise((resolve) =>
    // 重试到第六次时，用字符串 'value' 来解决这个 Promise
    count++ === 5 ? resolve('value') : resolve(null)
  );
}

function sleep(interval) {
  return new Promise((resolve) => setTimeout(resolve, interval));
}

function poll(retry, interval) {
  return new Promise((resolve) => {
    // 为了简洁，这里跳过对错误的处理
    if (retry === 0) resolve(null);
    apiCall().then((val) => {
      if (val !== null) resolve(val);
      else {
        sleep(interval).then(() => {
          resolve(poll(retry - 1, interval));
        });
      }
    });
  });
}

poll(6, 1000).then(console.log); // 输出 'value'
```

这段逻辑的直觉性和可读性取决于阅读到该段代码的人对 `Promise` 的熟练程度，需要明白 `Promise.prototype.resolve` 是如何“扁平化” `Promise` 以及明白递归调用过程。对于我来说，写出这样一个函数，它的可读性并不是最好的。

{% details 可以通过 <code>setInterval</code> 来实现 %}

函数几乎都可以以另一种方式来编写。这是我的一个朋友 [James](https://twitter.com/jrsinclair) 编写的使用了 `setInterval` 的方式。

```javascript
const pollInterval = (retry, interval) => {
  return new Promise((resolve) => {

    let intervalToken, timeoutToken;

    intervalToken = setInterval(async () => {
      const result = await apiCall();
      if (result !== null) {
        clearInterval(intervalToken);
        clearTimeout(timeoutToken);
        resolve(result);
      }
    }, interval);

    timeoutToken = setTimeout(() => {
      clearInterval(intervalToken);
      resolve(null);
    }, retry * interval);
  });
};
```
{% enddetails %}

## 引入 async/await

我们可以用 `async/await` 语法来重写上面的函数

```javascript
async function poll(retry, interval) {
  while (retry >= 0) {
    const value = await apiCall().catch((e) => {}); // 为了简洁跳过错误处理
    if (value !== null) return value;
    await sleep(interval);
    retry--;
  }

  return null;
}
```

我想很多人会觉得上面的代码可读性更高，因为我们能够使用所有的常见的语法来处理异步操作，比如循环、 `try-catch` 。

{% details 递归方式 %}
然而，这并不是严格意义上的苹果与苹果的比较，因为我选择了一个递归解法来对比迭代解法。我们可以用递归重写上面的代码：

```javascript
const pollAsyncAwait = async (retry, interval) => {
    if (retry < 0) return null;

    const value = await apiCall().catch((e) => {}); // 为了简洁跳过错误处理
    if (value !== null) return value;

    await sleep(interval);
    return pollAsyncAwait(retry - 1, interval);
};
```
{% enddetails %}

这可能就是 `async/await` 的最大卖点 - 允许你以看起来同步的方式来编写异步代码。另一方面，这也可能是对 `async/await` 最常见的反对意见，关于这个话题，之后会聊到。

顺带一提， `await` 甚至有正确的[运算符优先级](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)，这意味着 `await a + await b` 表示 `(await a) + (await b)` ，而不是 `await (a + await b)` 。

## async/await 对同步和异步代码都提供了统一的经验

另一个 `async/await` 的优点是 `await` 会自动地把任何非 `Promise` （即没有 `thenable` 接口）对象 包装成 `Promise` 。 语义上 `await` 相当于 `Promise.resolve` ，这意味着你可以 `await` 任何东西

```javascript
function fetchValue() {
  return 1;
}

async function fn() {
  const val = await fetchValue();
  console.log(val); // 1
}

// 👆 上面的代码相当于下面的代码

function fn() {
  Promise.resolve(fetchValue()).then((val) => {
    console.log(val); // 1
  });
}
```

{% details 注意这是一个浏览器相关的行为... %}
把 `await foo` 和 `Promise.resolve(foo).then(...)` 画上等号并不是 100% 正确的。

在 Chrome 73 之前， ECMA 规范把 `await foo` 转化为 `new Promise(resolve => resolve(p))` 。之后在这个 [PR](https://github.com/tc39/ecma262/pull/1250) 里修改了规范里的一处地方。但是直到现在，不是每个浏览器都遵守规范中的改变；截至本文编写之日， Safari 依然没有实现更新过后的规范。结果就是，在 Safari 和 Chrome 分别执行[这段代码段](https://gist.github.com/zhenghaohe/c90ec960b890eca60b7bd8008f856a70)会产生不同的结果。
{% enddetails %}

如果我们直接调用 `fetchValue` 返回的数字 `1` 的 `then` 方法，就会产生如下错误：

```javascript
function fetchValue() {
  return 1;
}

function fn() {
  fetchValue().then((val) => {
    console.log(val);
  });
}

fn(); // ❌ Uncaught TypeError: fetchValue(...).then is not a function
```

最终，`async` 函数返回的任何东西都总是是一个 `Promise` ：

```javascript
Object.prototype.toString.call((async function () {})()); // '[object Promise]'
```

## async/await 提供了更好的错误堆栈跟踪

V8 工程师 [Mathias](https://twitter.com/mathias) 写了一篇 [异步堆栈跟踪信息：为什么 await 胜过 Promise#then()](https://mathiasbynens.be/notes/async-stack-traces) 的文章，介绍了相比 `Promise` ，在 `async/await` 下为什么引擎可以更好地捕获和存储堆栈跟踪信息。

这里有一个例子：

```javascript
async function foo() {
  await bar();
  return 'value';
}

function bar() {
  throw new Error('BEEP BEEP');
}

foo().catch((error) => console.log(error.stack));

// Error: BEEP BEEP
//     at bar (<anonymous>:7:9)
//     at foo (<anonymous>:2:9)
//     at <anonymous>:10:1
```

`async` 版本正确地捕获了错误堆栈的跟踪信息。

我们再来看一下 `Promise` 的版本：

```javascript
function foo() {
  return bar().then(() => 'value');
}

function bar() {
  return Promise.resolve().then(() => {
    throw new Error('BEEP BEEP');
  });
}

foo().catch((error) => console.log(error.stack));
// Error: BEEP BEEP  at <anonymous>:7:11
```

堆栈跟踪信息丢失了。把箭头函数改为具名函数，这种情况可以得到改善，但是仍然不够好：

```javascript
function foo() {
  return bar().then(() => 'value');
}

function bar() {
  return Promise.resolve().then(function thisWillThrow() {
    throw new Error('BEEP BEEP');
  });
}

foo().catch((error) => console.log(error.stack));

// Error: BEEP BEEP
//    at thisWillThrow (<anonymous>:7:11)
```

## 对 async/await 普遍的反对意见

我有了解到对 `async/await` 的两种普遍的反对意见。

其一，当调用一个不必顺序执行的独立的异步函数时，即可以通过 `Promise.all` 正确地被处理时（如果我们使用宽松的术语的话，也可以叫做“并行”）， `async/await` 会成为一个自废武功的设计。

这会让开发者对异步编程浅尝辄止，无法真正地了解 `Promise` 在幕后的工作原理。

其二，这部分有些细微的差别。一些[函数式编程热衷者](https://dev.to/jesterxl/why-i-don-t-use-async-await-4amc)认为 `async/await` 会导致命令式编程。根据一位函数式开发者的观点，能够使用循环和 `try catch` 并不是好事，因为这些语法意味着副作用，并且鼓励不够理想的错误处理。

我赞同这个论点。函数式开发者理所当然地关心他们所写程序的确定性。他们对自己的代码要有绝对的把握权。为了达到这个目的，引入一个带有类似 [Result](https://folktale.origamitower.com/api/v2.3.0/en/folktale.result.html) 类型的复杂的类型系统也是合理的。但我不认为 `async/await` 和函数式编程之间互相矛盾。我的朋友 [James](https://twitter.com/jrsinclair) ，一个熟练的函数式编程开发者，他说在 Haskell 语言中存在一个和 `async/await` 相等的特性 - [Do 符号](https://wiki.haskell.org/Keywords#do)特性。

无论如何，我认为大多数人，包括我，函数编程只是一个后天养成的爱好（尽管我确实认为函数编程非常的酷，并且我也在慢慢地学习它）。由 `async/await` 提供的正常的控制流声明以及 `try catch` 的错误处理流程，对我们来说是极其有用的，在 JavaScript 中我们可以用它来编排复杂的异步操作。这正是为什么我说 “ `async/await` 只是一个语法糖” 这种说法是不够准确的。

## 延伸阅读

- [如何顺序或者并行执行 async 函数](https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/)。
- 标题使用的“语法糖”这几个字在 Reddit 上也引发了一场有趣的[讨论](https://www.reddit.com/r/javascript/comments/wnli3o/on_syntactic_sugar/)
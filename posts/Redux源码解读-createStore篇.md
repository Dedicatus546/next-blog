---
title: Redux源码解读 - createStore篇
key: 1594264553date: 2020-07-09 11:15:53
updated: 2023-02-13 18:28:45
tags:
  - Redux
  - JavaScript
categories:
  - 编程
---


`Redux`源码解读 - `createStore`篇

<!-- more -->

# `Redux`

什么是`Redux`？

> `Redux`是`JavaScript`状态容器，提供可预测化的状态管理。

相关的概念可以看`Redux`的中文网 [Redux 中文文档](https://www.redux.org.cn/)。

我自己的理解是，`Redux`规范了对数据的更改流程，使得数据可跟踪。

在`Redux`，有三个概念性的东西：

- `Store`：储存数据的容器；
- `Action`：请求改变数据的动作；
- `Reducer`：对请求的动作进行处理。

在`Redux`中，如果你想要改变数据，你不能直接对状态进行操作，而是要通过动作，也就是`Action`来表明你的意图。

这里从网上看到一张图方便理解：

![](https://i.loli.net/2020/07/09/BDgatHJfNlCLsv9.png)

ok，先来使用`Redux`，来看看他到底是何方圣神

```javascript
const { createStore } = require("redux");

// Action 动作
const ACTION = {
  INCREMENT: "INCREMENT",
  DECREMENT: "DECREMENT",
};

// Reducer 定义如何处理动作
const reducer = (state, action) => {
  switch (action.type) {
    case ACTION.INCREMENT:
      return {
        ...state,
        val: state.val + 1,
      };
    case ACTION.DECREMENT:
      return {
        ...state,
        val: state.val - 1,
      };
    default:
      return state;
  }
};

// Store 存放数据的中心
const store = createStore(reducer, { val: 1 });

// 观察者订阅，数据发生变化的时候打印
store.subscribe(() => {
  console.log(store.getState());
});

// 请求动作
store.dispatch({
  type: ACTION.INCREMENT,
});
```

`Reducer`对不同的动作来生成新的状态。

`createStore`根据`Reducer`来生成一个数据中心，这个数据中心可以订阅数据变化，可以进行动作的分发。

思想感觉还挺好理解的，不过对于这样写的好处，我还是有点蒙的，可能内功不够吧...

不过也不打紧，分析源码学习学习，和这些关系应该不大。

# `createStore`

这次就来看看`createStore`函数是如何运作的。

```javascript
export default function createStore(reducer, preloadedState, enhancer) {
  // ... 省略了一些参数的验证。

  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function getState() {
    return currentState;
  }

  function subscribe(listener) {
    let isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      isSubscribed = false;
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }

  function dispatch(action) {
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
    return action;
  }

  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.REPLACE });
  }

  function observable() {
    const outerSubscribe = subscribe;
    return {
      subscribe(observer) {
        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }
        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return { unsubscribe };
      },
      [$$observable]() {
        return this;
      },
    };
  }

  dispatch({ type: ActionTypes.INIT });

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable,
  };
}
```

PS：这里我省略了一些参数的验证的代码，我个人认为刚开始读可以忽略一些不是特别重要的东西，抓住重点读才能学到东西（应该...

直接看整个函数的返回，发现它返回了一个对象，这个对象的属性都是一些方法。

- `dispatch`
- `subscribe`
- `getState`
- `replaceReducer`
- `[$$observable]`

函数的开头定义了一些变量。

```javascript
let currentReducer = reducer; // 传进来的reducer
let currentState = preloadedState; // 传进来的初始状态
let currentListeners = []; // 观察者函数回调函数的集合
let nextListeners = currentListeners; // currentListeners的浅拷贝
let isDispatching = false; // 是否正在处理Action
```

那我们就一个一个看

## `getState`

这个函数最为的简单，函数返回当前的状态对象。
完整的代码如下

```javascript
function getState() {
  if (isDispatching) {
    throw new Error(
      "You may not call store.getState() while the reducer is executing. " +
        "The reducer has already received the state as an argument. " +
        "Pass it down from the top reducer instead of reading it from the store."
    );
  }

  return currentState;
}
```

先通过一个标志的变量`isDispatching`来判断当前是否正在分发`action`

如果是的话，那么这时的`state`就是不确定的，所以不能被获取。

## `subscribe`

这个函数主要传入一个函数，在状态对象发生改变的时候会触发传入函数的执行。

```javascript
function subscribe(listener) {
  if (typeof listener !== "function") {
    throw new Error("Expected the listener to be a function.");
  }

  if (isDispatching) {
    throw new Error(
      "You may not call store.subscribe() while the reducer is executing. " +
        "If you would like to be notified after the store has been updated, subscribe from a " +
        "component and invoke store.getState() in the callback to access the latest state. " +
        "See https://redux.js.org/api-reference/store#subscribelistener for more details."
    );
  }

  let isSubscribed = true;

  ensureCanMutateNextListeners();
  nextListeners.push(listener);

  return function unsubscribe() {
    if (!isSubscribed) {
      return;
    }

    if (isDispatching) {
      throw new Error(
        "You may not unsubscribe from a store listener while the reducer is executing. " +
          "See https://redux.js.org/api-reference/store#subscribelistener for more details."
      );
    }

    isSubscribed = false;

    ensureCanMutateNextListeners();
    const index = nextListeners.indexOf(listener);
    nextListeners.splice(index, 1);
    currentListeners = null;
  };
}
```

函数先对参数`listener`进行验证，必须是一个函数才能执行下面的逻辑。

然后判断是否处于`dispatch`的执行过程，如果是也不行，因为会造成二义性。这个加入的回调函数到底要不要执行。

定义了一个变量`isSubscribed`表示是否订阅。

然后接下来执行`ensureCanMutateNextListeners`函数。

```javascript
function ensureCanMutateNextListeners() {
  if (nextListeners === currentListeners) {
    // 浅拷贝一份
    nextListeners = currentListeners.slice();
  }
}
```

为什么要通过`nextListeners`和`currentListeners`来维护订阅的列表呢

我们可以用以下代码来解释，这里我写了一个简单的发布订阅代码来作例子

```javascript
const subscribes = []; //订阅的回调数组

// 订阅函数
const subscribe = (callback) => {
  // 添加到数组中
  subscribes.push(callback);
  // 返回一个取消订阅的函数
  return () => {
    const index = subscribes.indexOf(callback);
    subscribes.splice(index, 1);
  };
};

// 通知函数
const notify = () => {
  for (let i = 0; i < subscribes.length; i++) {
    subscribes[i]();
  }
};

let un1, un2;

un1 = subscribe(() => {
  console.log("1");
  un2 = subscribe(() => {
    console.log("2");
  });
});

notify();
```

这段函数有意思的点就在于在一个订阅的回调中又添加了一个订阅

这样写有啥问题呢，运行起来也是输出了 1 和 2，感觉上并没有什么不对的

但是如果`notify`函数写法稍微变一下那么问题就出现了

```javascript
const len = subscribes.length;
const notify = () => {
  for (let i = 0; i < len; i++) {
    subscribes[i]();
  }
};
```

先保存了回调数组的长度，这样回调中如果订阅了新的回调。

那么就不会触发这个新的回调。

这就会导致逻辑上的混乱。

在`Redux`中，解决的办法就是把在回调中的订阅延迟到下一个状态改变时再触发。

在`subscribe`的逻辑中，都是使用了`nextListeners`这个变量。

而在`dispatch`函数中使用的是`currentListeners`这个变量。

```javascript
const listeners = (currentListeners = nextListeners);
for (let i = 0; i < listeners.length; i++) {
  const listener = listeners[i];
  listener();
}
```

在回调前把`nextListeners`赋给`currentListeners`。

这样如果在回调中产生了新的订阅或者取消订阅的话。

就会执行`ensureCanMutateNextListeners`函数。

而这个函数很简单，如果`nextListeners`和`currentListeners`相等，就把浅拷贝一份`currentListeners`赋给`nextListeners`。

这样就避免了逻辑的混乱。

`subscribe`返回了一个函数，这个函数的作用就取消订阅。

和订阅一样，如果在回调中取消了订阅，都会延迟到下一次状态变化再执行。

## `dispatch`

```javascript
function dispatch(action) {
  if (!isPlainObject(action)) {
    throw new Error(
      "Actions must be plain objects. " +
        "Use custom middleware for async actions."
    );
  }

  if (typeof action.type === "undefined") {
    throw new Error(
      'Actions may not have an undefined "type" property. ' +
        "Have you misspelled a constant?"
    );
  }

  if (isDispatching) {
    throw new Error("Reducers may not dispatch actions.");
  }

  try {
    isDispatching = true;
    currentState = currentReducer(currentState, action);
  } finally {
    isDispatching = false;
  }

  const listeners = (currentListeners = nextListeners);
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    listener();
  }

  return action;
}
```

第一个判断`action`必须是一个字面对象。

可以看下`isPlainObject`的逻辑。

```javascript
export default function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null) return false;

  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}
```

先用简单的`typeof`操作符来判断，顺便把`null`的情况也给排除出去。

接下来就是要排除那些自定义的构造函数所产生的对象。

`Object.getPrototypeOf`获取一个对象的原型。

通过`while`循环不断遍历原型链，直到最顶端的原型。

排除的依据就是如果原型链上出现了除了`Object.prototype`之外的原型，就返回`false`。

```javascript
if (typeof action.type === "undefined") {
  throw new Error(
    'Actions may not have an undefined "type" property. ' +
      "Have you misspelled a constant?"
  );
}
```

接下来判断了`action`的`type`属性，他不能是`undefined`。

```javascript
if (isDispatching) {
  throw new Error("Reducers may not dispatch actions.");
}
```

然后如果前一个`dispatch`还在执行，那么本次的`dispatch`就会失败。保证不会出现竟态。

接下来就是更新`state`的过程。

```javascript
try {
  isDispatching = true;
  currentState = currentReducer(currentState, action);
} finally {
  isDispatching = false;
}
```

用`isDispatching`这个标志变量保证执行`reducer`时其他操作的限制。

最后就是触发订阅的回调函数，返回`action`对象了。

```javascript
const listeners = (currentListeners = nextListeners);
for (let i = 0; i < listeners.length; i++) {
  const listener = listeners[i];
  listener();
}

return action;
```

## `replaceReducer`

```javascript
function replaceReducer(nextReducer) {
  if (typeof nextReducer !== "function") {
    throw new Error("Expected the nextReducer to be a function.");
  }

  currentReducer = nextReducer;

  dispatch({ type: ActionTypes.REPLACE });
}
```

这个函数作用就是替换新的`reducer`处理函数。

## `[$$observable]`

`[$$observable]`也就是内部的`observable`函数

```javascript
function observable() {
  const outerSubscribe = subscribe;
  return {
    subscribe(observer) {
      if (typeof observer !== "object" || observer === null) {
        throw new TypeError("Expected the observer to be an object.");
      }

      function observeState() {
        if (observer.next) {
          observer.next(getState());
        }
      }

      observeState();
      const unsubscribe = outerSubscribe(observeState);
      return { unsubscribe };
    },

    [$$observable]() {
      return this;
    },
  };
}
```

这个函数作用就是适配观察者的其他实现。

返回的对象中`subscribe`方法可以传入一个观察者。

在内部中构造了一个`observeState`方法，并且`store`订阅了这个方法。

而这个方法的内容就是调用传入的`observer`对象调用他的`next`方法，仅此而已。

简单点讲就是传递变化后的数据。

比如使用`Rxjs`的话，可以这么写：

```javascript
const store = //...

const observable = Observable.create(observer => {
  const unsubscribe = store.observable().subscribe(observer);
});

observable.subscribe(state => {
    console.log(state); // 每次状态改变，这里就会执行
});
```

ok，`createStore`这个函数基本上就看完了。

剩下开头的一些判断。

```javascript
// 防止传入多个enhancer
if (
  (typeof preloadedState === "function" && typeof enhancer === "function") ||
  (typeof enhancer === "function" && typeof arguments[3] === "function")
) {
  throw new Error(
    "It looks like you are passing several store enhancers to " +
      "createStore(). This is not supported. Instead, compose them " +
      "together to a single function."
  );
}

// 只传入enhancer的情况
if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
  enhancer = preloadedState;
  preloadedState = undefined;
}

// enhancer必须是一个函数
if (typeof enhancer !== "undefined") {
  if (typeof enhancer !== "function") {
    throw new Error("Expected the enhancer to be a function.");
  }

  return enhancer(createStore)(reducer, preloadedState);
}

// reducer必须是一个函数
if (typeof reducer !== "function") {
  throw new Error("Expected the reducer to be a function.");
}
```

以及在返回值的上方，会在内部先执行一次`dispatch`来设置默认的`state`。

```javascript
dispatch({ type: ActionTypes.INIT });
```

如果没在第二个参数指定默认值的话，可以在`reducer`函数里面设置默认值。

```javascript
const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case ...
    case ...
    default:
      return state;
  }
};
```

通过`createStore`传入的初始`state`优先级是比在`reducer`中要高的。

因为在函数的开头定义的内部变量中，`currentState`会保存`preloadedState`的值。

```javascript
let currentState = preloadedState;
```

而通过函数参数的默认值只有在`currentState`为`undefined`时才会触发。

文章参考了网上的一些文章，在此非常感谢。

- [Redux 中文文档](https://www.redux.org.cn/)
- [RxJS 中文文档](https://cn.rx.js.org/)
- [Redux:自问自答](https://segmentfault.com/a/1190000010263353)
- [实现一个迷你 Redux（基础版）](https://juejin.im/post/5e9ab69e51882573a855c6f3)

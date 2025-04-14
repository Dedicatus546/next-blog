---
title: Redux源码解读 - bindActionCreators篇（完结）
key: 1594519461date: 2020-07-12 10:04:21
updated: 2023-02-13 18:28:45
tags:
  - JavaScript
  - Redux
categories:
  - 编程
---


`Redux`源码解读 - `bindActionCreators`篇（完结）

<!-- more -->

# `bindActionCreators`

这个函数的主要作用，就是包装`action`的创建，并且和`dispatch`进行结合

可以举个例子来看看它的用法

```javascript
const reducer = (state = { val: 10 }, action) => {
  switch (action.type) {
    case "increment":
      return {
        ...state,
        val: state.val + action.val,
      };
    case "decrement":
      return {
        ...state,
        val: state.val - action.val,
      };
    default:
      return state;
  }
};

const store = createStore(reducer);

const incrementAction = (val) => {
  return {
    type: "increment",
    val,
  };
};

const decrementAction = (val) => {
  return {
    type: "decrement",
    val,
  };
};

// action创建函数和dispatch结合
const execAction = bindActionCreators(
  {
    incrementAction,
    decrementAction,
  },
  store.dispatch
);

console.log(execAction);

store.subscribe(() => {
  console.log(`当前state：${store.getState().val}`);
});

execAction.incrementAction(10);
execAction.decrementAction(5);
```

运行之后就可以看到效果：

![](https://i.loli.net/2020/07/12/RYKAW2lBxXEOG7L.png)

通过包装，可以以一个函数来完成`action`的创建和分发。

在中文文档中，指出来这样做的好处（结合`React`）。

> 惟一会使用到`bindActionCreators`的场景是当你需要把`action creator`往下传到一个组件上，却不想让这个组件觉察到`Redux`的存在，而且不希望把`dispatch` 或`Redux store`传给它。

意思上大致是，对于一个纯组件，不应该明确地感知到`Redux`，通过`bindActionCreators`包装可以向纯组件传入一个函数来完成功能，而不是在纯组件中使用到`dispatch`函数和`action`对象。

ok，先贴上源码，其实这个函数并不难，比前面三个容易理解多了。

```javascript
export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? "null" : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    );
  }

  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}
```

这个函数支持两种传入的方式，一种是传入一个函数，一种是传入一个对象，这个对象的键的值为一个函数。

即在例子中的代码：

```javascript
const execAction = bindActionCreators(
  {
    incrementAction,
    decrementAction,
  },
  store.dispatch
);
```

可以写为

```javascript
const execIncrementAction = bindActionCreators(incrementAction, store.dispatch);
const execDecrementAction = bindActionCreators(decrementAction, store.dispatch);
```

这两者的效果完全一样。

```javascript
if (typeof actionCreators === "function") {
  return bindActionCreator(actionCreators, dispatch);
}
```

函数开始的判断就是对应第一种情况，只传入一个函数。

可以看到直接返回了一个`bindActionCreator`的函数。

```javascript
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments));
  };
}
```

这个函数也非常的简单，返回了一个函数，这个函数就是`dispatch`一个`action`。

而`action`参数通过传入的`actionCreator`函数来创建。

传入`actionCreator`的参数就是返回函数的参数列表。

也就是：

```javascript
execAction.incrementAction(10); //这里的10就会传给actionCreator函数
```

接下来又进行了一次判断：

```javascript
if (typeof actionCreators !== "object" || actionCreators === null) {
  throw new Error(
    `bindActionCreators expected an object or a function, instead received ${
      actionCreators === null ? "null" : typeof actionCreators
    }. ` +
      `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
  );
}
```

如果不是`object`或者传了个空进来的话，直接报错。

```javascript
const boundActionCreators = {};
for (const key in actionCreators) {
  const actionCreator = actionCreators[key];
  if (typeof actionCreator === "function") {
    boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
  }
}
```

最后这段代码就对应第二种情况，传入一个对象。

通过`for-in`循环，把值为函数的挑出来，然后使用第一种情况，存在一个`boundActionCreators`对象里。

最后返回`boundActionCreators`对象。

这个函数就是这么通俗易懂。

至此`Redux`的源码已经讲完啦。

个人感觉上还行，基本上都能搞懂。

---
title: Redux源码解读 - applyMiddleware篇
key: 1594357803date: 2020-07-10 13:10:03
updated: 2023-02-13 18:28:45
tags: 
 - JavaScript  
 - Redux
categories:
 - 编程
---


`Redux`源码解读 - `applyMiddleware`篇

<!-- more -->

# `applyMiddleware`

先把源码贴出来：

```javascript
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
```

刚开始我以为这函数这么短应该会很简单。

但是到后面和`createStore`函数结合的时候我才发现比`createStore`难多了。

主要是函数嵌套会有点晕（套，就嗯套）。

先说说这个东西的作用。

有些时候，我们想在每一次的状态变化之前，变化之后处理一些和业务无关的逻辑操作，比如写写日志。

那么我们可能会这样写。

```javascript
const store = //...

// 某个业务
function fn() {
  console.log(store.getState());
  store.dispatch({type:TYPE});
  console.log(store.getState());
}

fn();
```

但是这样写有一个问题，就是他耦合了业务函数`fn`。

试想下如果我们在`100`个业务函数中都这样写，有问题吗？

写当然没有问题，但是如果某一天要求在`dispatch`前打印下时间，那就完蛋了，要改`100`个地方，而且这`100`个函数还分布在不同的文件里。

正所谓，复制黏贴一时爽，需求一变火葬场。

所以`applyMiddleware`这个API就是为了解决这样的问题而出现的。

`middleware`单词意思为中间件，简单点讲就是可以通过外部代码来增强内部的逻辑。

如果以我们的想法，可能会这么写：

```javascript
const store = //...

const dispatch = store.dispatch;

store.dispatch = (action) => {
  console.log(store.getState());
  const newAction = store.dispatch(action);
  console.log(store.getState());
  return newAction;
}

store.dispatch({type:TYPE});
```

这就是增强`dispatch`方法来实现额外的逻辑，不会耦合在业务里面。

而`applyMiddleware`也是通过增强`dispatch`来实现额外的逻辑。

不过`applyMiddleware`支持多中间件，这个可以从它的参数看出来。

举个使用`applyMiddleware`的小例子，就以状态改变前后输出日志为例。

```javascript
const reducer = (state = 0, action) => {
  switch (action.type) {
    case "add":
      return state + 1;
    case "delete":
      return state - 1;
    default:
      return state;
  }
};

// 定义了一个打印日志的中间件
const loggerMiddleware = (middlewareAPI) => {
  return (dispatch) => {
    return (action) => {
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      let newAction = dispatch(action);
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      return newAction;
    };
  };
};

const store = createStore(
  reducer,
  // 用`applyMiddleware`包裹中间件和reducer一起传入createStore中
  applyMiddleware(loggerMiddleware)
);

store.dispatch({
  type: "add"
});
```

当我们执行上面的代码时，会打印：

![](https://i.loli.net/2020/07/10/SnGHxR4OQVvkNBz.png)

当然也可以用两个中间件：

```javascript
const reducer = (state = 0, action) => {
  switch (action.type) {
    case "add":
      return state + 1;
    case "delete":
      return state - 1;
    default:
      return state;
  }
};

// 定义了一个打印日志的中间件
const loggerMiddleware = (middlewareAPI) => {
  return (dispatch) => {
    return (action) => {
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      let newAction = dispatch(action);
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      return newAction;
    };
  };
};

// 定义了一个打印时间的中间件
const timeMiddleware = (middlewareAPI) => {
  return (dispatch) => {
    return (action) => {
      console.log('time');
      let newAction = dispatch(action);
      return newAction;
    };
  };
};


const store = createStore(
  reducer,
  // 用`applyMiddleware`包裹中间件和reducer一起传入createStore中
  applyMiddleware(loggerMiddleware, timeMiddleware)
);

store.dispatch({
  type: "add"
});
```

运行之后就会出现：

![](https://i.loli.net/2020/07/10/LZdkCfrsgQyvwaG.png)

ok，开始分析源码。

`applyMiddleware`函数传入中间件的数组，然后直接返回了一个函数。

返回的函数传入了一个`createStore`，也就是我们上篇帖子说的函数。

```javascript
return createStore => (...args) => { 
  // 主体逻辑
}
```

源代码这样写可能看着晕，完全可以把它拆开。

```javascript
return createStore => {
  return (...arg) =>{
    // 主体逻辑
  }
}
```

主题的逻辑都在我上面标的位置。

```javascript
const store = createStore(...args)
let dispatch = () => {
  throw new Error(
    'Dispatching while constructing your middleware is not allowed. ' +
      'Other middleware would not be applied to this dispatch.'
  )
}
```

先是通过传入的`createStore`创建函数，和第二层的`arg`参数创建了一个`store`。

定义了一个初始的`dispatch`函数。

```javascript
const middlewareAPI = {
  getState: store.getState,
  dispatch: (...args) => dispatch(...args)
}
```

接下来定义了一个`middlewareAPI`，对应我们创建中间件时最外层函数的参数

```javascript
const chain = middlewares.map(middleware => middleware(middlewareAPI))
```

接着处理中间件数组，把中间件的API传进去，也就是解开了一层函数的包装

```javascript
dispatch = compose(...chain)(store.dispatch)
```

这里我觉得就是这个函数最难理解的一段了。

逻辑上就是合并（`compose`）已经给定`API`的中间件数组，提供一个最原始的`dispatch`，返回一个包装过的`dispatch`。

可以先看一下`compose`这个函数。

```javascript
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

这段代码中最重要的就是最后一句`funcs.reduce((a, b) => (...args) => a(b(...args)))`

使用到`reduce`这个`API`的时候，我很喜欢举一个例子，就是累加：

```javascript
const sum = [1, 2, 3].reduce((sum, val) => sum + val);
console.log(sum);
```

上面这段就会输出数字`6`啦。

回到原来的函数，箭头函数如果套太深其实看着确实晕，所以把它拆出来。

```javascript
funcs.reduce((a, b) => {
  return (...args) => {
    return a(b(...args))
  }
})
```

这里我们用三个中间件来表示这一个过程。

PS：这里已经没有最外层的`middlewareAPI`为参数的函数了，因为上一句的`map`操作已经把这一层解开了。

```javascript
const m1 = dispatch => {
  return action => {
  }
};

const m2 = dispatch => {
  return action => {
  }
};

const m3 = dispatch => {
  return action => {
  }
};
```

我们知道`reduce`如果没有传入第二个参数作为默认值的话，是会选择数组的第一项作为初始值，然后跳过第一次循环。

所以在第二次循环的时候。

`a`就为`m1`，`b`就为`m2`，返回值作为下一次的`a`。

第三次的循环的时候。

`a`就为：

```javascript
a = (...args) => {
  return m1(m2(args))
}
```

`b`为`m3`，返回值作为下一次的`a`。

那么最后返回的就是第四次的`a`。

此时`a`就为：

```javascript
a = (...args) =>{
  return ((...args) => {
    return m1(m2(args))
  })(m3(args))
}
```

`m3(args)`返回了一个新的`dispatch`。

然后依次是`m2(args)`返回新的`dispatch`。

最后是`m1(args)`返回新的`dispatch`。

最后`m1`返回的`dispatch`作为了新的`store`的`dispatch`。

也就是最后的代码：

```javascript
return {
  ...store,
  dispatch
}
```

而且可以从这个嵌套看出来，越后面的中间件他的执行距离真正的`dispatch`会更近。

也就是我们之前使用了两个中间件`loggerMiddleware`和`timeMiddleware`。

传入的时候是先`loggerMiddleware`后`timeMiddleware`。

输出的时候就是先`loggerMiddleware`后`timeMiddleware`。

即
```text
loggerMiddleware在dispatch之前的输出
timeMiddleware在dispatch之前的输出
真正的dispatch
timeMiddleware在dispatch之后的输出
loggerMiddleware在dispatch之后的输出
```

最后就是在`createStore`中在传入了中间件的情况下直接返回。

```javascript
if (typeof enhancer !== 'undefined') {
  if (typeof enhancer !== 'function') {
    throw new Error('Expected the enhancer to be a function.')
  }
  
  // 传入了自己
  return enhancer(createStore)(reducer, preloadedState)
}
```

这里需要注意一个点

就是`MiddlewareAPI`中的`dispatch`是整个`store`的`dispatch`。

而构造的中间件函数中的`dispatch`参数是指包装了剩下中间件的`dispatch`。

一般我们会把这个`dispatch`写为`next`，这样就更便于理解了。

```javascript
const loggerMiddleware = (middlewareAPI) => {
  return (next) => {
    return (action) => {
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      let newAction = next(action);
      console.log("logger before");
      console.log("state is " + middlewareAPI.getState());
      return newAction;
    };
  };
};
```
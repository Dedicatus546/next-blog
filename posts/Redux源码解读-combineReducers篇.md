---
title: Redux源码解读 - combineReducers篇
key: 1594432480date: 2020-07-11 09:54:40
updated: 2023-02-13 18:28:45
tags:
  - Redux
  - JavaScript
categories:
  - 编程
---


`Redux`源码解读 - `combineReducers`篇。

<!-- more -->

这次讲讲`combineReducers`这个函数。

其实之前学习过`React`，也用过和`React`配套的`React-Redux`。

# `combineReducers`

既然不知道它是干嘛的。

直接上官网找找文档就行了。

以下是在中文网摘过来的一段话。

> 随着应用变得越来越复杂，可以考虑将 reducer 函数 拆分成多个单独的函数，拆分后的每个函数负责独立管理`state`的一部分。
> `combineReducers`辅助函数的作用是，把一个由多个不同`reducer`函数作为`value`的`object`，合并成一个最终的 `reducer`函数，然后就可以对这个`reducer`调用`createStore`方法。合并后的`reducer`可以调用各个子`reducer`，并把它们返回的结果合并成一个`state`对象。
> 由`combineReducers()`返回的`state`对象，会将传入的每个`reducer`返回的`state`按其传递给`combineReducers()`时对应的`key`进行命名。

不是很难理解。

如果把全部的处理`action`的逻辑写在一个`reducer`，这个`reducer`就会显得很臃肿，也不容易维护。

合并不同处理逻辑的`reducer`，返回一个新的`reducer`，通过新的`reducer`来创建`store`。

可以写个小例子来看看这个函数的效果：

```javascript
const aReducer = (state = { val: 1 }, action) => {
  switch (action.type) {
    case "increment":
      return {
        ...state,
        val: state.val + 1,
      };
    case "decrement":
      return {
        ...state,
        val: state.val - 1,
      };
    default:
      return state;
  }
};

const bReducer = (state = { val: 2 }, action) => {
  switch (action.type) {
    case "increment":
      return {
        ...state,
        val: state.val + 2,
      };
    case "decrement":
      return {
        ...state,
        val: state.val - 2,
      };
    default:
      return state;
  }
};

const reducer = combineReducers({
  aReducer,
  bReducer,
});

const store = createStore(reducer);

console.log(store.getState());

store.subscribe(() => {
  console.log(store.getState());
});

store.dispatch({
  type: "increment",
});
```

运行之后可以出现：

![](https://i.loli.net/2020/07/11/1c2k9VtiE8UIosj.png)

到这里基本就可以明白基本的流程了。

每个`reducer`都有自己的一个命名，这个命名会在`state`中体现。

每次`dispatch`，会遍历每一个传入的`reducer`，更新`state`。

ok，那先把源码贴上来：

```javascript
export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    if (process.env.NODE_ENV !== "production") {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache;
  if (process.env.NODE_ENV !== "production") {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== "production") {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      );
      if (warningMessage) {
        warning(warningMessage);
      }
    }

    let hasChanged = false;
    const nextState = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === "undefined") {
        const errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}
```

看起来很长，拆开开其实就会很清晰。

```javascript
const reducerKeys = Object.keys(reducers);
const finalReducers = {};
for (let i = 0; i < reducerKeys.length; i++) {
  const key = reducerKeys[i];

  if (process.env.NODE_ENV !== "production") {
    if (typeof reducers[key] === "undefined") {
      warning(`No reducer provided for key "${key}"`);
    }
  }

  if (typeof reducers[key] === "function") {
    finalReducers[key] = reducers[key];
  }
}
const finalReducerKeys = Object.keys(finalReducers);
```

第一段代码。

先是获取了每个`reducer`的名字，存到`reducerKeys`里面。

定义了一个字面对象量`finalReducers`。

然后根据`reducerKeys`的长度做了一个循环。

这个循环两个判断。

第一个判断，如果传入了一个值为`undefined`的属性，非生产环境下就会有一个警告。

第二个判断，只把值的类型为`function`的才添加到`finalReducers`里面。

循环结束后获取`finalReducers`的属性名组成的数组，存到`finalReducerKeys`。

这段的作用就是防止传入不符合规则的对象。

比如下面这样：

```javascript
combineReducers({
  a: undefined,
  b: 1,
  c: "abc",
});
```

这些属性名对应的值都是不符合规则的，都要排除掉。

```javascript
let unexpectedKeyCache;
if (process.env.NODE_ENV !== "production") {
  unexpectedKeyCache = {};
}
```

第二段代码。

就在非生产环境下初始化一个字面对象变量`unexpectedKeyCache`而已，现在还不知是干什么的，先跳过。

```javascript
let shapeAssertionError;
try {
  assertReducerShape(finalReducers);
} catch (e) {
  shapeAssertionError = e;
}
```

第三段代码

往函数`assertReducerShape`传入了`finalReducers`变量。

对函数`assertReducerShape`的运行进行了异常捕获。

来看看`assertReducerShape`这个函数。

```javascript
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key];
    const initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === "undefined") {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION(),
      }) === "undefined"
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      );
    }
  });
}
```

这里面主要对每个`reducer`做了两个判断。

第一个判断，初始化时对于传进的初始状态`undefined`不能返回`undefined`。

必须在`Redux`内部初始化时（调用一次`dispatch`，`action`为`ActionTypes.INIT`，`ActionTypes.INIT`为`Redux`内部的`action`）。

每一个`reducer`都不能返回`undefined`。

第二个判断其实我并不是很能理解，不过从抛出错误的信息可以知道。

大意就是要求我们不要去处理`Redux`内部的`action`，对于未知的`aciton`都要返回一个不是`undefined`的数据。

`Redux`内部的`action`有三个。

```javascript
const randomString = () =>
  Math.random().toString(36).substring(7).split("").join(".");

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
};
```

第三部分的代码到这里就结束，主要对`reducer`的返回值做了断言，并将断言的结果保存在`shapeAssertionError`中。

```javascript
return function combination(state = {}, action) {
  if (shapeAssertionError) {
    throw shapeAssertionError;
  }

  if (process.env.NODE_ENV !== "production") {
    const warningMessage = getUnexpectedStateShapeWarningMessage(
      state,
      finalReducers,
      action,
      unexpectedKeyCache
    );
    if (warningMessage) {
      warning(warningMessage);
    }
  }

  let hasChanged = false;
  const nextState = {};
  for (let i = 0; i < finalReducerKeys.length; i++) {
    const key = finalReducerKeys[i];
    const reducer = finalReducers[key];
    const previousStateForKey = state[key];
    const nextStateForKey = reducer(previousStateForKey, action);
    if (typeof nextStateForKey === "undefined") {
      const errorMessage = getUndefinedStateErrorMessage(key, action);
      throw new Error(errorMessage);
    }
    nextState[key] = nextStateForKey;
    hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
  }
  hasChanged =
    hasChanged || finalReducerKeys.length !== Object.keys(state).length;
  return hasChanged ? nextState : state;
};
```

第四部分代码。

就是返回一个新的`reducer`函数了。

开始就先对之前保存的断言就行了判断，如果发现`reducer`不符合规则，直接抛出错误。

接下来。

```javascript
if (process.env.NODE_ENV !== "production") {
  const warningMessage = getUnexpectedStateShapeWarningMessage(
    state,
    finalReducers,
    action,
    unexpectedKeyCache
  );
  if (warningMessage) {
    warning(warningMessage);
  }
}
```

这一段代码传入了旧的`state`，`reducers`数组，请求的`action`，和之前没用过的一个空的`unexpectedKeyCache`对象。

看看`getUnexpectedStateShapeWarningMessage`这个函数的实现。

```javascript
function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  // 获取reducers的属性名组成的数组
  const reducerKeys = Object.keys(reducers);
  // 初始化state还是更新state
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? "preloadedState argument passed to createStore"
      : "previous state received by the reducer";

  // reducers为空，即 reducers = {}
  if (reducerKeys.length === 0) {
    return (
      "Store does not have a valid reducer. Make sure the argument passed " +
      "to combineReducers is an object whose values are reducers."
    );
  }

  // state必须为一个字面对象量
  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    );
  }

  // reducers.hasOwnProperty(key)
  // 找到那些inputState里面有的但是在reducers自身没有的属性名
  // 即 inputState = {a: 1, b: 2}  reducers = {a: aReducer}
  // 那么b就会被传入unexpectedKeys中
  // unexpectedKeyCache[key]
  // 之前已经确认为不包括的属性名就不用再找出来了
  const unexpectedKeys = Object.keys(inputState).filter(
    (key) => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  );

  // 在unexpectedKeyCache中标记这些新的不包括在reducers内的属性名
  unexpectedKeys.forEach((key) => {
    unexpectedKeyCache[key] = true;
  });

  // 如果action为替换reducer那就没事，因为替换也意味着reducers的结构也会发生改变
  if (action && action.type === ActionTypes.REPLACE) return;

  // 如果unexpectedKeys存在项，即inputState存在了不包括在reducers中的属性名
  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    );
  }
}
```

这个函数主要就是检查`inputState`的结构是否符合`reducers`。

```javascript
let hasChanged = false;
const nextState = {};
for (let i = 0; i < finalReducerKeys.length; i++) {
  const key = finalReducerKeys[i];
  const reducer = finalReducers[key];
  const previousStateForKey = state[key];
  const nextStateForKey = reducer(previousStateForKey, action);
  if (typeof nextStateForKey === "undefined") {
    const errorMessage = getUndefinedStateErrorMessage(key, action);
    throw new Error(errorMessage);
  }
  nextState[key] = nextStateForKey;
  hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
}
```

这个循环便是整个返回函数中最重要的部分了。

定义了一个标志变量和`hasChange`和一个下一个状态的对象`nextState`。

循环已经筛选过的`reducers`，也就是`finalReducerKeys`。

- `key` `reducer`的名字；
- `reducer` `key`对应的`reducer`；
- `previousStateForKey` `reducer`对应的旧状态；
- `nextStateForKey` `reducer`执行后的新状态。

然后判断新的状态是不是`undefined`，是的话报错，因为这是不符合规则的。

然后在新的状态对象上添加对应`key`为`nextState`。

最后确定新的状态是不是和旧的状态是否相同，保存在`hasChange`中。

```javascript
hasChanged =
  hasChanged || finalReducerKeys.length !== Object.keys(state).length;
return hasChanged ? nextState : state;
```

最后就是确定要不要返回新的状态，如果每个`reducer`返回的都和旧状态相同的话。

逻辑上整个状态就应该和原来相同。

除了循环内的判断，最后做了一个`finalReducerKeys.length !== Object.keys(state).length`判断。

只要旧的`state`的`key`值集合长度和`finalReducerKeys`的长度不一致就返回`nextState`。

到这里基本上就把这个函数看完了。

需要注意的是，在文档中有对这函数的一个注意事项。

> 本函数设计的时候有点偏主观，就是为了避免新手犯一些常见错误。也因些我们故意设定一些规则，但如果你自己手动编写根`redcuer`时并不需要遵守这些规则。
> 每个传入 `combineReducers` 的 reducer 都需满足以下规则：
> 
> - 所有未匹配到的`action`，必须把它接收到的第一个参数也就是那个`state`原封不动返回。
> - 永远不能返回`undefined`。当过早`return`时非常容易犯这个错误，为了避免错误扩散，遇到这种情况时`combineReducers`会抛异常。
> - 如果传入的`state`就是`undefined`，一定要返回对应`reducer`的初始`state`。根据上一条规则，初始`state`禁止使用`undefined`。使用`ES6`的默认参数值语法来设置初始`state`很容易，但你也可以手动检查第一个参数是否为 `undefined`。
>
> 虽然`combineReducers`自动帮你检查`reducer`是否符合以上规则，但你也应该牢记，并尽量遵守。即使你通过 `Redux.createStore(combineReducers(...), initialState)` 指定初始`state`，`combineReducers` 也会尝试通过传递 `undefined`的`state`来检测你的`reducer`是否符合规则。因此，即使你在代码中不打算实际接收值为`undefined`的`state`，也必须保证你的`reducer`在接收到`undefined`时能够正常工作。

所以在源码中可以看到很多判断语句。

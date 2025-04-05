---
title: Vuex@next源码解析 - store篇
key: 1603267330date: 2020-10-21 16:02:10
updated: 2023-02-13 18:28:43
tags:
 - Vue
 - Vuex
 - JavaScript
categories:
 - 笔记
---


# 前言

开个坑，最近看的`Vuex@next(4.0)`的源码，源码不复杂，可以拿出来写写

当作一个笔记，如果帮助到你理解了，那么我会相当开心😘

<!-- more -->

源码不是很复杂，文件也不多，但是我感觉写的小巧，很棒

应该会分成几个帖子来写，主要按照每个文件来写，如果有更好地编写方式，可以留言给我，因为对我来说，分文件写起来有条例以及可以循序渐进

`Vuex`，是`Vue`官方的一个全局状态管理，可以理解成一个全局的`data`（类似组件里面的`data`属性）

`Vuex`也有暴露一些自己的方法，比如类似组件的计算属性（`getter`），同步的修改数据操作（`mutation`），支持异步方式修改数据的操作（`action`）

个人觉得，如果想要理解源码，最好是先读它的`API`，知道了它的`API`是干什么的，看起源码来才能更好地理解

应该会分成几个部分来写

- `store.js` 入口文件，创建一个`store`的核心文件
- `module-colleton.js`
  模块列表对象，使得我们可以注册(`register`)（卸载(`unregister`)）一个模块，嵌套模块
- `module.js` 模块对象，每个模块的对象类
- `helper.js` 工具函数，比如`mapGetters`，`mapMutations`等等

> [Vuex@next(4.0)仓库](https://github.com/vuejs/vuex/tree/4.0)
> [Vuex@next(4.0)文档仓库](https://github.com/vuejs/vuex/tree/v4-docs/docs)

PS：如果直接搜索记得切换分支！！！如下图

![](https://i.loli.net/2020/10/28/MaNc2XsY6ZHKt1U.png)

`vuex.vuejs.org`的文档还是`Vuex3`的，不过`Vuex4`暴露的API和`Vuex3`的基本一样

所以如果想了解`API`的作用看`Vuex3`的文档问题不大

如果想看用例的，就取上面的文档仓库上找对应`API`的`MD`文件即可

也可以及直接 [点我](https://github.com/vuejs/vuex/blob/v4-docs/docs/api/index.md) 就可以看到几乎全部的`API`了

`Vuex`的项目结构不复杂（PS：报红的原因是我没有安装依赖）

![](https://i.loli.net/2020/10/21/uGT6hJ537UrbCOv.png)

So，我还是有信心讲好的~ ok，那么我们开始吧~~

# `store.js`

本篇主要讲建立一个`store`的整体流程。

由于在`Vue3`中开始推行`setup`函数来进行逻辑的编写，有一点`ReactHook`的味道，比如

```html
<template>
  <div>
    <button @click="ageIncrementHandler">增加1岁</button>
    <p>名字: {{ person.name }}</p>
    <p>岁数: {{ person.age }}</p>
  </div>
</template>

<script>
import {reactive} from "vue";

export default {
  name: "Test",
  setup() {
    const person = reactive({
      name: "lwf",
      age: 1
    });
    const ageIncrementHandler = () => {
      person.age++;
    };
    return {
      person,
      ageIncrementHandler
    };
  }
};
</script>
```

运行效果如下

![](https://i.loli.net/2020/10/21/FmfZ3XvpaWdJg6z.gif)

在`Vuex3`中，也有一点这种味道，我觉得主要体现在创建`store`上

`Vuex3`创建`store`

```javascript
const store = new Vuex.Store({
  // ...config
})
```

到了`Vuex4`，创建`store`改为**函数式创建**

```javascript
// createStore为Vuex暴露的一个API
const store = createStore({
  // ...config
})
```

这其中难道有什么魔法？？？

其实并没有，在`store.js`中可以看到`createStore`的源码

```javascript
export function createStore (options) {
  return new Store(options)
}
```

无非是包了一层函数导出而已

`Vuex4`在设计时兼容了`Vuex3`，在`4.0`的仓库的`README.md`中的起始部分可以看到如下描述

> This is the Vue 3 compatible version of Vuex. The focus is
> compatibility, and it provides the exact same API as Vuex 3, so users
> can reuse their existing Vuex code with Vue 3.

大意就是`Vuex4`兼容了`Vuex3`，暴露了和`Vuex3`相同`API`，使得在旧的`Vuex`代码可以使用在`Vue3`上。

真正的核心代码为下面的`Store`类

```javascript
export class Store {
  // 构造器
  constructor (options = {}) {}
  // 暴露给Vue3的函数
  install (app, injectKey) {}
  // 暴露的state，也就是所谓的‘状态’
  get state () {}
  set state (v) {}
  // 两个最常用的API，commit提交mutation，dispatch分发一个action
  commit (_type, _payload, _options) {}
  dispatch (_type, _payload) {}
  // 对commit操作和dispatch操作注册一个订阅的函数
  subscribe (fn, options) {}
  subscribeAction (fn, options) {}
  // 通过getter函数返回状态，可以观察状态的变化并执行cb函数
  watch (getter, cb, options) {}
  // 替换state
  replaceState (state) {}
  // 注册和卸载一个模块
  registerModule (path, rawModule, options = {}) {}
  unregisterModule (path) {}
  // 判断模块名是否被注册
  hasModule (path) {}
  // 热重载相关
  hotUpdate (newOptions) {}
  // 内部函数，用于改变_state.data的值而不出现报错
  _withCommit (fn) {}
}
```

这里省略了实现的代码，为了从宏观上去认识这个类

<!--- `constructor` `es6`类的写法，类似`Java`的类，`new`的时候会执行这段代码-->
<!--- `install` 暴露的install函数，`VueApp`通过`use`来安装这个插件-->
<!--  ```javascript-->
<!--  import {createApp} from "vue";-->
<!--  import store from "./store";-->
<!--  import App from "./App.vue";-->
<!--  createApp(App)-->
<!--    // 安装-->
<!--    .use(store)-->
<!--    .mount("#app");-->
<!--  ```-->
<!--- `get state` `state`变量的`get`函数-->
<!--- `set state` `state`变量的`set`函数-->
<!--- `commit` 执行一个`mutation`-->
<!--- `dispatch` 提交一个`action`-->
<!--- `subscribe` 注册一个函数，这个函数在每个`mutation`完成之后调用-->
<!--- `subscribeAction` 注册一个函数，这个函数可以通过配置指定在`action`之前，之后，出错情况下调用-->
<!--- `watch` 侦听`state`的变化，执行回调-->
<!--- `replaceState` 替换整个状态树，一般在调试状态下使用-->
<!--- `registerModule`和`unregisterModule` 注册和卸载一个模块-->
<!--- `hasModule` 检查模块名是否被注册-->
<!--- `hotUpdate` 热替换模块-->
<!--- `_withCommit` 内部函数，用于修改内部`_state`-->

## `install`

```javascript
export class Store {
  install (app, injectKey) {
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$store = this
  }
}
```

安装函数很简单

通过`Vue3`的`provide`API注入了自身，并且把自身挂载到`app.config.globalProperties`的`$store`上

`provide`注入，这样在`setup`函数中就可以使用`useStore`（`Vuex4`暴露的`API`）来获取`store`对象，注意：在`setup`函数中没有`this`！！！

`globalProperties`挂载，使得`Vue2`的方式中可以通过`this`来获取`store`，这种方法取代了`Vue2`的`Vue.prototype.propertyName
  = value`，比如之前想挂载经过`axios`封装的`API`层，一般如下写

```javascript
// 通过axios封装的API层
import http from './http';
Vue.prototype.$http = http;
```

然后在组件中

```javascript
export default {
  mounted() {
    // 获取http对象
    console.log(this.$http);
  }
};
```

而在`Vue3`中，只需要挂载到`app.config.globalProperties`即可有相同的效果

```javascript
import http from './http';
// 导入其他依赖
const app = createApp(App)
app.config.globalProperties.$http = http;
app.mount("#app");
```

## `state`的`get`，`set`函数

我们知道，Vuex不允许我们直接更改`state`状态，必须通过`commit`一个`mutation`

或者`dispatch`一个`action`来更改状态

从它源码可以看出，`state`属性不是真正存放状态的地方，只是对外暴露的一个接口，通过定义`get`和`set`来限制用户的行为

```javascript
export class Store {
  get state () {
    return this._state.data
  }
  set state (v) {
    if (__DEV__) {
      assert(false, `use store.replaceState() to explicit replace store state.`)
    }
  }
}
```

可以看到`get`返回了真正的状态的一个属性，位于`_state.data`

而`set`则直接报错（开发模式`__DEV__`下），提醒用户不要直接修改状态，而是要使用`replaceState`这个函数来修改状态。

比如我们创建了下面这样的`store`

```javascript
const store = createStore({
  state: {
    name: "lwf",
    age: 22
  }
})
```

可以打印下`store`，确实出现了`_state.data`，并且是一个`Proxy`对象（其实这是一个响应式的对象，后面会写到）

![](https://i.loli.net/2020/10/21/pEx2Qqvc8DjW7sF.png)

当然可以直接的修改这个对象，并不会出现什么错误，我们直接修改`_state.data`

```javascript
store._state.data.age = 23;
// 或者
// store.state.age = 23

// 无法修改
// store.state = {
//   age: 23
// }
```

这里要注意，`set`只是对设置`state`这个操作拦截

而无法递归的拦截，所以`store.state.age = 23`从逻辑上并不会执行`state`的`set`，而是执行`state`的`get`

打印看看

![](https://i.loli.net/2020/10/21/qrJdgFo7iuScPja.png)

发现确实改变，也没有出现任何错误（这里没报错是因为默认情况下严格模式是关闭的）

当然这样子修改状态是不应该出现在实际的代码中的，因为这会使得状态的改变变得混乱。

## `constructor`

新建一个`store`时的初始化过程

```javascript
export class Store {
  constructor (options = {}) {
    // Vuex需要Promise支持，以及必须以new来新建一个store
    if (__DEV__) {
      assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
      assert(this instanceof Store, `store must be called with the new operator.`)
    }

    const {
      plugins = [],
      // 严格模式默认不开
      strict = false
    } = options

    // store的内部变量，可以看到以单个'_'开头，是很好的编码习惯
    this._committing = false
    this._actions = Object.create(null)
    this._actionSubscribers = []
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)
    this._modulesNamespaceMap = Object.create(null)
    this._subscribers = []
    this._makeLocalGettersCache = Object.create(null)

    // 包装dispatch和commit函数，绑定上下文
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit (type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // 挂载严格模式的标志
    this.strict = strict

    const state = this._modules.root.state

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)

    // initialize the store state, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreState(this, state)

    // apply plugins
    plugins.forEach(plugin => plugin(this))

    const useDevtools = options.devtools !== undefined ? options.devtools : /* Vue.config.devtools */ true
    if (useDevtools) {
      devtoolPlugin(this)
    }
  }
}
```

最前面的两个`assert`判断表明`Vuex`需要`Promise`支持以及必须通过`new`来创建

可以看到初始化了很多的属性

- `strict` 严格模式的开启标志
- `_committing` 跟严格模式相关，使得即使开启严格模式下也可以修改状态`_state.data`
- `_actions` 存放所有的`action`
- `_actionSubscribers` 存放所有的注册`action`回调函数
- `_mutations` 存放所有`mutation`
- `_subscribers` 存放所有的注册`mutation`回调函数
- `_wrappedGetters` 存放所有的绑定参数的`getter`
- `_modules` 嵌套的模块列表
- `_modulesNamespaceMap` 带命名空间的模块列表
- `_makeLocalGettersCache` 带命名空间的模块的所有`getter`的缓存

在初始化了属性之后，绑定了`dispatch`和`commit`的`context`

```javascript
const store = this
const { dispatch, commit } = this
this.dispatch = function boundDispatch (type, payload) {
  return dispatch.call(store, type, payload)
}
this.commit = function boundCommit (type, payload, options) {
  return commit.call(store, type, payload, options)
}
```

为啥要这样写呢，原因就是如果我们把对象的函数赋值给一个变量，那么此时的`this`会丢失，比如

```javascript
const o = {
  name: "lwf",
  say() {
    console.log(this.name);
  }
}

o.say();  // 没问题，输出 "lwf"
const say = o.say;
say();    // 此时this指向了window，输出了"undefined"
```

绑定了上下文，这样用户如果使用解构之类的操作，也不会造成上下文的丢失

```javascript
const { dispatch, commit } = store;

commit(...)      // 没有问题
dispatch(...)    // 没有问题
```

然后初始化了`strict`严格模式标志，并且严格模式默认不开，从对`options`的解构可以看出，`strict`的默认值为`false`

```javascript
const {
  plugins = [],
  // 严格模式默认不开
  strict = false
} = options
// ...其他代码
// strict mode
this.strict = strict
```

对于严格函数，可以先看`enableStrictMode`这个函数（注意，这个函数不在类中，同一个文件内往下拉可以找到）

```javascript
function enableStrictMode (store) {
  watch(() => store._state.data, () => {
    if (__DEV__) {
      assert(store._committing, `do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, flush: 'sync' })
}
```

可以看到这个函数内部使用了`Vue3`的`watch`API

监听了`store._state.data`这个对象，配置为`deep`（深层监听）并且执行为`sync`（同步的）

在回调函数内部，开发模式`__DEV__`下会根据`store._committing`状态来判断是否要抛出错误

我们可以试试配置下`strict`为`true`，然后打印来看看效果

```javascript
const store = createStore({
  strict: true,
  state: {
    name: "lwf",
    age: 22
  }
});
store._state.data.age = 23;
```

![](https://i.loli.net/2020/10/22/5wb13tfjiXrLPYR.png)

报错了，但数据还是更改了（所以还是要根据`Vuex`的设计理念来，而不是直接修改数据）

![](https://i.loli.net/2020/10/22/rANBkSZ6CJ28il4.png)

有一个函数和`enableStrictMode`存在关系，就是在这个类中的`_withCommit`方法

```javascript
export class Store {
  _withCommit (fn) {
    // 保存之前的状态
    const committing = this._committing
    // 置为真，这样修改_state.data不报错，即使在严格模式下
    this._committing = true
    fn()
    // 恢复之前的状态
    this._committing = committing
  }
}
```

可以看到，这个函数使得内部修改`_state.data`不报错（即使在严格模式下，不过现在还没写到它在什么地方开启）

因为`_committing`被置为`true`

接着执行了两个函数`installModule`和`resetStoreState`

```javascript
const state = this._modules.root.state
installModule(this, state, [], this._modules.root)
resetStoreState(this, state)
```

在`installModule`上有一行注释

> init root module.this also recursively registers all sub-modules and
> collects all module getters inside this._wrappedGetters

大意就是，初始化根模块，递归注册所有子模块，收集所有模块的`getters`到`_wrappedGetters`下

在`resetStoreState`上有一行注释

> initialize the store state, which is responsible for the reactivity
> (also registers _wrappedGetters as computed properties)

大意就是，初始化`store`的状态，通过`reactive`API使之成为响应式的（`reactive`）

并且也会注册`wrappedGetters`里面的所有`getter`到`store.getter`下，使之成为一个计算属性（`computed`）。

（这两个函数后面写，先认识总体的流程，如果想查看，点击右侧相应的部分即可跳转）

遍历插件数组，安装插件

```javascript
// apply plugins
plugins.forEach(plugin => plugin(this))
```

对于插件的安装，并没有什么魔法，传入了自己作为参数，然后执行，仅此而已。

`Vuex`的文档上给了一个简单的例子

```javascript
const myPlugin = store => {
  // 当 store 初始化后调用
  store.subscribe((mutation, state) => {
    // 每次 mutation 之后调用
    // mutation 的格式为 { type, payload }
  })
}
```

内部自带的`logger.js`也是通过这种方式进行安装，文件位于`plugins`文件夹下

```javascript
export function createLogger (
  /* ...args */
) {
  // 返回了一个函数，函数的参数为store
  return store => {
    // ...code
  }
}
```

最后是判断是否安装开发工具插件的代码（这个插件依赖了调试工具暴露的对象，实现其实非常简单，但这里忽略不写，因为和核心实现没有太大关系）

```javascript
const useDevtools = options.devtools !== undefined ? options.devtools : /* Vue.config.devtools */ true
if (useDevtools) {
  devtoolPlugin(this)
}
```

## `commit`

`commit`用于提交一个`mutation`

```javascript
export class Store {
  commit (_type, _payload, _options) {
    // check object-style commit
    const {
      type,
      payload,
      options
    } = unifyObjectStyle(_type, _payload, _options)

    const mutation = { type, payload }
    const entry = this._mutations[type]
    if (!entry) {
      if (__DEV__) {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    this._withCommit(() => {
      entry.forEach(function commitIterator (handler) {
        handler(payload)
      })
    })

    this._subscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .forEach(sub => sub(mutation, this.state))

    if (
      __DEV__ &&
      options && options.silent
    ) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
        'Use the filter functionality in the vue-devtools'
      )
    }
  }
}
```

`unifyObjectStyle`对入参进行标准化

```javascript
// check object-style commit
const {
  type,
  payload,
  options
} = unifyObjectStyle(_type, _payload, _options)
```

`unifyObjectStyle`规范了参数，在`Vuex`中，`commit`一个`mutation`的方式有多种，比如

```javascript
// 1. mutation名字 + 载荷 + options
store.commit("mutation1", {
  // 自定义的载荷
}, {});

// 2. 包含mutation名字的载荷 + options
store.commit({
  type: "mutation1"
  // 自定义的载荷
}, {});
```

`unifyObjectStyle`实现如下

```javascript
function unifyObjectStyle (type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  if (__DEV__) {
    assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
  }

  return { type, payload, options }
}
```

如果第一个参数是对象，那么第二个参数就应该是`options`，`mutation`的名字应该为第一个参数的`type`，载荷就是第一个参数。

如果第一个参数不是对象，那么就是三个参数的情况，直接返回即可

注意到中间还判断了`mutation`的名字一定要是字符串，不然报错

接着从`_mutations`属性中拿出了对应`type`的函数数组

是一个数组，也就是说一个名字为`m1`的`mutation`是可以对应多个函数的

```javascript
const mutation = { type, payload }
const entry = this._mutations[type]
if (!entry) {
  // 没这个名字对应的函数，证明没有注册过，开发环境下报错
  if (__DEV__) {
    console.error(`[vuex] unknown mutation type: ${type}`)
  }
  return
}
```

然后执行了`_withCommit`来修改状态（防`strict`为`true`下报错）

对每个`mutation`传入了载荷（自定义的参数），注意这里是一个完全同步执行的过程

```javascript
this._withCommit(() => {
  entry.forEach(function commitIterator (handler) {
    handler(payload)
  })
})
```

然后进行回调的执行

```javascript
this._subscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .forEach(sub => sub(mutation,  this.state))
```

注意这里调用了`slice`返回了一个浅复制的副本

这么做为了防止在注册的函数中执行取消注册而造成的逻辑混乱问题（`Redux`内部也有相似的逻辑）

最后一个判断和开发工具相关，忽略

## `dispatch`

`dispatch`用于分发一个`action`

```javascript
export class Store{
  dispatch (_type, _payload) {
    // check object-style dispatch
    const {
      type,
      payload
    } = unifyObjectStyle(_type, _payload)

    const action = { type, payload }
    const entry = this._actions[type]
    if (!entry) {
      if (__DEV__) {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    try {
      this._actionSubscribers
        .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
        .filter(sub => sub.before)
        .forEach(sub => sub.before(action, this.state))
    } catch (e) {
      if (__DEV__) {
        console.warn(`[vuex] error in before action subscribers: `)
        console.error(e)
      }
    }

    const result = entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload)

    return new Promise((resolve, reject) => {
      result.then(res => {
        try {
          this._actionSubscribers
            .filter(sub => sub.after)
            .forEach(sub => sub.after(action, this.state))
        } catch (e) {
          if (__DEV__) {
            console.warn(`[vuex] error in after action subscribers: `)
            console.error(e)
          }
        }
        resolve(res)
      }, error => {
        try {
          this._actionSubscribers
            .filter(sub => sub.error)
            .forEach(sub => sub.error(action, this.state, error))
        } catch (e) {
          if (__DEV__) {
            console.warn(`[vuex] error in error action subscribers: `)
            console.error(e)
          }
        }
        reject(error)
      })
    })
  }
}
```

`dispatch`的参数传入方式和`commit`基本一样，所以函数前面的逻辑也是规范参数，提取相应的部分

然后调用了那些注册的`before`的函数，这里用`try-catch`，防止`before`函数执行出现错误导致后续`dispatch`操作执行失败

```javascript
try {
  this._actionSubscribers
    .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
    .filter(sub => sub.before)
    .forEach(sub => sub.before(action, this.state))
} catch (e) {
  if (__DEV__) {
    console.warn(`[vuex] error in before action subscribers: `)
    console.error(e)
  }
}
```

对于注册在`action`的回调，有三种方式来执行回调

```javascript
store.subscribeAction(() => {
  // 默认before
})

store.subscribeAction({
  before: () => {},   // action 分发之前
  after: () => {},    // aciton 分发之后
  error: () => {}     // aciton 分发出现错误
})
```

所以上面的 `.filter(sub => sub.before)`逻辑把`before`的函数给筛了出来

注意这里也做了一个`slice`浅拷贝，防止函数执行过程中取消注册（或者说是“取消订阅”）

```javascript
const result = entry.length > 1
      ? Promise.all(entry.map(handler => handler(payload)))
      : entry[0](payload)
```

然后执行了相应的`action`函数，这里和`mutation`一样，都是执行了一个数组，也就是存在多个的`action`

这里可能有疑问，为啥多个`action`函数的时候就包了一层`Promise.all`，一个的时候就没有呢？

这是因为在注册`action`的时候（`registerAction`这个函数，后面会写到它的实现），已经对`action`进行包装了，使得每个`action`一定会返回一个`Promise`

最后返回了一个`Promise`

```javascript
return new Promise((resolve, reject) => {
  result.then(res => {
    try {
      this._actionSubscribers
        .filter(sub => sub.after)
        .forEach(sub => sub.after(action, this.state))
    } catch (e) {
      if (__DEV__) {
        console.warn(`[vuex] error in after action subscribers: `)
        console.error(e)
      }
    }
    resolve(res)
  }, error => {
    try {
      this._actionSubscribers
        .filter(sub => sub.error)
        .forEach(sub => sub.error(action, this.state, error))
    } catch (e) {
      if (__DEV__) {
        console.warn(`[vuex] error in error action subscribers: `)
        console.error(e)
      }
    }
    reject(error)
  })
})
```

`action`和`mutation`的不同之处就是`action`里面支持异步的操作，而`mutation`里面修改`state`一定是同步的

所以`dispatch`返回了一个`Promise`，在`action`执行完毕可以通过`then`注册一个回调

```javascript
dispatch('action1').then(() => {
  // dispatch执行完毕时的回调
})
```

`dispatch`返回的`Promise`很简单，根据`action`返回的`Promise`状态来决定如何解决`dispatch`返回`Promise`的状态

成功回调执行了注册为`after`的函数，错误回调执行了注册`error`的函数

简单点讲，就是包了一层`Promise`，为了能够执行注册的`after`和`error`函数（`3.4.0`版本新增的`API`）

## `subscribe`

注册在`mutation`执行之后执行的函数

```javascript
export class Store {
  subscribe (fn, options) {
    return genericSubscribe(fn, this._subscribers, options)
  }
}
```

可以看到，实现依赖了另一个函数`genericSubscribe`，注册`mutation`和`action`都依赖了这个函数

```javascript
function genericSubscribe (fn, subs, options) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend
      ? subs.unshift(fn)
      : subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}
```

先判断函数`fn`是否已经在`subs`中了，不存在才放进去

`options`的`prepend`可以指定怎么把函数放到数组中

如果`prepend`为`true`，那么执行`unshift`放到数组头部，反之`push`到数组尾部

返回了一个函数，这个函数逻辑也很简单，就是找到数组里面的这个函数，然后通过`splice`删除，也就是取消注册（取消订阅）

## `subscribeAction`

注册一个函数，在`action`执行之前`before`（默认），执行之后`after`和执行出错`error`时执行

```javascript
export class Store {
  subscribeAction (fn, options) {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, this._actionSubscribers, options)
  }
}
```

可以看到先判断第一个参数是否为函数来判断是否包装为一个对象

如果直接传入了一个函数，也就是`typeof fn === 'function'`为真，那么包装成一个`{ before: fn }`

并且也支持`options`的`prepend`来配置前插入还是后插入数组

`genericSubscribe`的实现在`subscribe`有写，这里就不重复了

## `watch`

```javascript
export class Store {
  watch (getter, cb, options) {
    if (__DEV__) {
      assert(typeof getter === 'function', `store.watch only accepts a function.`)
    }
    return watch(() => getter(this.state, this.getters), cb, Object.assign({}, options))
  }
}
```

`watch`的实现依赖了`Vue3`的`watch`API，做了个简单的入参判断，来对状态进行监听以及执行传入回调，`options`和`Vue3`的`watch`配置一样

## `replaceState`

这个API官方给的信息太少，就一句

> 替换 store 的根状态，仅用状态合并或时光旅行调试。

```javascript
export class Store {
  replaceState (state) {
    this._withCommit(() => {
      this._state.data = state
    })
  }
}
```

实现非常的简单，就是包在`_withCommit`中执行，替换`state`而已

一般为了在刷新时恢复状态使用，在`beforeunload`事件中把状态序列化为字符串(`JSON.stringify`)存入`localStorage`中

然后在加载之后判断`localStorage`是否存在，存在就使用这个函数来替换状态。

个人觉得很少会使用到这个`API`...

因为如果是上面的情况，为什么不在创建`store`之前就构建传入`createStore`的参数呢？

## `registerModule`

注册一个动态模块

```javascript
export class Store {
  registerModule (path, rawModule, options = {}) {
    if (typeof path === 'string') path = [path]
  
    if (__DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }
  
    this._modules.register(path, rawModule)
    installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // reset store to update getters...
    resetStoreState(this, this.state)
  }
}
```

可以看到，注册的逻辑是由`_modules.register`实现，注册完之后通过`installModule`安装对应的`module`

然后执行`resetStoreState`来重置`store`来更新`getters`

在`Vuex`中，在初始化设置的模块，可以理解为静态模块，这种模块无法删除

在运行过程中可以动态的注入一个模块，这种模块可以理解为动态模块，动态模块支持删除

这两者底层实现就是用一个`runtime`来判断，`runtime`为`false`表示静态的模块，反之为动态模块（这个之后会写）

而且通过入参可以看出，注册一个模块，是传入一个`path`数组的，比如现在有如下`store`

```javascript
const store = createStore({
  state: {}
})
```

现在想在根下面注册一个名为`m1`的模块，那么应该执行

```javascript
store.registerModule(['m1'], {  
  state: {},
  getters: {},
  // 其他配置
})
```

然后想在`m1`下面注册一个`m2`模块

```javascript
store.registerModule(['m1', 'm2'], {  
  state: {},
  getters: {},
  // 其他配置
})
```

## `unregisterModule`

卸载一个动态的模块，对于初始化的模块，是无法卸载的

```javascript
export class Store {
  unregisterModule (path) {
    if (typeof path === 'string') path = [path]

    if (__DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1))
      delete parentState[path[path.length - 1]]
    })
    resetStore(this)
  }
}
```

可以看到，卸载的主要实现也是`_modules.unregister`

然后通过`getNestedState`查找对应的父状态，然后使用`delete`操作删除。

最后重置了`store`，这个`resetStore`包括了`resetStoreState`操作，后面会写到

## `hasModule`

判断模块名字是否被注册了

```javascript
export class Store {
  hasModule (path) {
    if (typeof path === 'string') path = [path]

    if (__DEV__) {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    return this._modules.isRegistered(path)
  }
}
```

可以看到实现也是依赖`_modules.isRegistered`，做了简单的判断

# 内部函数

## `installModule`

安装模块，递归的安装它的子模块。

```javascript
function installModule (store, rootState, path, module, hot) {
  const isRoot = !path.length
  const namespace = store._modules.getNamespace(path)

  // register in namespace map
  if (module.namespaced) {
    if (store._modulesNamespaceMap[namespace] && __DEV__) {
      console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
    }
    store._modulesNamespaceMap[namespace] = module
  }

  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      if (__DEV__) {
        if (moduleName in parentState) {
          console.warn(
            `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
          )
        }
      }
      parentState[moduleName] = module.state
    })
  }

  const local = module.context = makeLocalContext(store, namespace, path)

  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key
    registerMutation(store, namespacedType, mutation, local)
  })

  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}
```

在前面`constructor`中执行了`installModule(this, state, [], this._modules.root)`来安装模块

```javascript
const isRoot = !path.length
const namespace = store._modules.getNamespace(path)
```

先判断了是否为根模块（`isRoot`），以及获取这个模块的命名空间`namespace`

```javascript
// register in namespace map
if (module.namespaced) {
  if (store._modulesNamespaceMap[namespace] && __DEV__) {
    console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
  }
  store._modulesNamespaceMap[namespace] = module
}
```

如果模块是带命名空间的（注意这里是两个东西`namespaced`和`namespace`）

那么会注册到`_modulesNamespaceMap`这个对象中，比如

```javascript
const store = createStore({
  modules: {
    m1: {
      namespaced: true
    }
  }
});
```

那么此时`m1`子模块在`_modulesNamespaceMap`中对应`m1/`属性

![](https://i.loli.net/2020/10/22/f6JDmGWx1L3lH2Q.png)

接着是一段判断

```javascript
// set state
if (!isRoot && !hot) {
  const parentState = getNestedState(rootState, path.slice(0, -1))
  const moduleName = path[path.length - 1]
  store._withCommit(() => {
    if (__DEV__) {
      if (moduleName in parentState) {
        console.warn(
          `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
        )
      }
    }
    parentState[moduleName] = module.state
  })
}
```

这里我们先简单认为`hot`就是`false`，也就是在**不是根模块**的情况下才会设置状态

那为啥根不设置状态呢，其实根的状态在`constructor`中由`ModuleColleton`对象来设置了

在`constructor`中`this._modules = new ModuleCollection(options)`初始化了根`root`的状态

`ModuleCollection`这个之后会写。

可以看到`if`内的实现是先通过`getNestedState`找到他的父状态对象

然后获取模块的名字`moduleName`，做了个判断，防止重名模块的出现，

最后就在父状态下挂载对应子模块的状态`parentState[moduleName] = module.state`，比如

```javascript
const store = createStore({
  state: {
    val: 1
  },
  modules: {
    m1: {
      state: {
        val: 2
      }
    }
  }
})
```

运行这个函数之后，`store.state`就变成了

```javascript
store.state = {
  val: 1,
  m1: {
    val: 2
  }
}
```

接着创建了当前模块的上下文参数，用于之后注册`getters`，`mutations`和`actions`

```javascript
const local = module.context = makeLocalContext(store, namespace, path)
```

接着分别遍历了当前模块的`getters`，`mutations`和`actions`

调用`registerGetter`，`registerMutation`和`registerAction`

```javascript
module.forEachMutation((mutation, key) => {
  const namespacedType = namespace + key
  registerMutation(store, namespacedType, mutation, local)
})

module.forEachAction((action, key) => {
  // 直接dispatch根的action，这里可以看文档
  const type = action.root ? key : namespace + key
  const handler = action.handler || action
  registerAction(store, type, handler, local)
})

module.forEachGetter((getter, key) => {
  const namespacedType = namespace + key
  registerGetter(store, namespacedType, getter, local)
})
```

最后遍历模块的`modules`，递归的处理这个过程

```javascript
module.forEachChild((child, key) => {
  installModule(store, rootState, path.concat(key), child, hot)
})
```

这里可以总结出这个函数的作用，也就是把每个模块的`state`的状态聚合到根模块的的`state`上（也就是`this._modules.root.state`，在构造器中的语句，传入了这个函数）

注册`getters`，`mutations`，`actions`

这里没有发现和响应式相关的语句，因为响应式的处理在另一个函数

注意，在`Vuex`中，很多时候用一个`path`数组来表示当前模块的`state`

在递归注册子模块执行`installModule`时，传入`path.concat(key)`，比如

如果此时模块为`root`，那么此时`path`数组为`[]`

如果此时`root`包含了一个名字为`m1`的模块，那么遍历到`m1`模块时，`path`数组为`['m1']`

## `resetStoreState`

重置`store`的状态，在这个函数中，会把`_state`变成响应式对象

并且对`wrappedGetters`中的`getter`也转为`computed`计算属性

```javascript
function resetStoreState (store, state, hot) {
  const oldState = store._state

  // bind store public getters
  store.getters = {}
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null)
  const wrappedGetters = store._wrappedGetters
  const computedObj = {}
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    computedObj[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      get: () => computed(() => computedObj[key]()).value,
      enumerable: true // for local getters
    })
  })

  store._state = reactive({
    data: state
  })

  // enable strict mode for new state
  if (store.strict) {
    enableStrictMode(store)
  }

  if (oldState) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldState.data = null
      })
    }
  }
}
```

先是在`store`上初始化`getters`和`_makeLocalGettersCache`

```javascript
// bind store public getters
store.getters = {}
// reset local getters cache
store._makeLocalGettersCache = Object.create(null)
```

然后遍历了在`installModule`中注册的所有的`getter`，也就是`_wrappedGetters`上的所有属性

```javascript
forEachValue(wrappedGetters, (fn, key) => {
  // use computed to leverage its lazy-caching mechanism
  // direct inline function use will lead to closure preserving oldVm.
  // using partial to return function with only arguments preserved in closure environment.
  computedObj[key] = partial(fn, store)
  Object.defineProperty(store.getters, key, {
    get: () => computed(() => computedObj[key]()).value,
    enumerable: true // for local getters
  })
})
```

注意这里利用`Object.defineProperty`延迟了调用`computed`创建一个计算属性

然后就是对`state`响应式化，使用`Vue3`的`reactive`API来创建一个响应式对象

```javascript
store._state = reactive({
  data: state
})
```

接着根据`strict`属性判断是否要开启严格模式，也就是是否执行`enableStrictMode`函数

```javascript
// enable strict mode for new state
if (store.strict) {
  enableStrictMode(store)
}
```

最后一个判断和热重载有关，忽略。

总结来说这个函数就是给已经聚合的`this._modules.root.state`（在构造函数中，传入了这个函数）对象设为响应式

并把`_wrappedGetters`上的`getter`设为计算属性，挂载到`store.getters`上

## `resetStore`

重置一个`store`，清除注册的所有`actions`，`mutations`，`getters`和模块对象

然后根据原来的`state`重新执行`installModule`和`resetStoreState`

```javascript
function resetStore (store, hot) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  // 获取原来的状态
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset state
  resetStoreState(store, state, hot)
}
```

## `makeLocalContext`

可以理解为为每一个模块创建一个上下文，包括这个模块自己的`dispatch`和`commit`函数

以及挂载`getters`和`state`

```javascript
function makeLocalContext (store, namespace, path) {
  const noNamespace = namespace === ''

  const local = {
    dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (__DEV__ && !store._actions[type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
          return
        }
      }

      return store.dispatch(type, payload)
    },

    commit: noNamespace ? store.commit : (_type, _payload, _options) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || !options.root) {
        type = namespace + type
        if (__DEV__ && !store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }

      store.commit(type, payload, options)
    }
  }

  // getters and state object must be gotten lazily
  // because they will be changed by state update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace)
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}
```

根据`Vuex`的文档，如果一个模块没有设置命名空间`namespaced`的话，

那么他的`action`和`mutation`都会直接注册到根上

也就是不同的模块可以对同一个名字注册`action`或者`mutation`

也就有了之前说的`_mutations`对象每个属性对应的不是单个函数，而是一个函数数组，比如

```javascript
const store = createStore({
  mutations: {
    mutation1() {
    }
  },
  modules: {
    m1: {
      mutations: {
        mutation1() {
        }
      }
    }
  }
})
```

那么此时`mutation1`就会有两个函数，当`commit`的时候，这两个函数都会执行（`actions`同理）

![](https://i.loli.net/2020/10/22/zsdokDE983AK7C1.png)

而如果模块`m1`设置`namespaced`为`true`的话，那么`m1`的`mutation1`就会带上命名空间

```javascript
const store = createStore({
  mutations: {
    mutation1() {
    }
  },
  modules: {
    m1: {
      mutations: {
        mutation1() {
        }
      }
    }
  }
})
```

那么此时`m1`的`mutation1`在根中就会带上`m1/`的前缀

![](https://i.loli.net/2020/10/22/6CpHULjgrhfnS1G.png)

可以以dispatch为例

```javascript
dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
  const args = unifyObjectStyle(_type, _payload, _options)
  const { payload, options } = args
  let { type } = args

  if (!options || !options.root) {
    type = namespace + type
    if (__DEV__ && !store._actions[type]) {
      console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
      return
    }
  }

  return store.dispatch(type, payload)
}
```

存在命名空间的情况下，就是把命名空间添加到对应的`action`名字前，然后执行`dispatch`，这样就能取到对应的`action`

而在当前的模块下，并不需要知道真正的`action`名字，因为这里已经替我们处理了

比如模块`m1`的`ac2`分发了`ac1`，如下

```javascript
const store = createStore({
  actions: {
    ac1() {
      console.log("root ac1");
    }
  },
  modules: {
    m1: {
      namespaced: true,
      actions: {
        ac1() {
          console.log("m1 ac1");
        },
        ac2({dispatch}) {
          // 这里的ac1只会是本模块的ac1，命名空间已经通过包装dispatch函数处理了
          dispatch("ac1");
        }
      }
    }
  }
});
```

![](https://i.loli.net/2020/10/23/IZk3ovmrM7sBEQ8.png)

除了包装了`dispatch`和`commit`

如果存在命名空间，也会注入相应的`getters`和`state`

```javascript
Object.defineProperties(local, {
  getters: {
    get: noNamespace
      ? () => store.getters
      : () => makeLocalGetters(store, namespace)
  },
  state: {
    get: () => getNestedState(store.state, path)
  }
})
```

如果存在命名空间，那么会执行`makeLocalGetters`，根据命名空间来拿到对应的`getters`，

而本模块的`state`只要通过`getNestedState`来从根获取对应嵌套的`state`即可

## `makeLocalGetters`

通过命名空间来获取相应模块的`getter`，然后对结果缓存，减少计算。

```javascript
function makeLocalGetters (store, namespace) {
  if (!store._makeLocalGettersCache[namespace]) {
    const gettersProxy = {}
    const splitPos = namespace.length
    Object.keys(store.getters).forEach(type => {
      // skip if the target getter is not match this namespace
      if (type.slice(0, splitPos) !== namespace) return

      // extract local getter type
      const localType = type.slice(splitPos)

      // Add a port to the getters proxy.
      // Define as getter property because
      // we do not want to evaluate the getters in this time.
      Object.defineProperty(gettersProxy, localType, {
        get: () => store.getters[type],
        enumerable: true
      })
    })
    store._makeLocalGettersCache[namespace] = gettersProxy
  }

  return store._makeLocalGettersCache[namespace]
}
```

先判断`_makeLocalGettersCache`是否已经缓存了结果，如果缓存了，直接返回

没有缓存的话，会把根的`getters`带相应命名空间的提取出来，然后缓存下来并返回。

比如此时执行了`makeLocalGetters(store, "m1/")`

也就是要找出`m1`的`getter`，对根`getters`中的每个`getter`

执行`slice(0, namespace.length)`截取`getter`名字的前面部分和`namespace`比较

相等就加入结果集，然后缓存返回，而且要注意，此时的`getter`已经不带命名空间了

```javascript
// 从当前的命名空间往后截取
const localType = type.slice(splitPos)

// 挂载到结果集上
Object.defineProperty(gettersProxy, localType, {
  get: () => store.getters[type],
  enumerable: true
})
```

## `registerGetter`

把模块的`getter`注册到`_wrappedGetters`上，

此时根据传入的`local`（也就是之前通过`makeLocalContext`创建的本模块的上下文）

做了一个函数的包装，延迟执行

```javascript
function registerGetter (store, type, rawGetter, local) {
  // 判断是否已经存在相同名字的getter，存在就报错返回
  if (store._wrappedGetters[type]) {
    if (__DEV__) {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }
  // 包装getter，绑定上下文
  store._wrappedGetters[type] = function wrappedGetter (store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  }
}
```

## `registerMutation`

把模块的`mutation`注册到`_mutations`上

此时根据传入的`local`（也就是之前通过`makeLocalContext`创建的本模块的上下文）

做了一个函数的包装，延迟执行

```javascript
function registerMutation (store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  // 包装，延迟执行，推入相应的mutation数组
  entry.push(function wrappedMutationHandler (payload) {
    handler.call(store, local.state, payload)
  })
}
```

## `registerAction`

把模块的`action`注册到`_actions`属性上

`action`的存储方式和`mutation`一样，是以数组方式的，也就是一个`action`名字可以对应多个`action`的函数

这里也对`action`进行包装，使得它统一返回一个`Promise`

```javascript
function registerAction (store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = [])
  // 包装函数，push进相应的名字中
  entry.push(function wrappedActionHandler (payload) {
    // 这里执行action
    let res = handler.call(store, {
      dispatch: local.dispatch,
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      rootGetters: store.getters,
      rootState: store.state
    }, payload)
    // 这里把结果统一包装为一个Promise
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    // 开发工具的代码，不管
    if (store._devtoolHook) {
      return res.catch(err => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      // 返回这个Promise
      return res
    }
  })
}
```

## `getNestedState`

```javascript
function getNestedState (state, path) {
  return path.reduce((state, key) => state[key], state)
}
```

传入一个`state`和`path`数组，取得对应路径的状态，比如

```javascript
const state = {
  a: {
    b: {
      c: {
        msg: 'Hello Vuex'
      }
    }
  }
}

const nestedState = getNestedState(state,['a', 'b', 'c']);
```

这时候`nestedState`就是`{ msg: "Hello Vuex" }`

数组的`reduce`API每次返回了下一个名字为`key`状态`state[key]`，不过由于没有做判断，如果中间出现了不存在的状态那么会报错

```javascript
// 不报错，d其实不存在，但是由于是数组的最后一项，不会再去访问下一个状态
getNestedState(state, ['a', 'b', 'd']);    // 返回undefined

// 报错，d不存在，不是最后一项，接着出现了undefined['e']，从而报错
getNestedState(state, ['a', 'd', 'e']); 
```

# 后记

第二次写这么长的文了，可能有些地方写的比较晦涩，如果你有更好的建议可以在下面评论

除了`store.js`，还有几个文件需要编写，不过需要一点时间

`Vuex`小巧而且精致，很多时候我会惊叹里面的写法，希望我以后也能写出这么好的代码

人啊，最重要的就是开心~
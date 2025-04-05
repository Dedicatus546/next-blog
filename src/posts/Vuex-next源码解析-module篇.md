---
title: Vuex@next源码解析 - module篇
key: 1603688666date: 2020-10-26 13:04:26
updated: 2023-02-13 18:28:43
tags:
 - Vue
 - Vuex
 - JavaScript
categories:
 - 笔记
---


# 前言

本篇主要写`Vuex`中模块最基本的的一个单位，`Module` -- 模块对象

<!-- more -->

# `module.js`

```javascript
export default class Module {
  
  constructor (rawModule, runtime) {}

  get namespaced () {}

  addChild (key, module) {}
  removeChild (key) {}
  getChild (key) {}
  hasChild (key) {}
  
  update (rawModule) {}

  forEachChild (fn) {}
  forEachGetter (fn) {}
  forEachAction (fn) {}
  forEachMutation (fn) {}
}
```

不用因为这么多方法感到退却，因为其实这些方法都是一些非常简单的方法，放下心往👇看就完事~

- `constructor` 构造器函数
- `addChild` 添加一个子模块`Module`对象
- `removeChild` 移除一个子模块`Module`对象
- `getChild` 得到一个子模块`Module`对象
- `hasChild` 是否拥有一个子模块`Module`对象
- `update` 更新本模块
- `forEachChild` 遍历每一个子模块
- `forEachGetter` 遍历本模块每一个`getter`
- `forEachAction` 遍历本模块每一个`action`
- `forEachMutation` 遍历本模块每一个`mutation`

看起来很多，其实对于`xxxChild`这几个方法，颇有点增删改查的味道😂

后四个`forEachXXX`函数很明显为遍历函数

## `constructor`

```javascript
// Base data struct for store's module, package with some attribute and method
export default class Module {
  constructor (rawModule, runtime) {
    this.runtime = runtime
    // Store some children item
    this._children = Object.create(null)
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule
    const rawState = rawModule.state

    // Store the origin module's state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }
}
```

构造器函数表明了将会往对象上挂载什么属性

`this.runtime` 表示是否是运行时注册的模块，前面说到的注册根`root`模块时

在`ModuleCollection`的构造器中执行了`this.register([], rawRootModule, false)`

这里第三个参数为`false`也就表明了根模块是不可以卸载的

`this._children` 本模块包含的子`Module`对象

`this._rawModule` 用于创建模块的参数（就是用于传进来的`options`），比如现在有如下`store`

```javascript
const store = createStore({
  state: {
    val: 24
  },
  modules: {
    m1: {
      state: {
        val: 124
      }
    }
  }
})
```

那么对于根`root`和`m1`，他们的`_rawModule`，应该是这个传入的配置对象什么部分？

可能有人会认为都是整个配置对象，但其实不是，因为在`ModuleCollection`类中的`register`方法中

```javascript
// register nested modules
if (rawModule.modules) {
  forEachValue(rawModule.modules, (rawChildModule, key) => {
    this.register(path.concat(key), rawChildModule, runtime)
  })
}
```

这里通过工具函数`forEachValue`来来遍历传入的配置参数的`modules`（如果存在的情况下），每次回调的`rawChildModule`为本模块的一个配置对象

比如此时遍历到了`modules`下的`m1`，此时两者分别为

```javascript
rawChildModule = {
  state:{
    val: 124
  }
}

key = 'm1'
```

那么对于`m1`，他的`_rawModule`和`rawChildModule`一样，就为

```javascript
_rawModule = {
  state:{
    val: 124
  }
}
```

而对于根`root`模块，他的`_rawModule`，就是整个传进来的参数对象

```javascript
_rawModule = {
  state: {
    val: 24
  },
  modules: {
    m1: {
      state: {
        val: 124
      }
    }
  }
}
```

我们可以在控制台展开看看

![](https://i.loli.net/2020/10/26/z5nmgeNq61i8jAd.png)

发现基本符合预期，但是根`root`模块的`state`是合并的，在这个文件中并没有相关的操作，哪又是在进行合并的呢？

没错，之前`store`篇说过，是`store.js`文件中的`installModule`方法

在`Store`类的构造器函数中，调用了`installModule`，如下

```javascript
const state = this._modules.root.state

installModule(this, state, [], this._modules.root)
```

然后在`installModule`中，有一段判断

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
    // 挂载state
    parentState[moduleName] = module.state
  })
}
```

此时的`rootState`就是`this._modules.root.state`

也就是非根模块的时候，通过`getNestedState`取到父模块，然后把当前模块的`state`挂载到父模块的`state`上

`this.state` 也就是本模块的状态，通过`_rawModule.state`来获取

这里做了个判断，也就是我们传入的`state`属性不一定是要一个对象，也可以是一个函数返回一个对象

## `addChild`

```javascript
export default class Module {
  addChild (key, module) {
    this._children[key] = module
  }
}
```

非常简单，我觉得初学者都能看懂🤣，就是往`_children`属性上挂载上传入的`Module`对象而已

## `removeChild`

```javascript
export default class Module {
  removeChild (key) {
    delete this._children[key]
  }
}
```

通过`delete`删除对应`key`的`Module`对象

## `getChild`

```javascript
export default class Module {
  getChild (key) {
    return this._children[key]
  }
}
```

通过`_children`属性返回对应的`Module`对象

## `hasModule`

```javascript
export default class Module {
  hasChild (key) {
    return key in this._children
  }
}
```

通过`in`操作符号判断模块名`key`是否存在`_children`属性中

## `update`

```javascript
export default class Module {
  update (rawModule) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }
}
```

通过传入的`rawModule`配置来更新本模块的`_rawModule`

可以看到，覆盖了`namespaced`，`getters`，`mutations`，`actions`

但是**没有覆盖`state`！**，**没有覆盖`state`！！**，**没有覆盖`state`！！！**

重要的话讲三遍好吧，这个API可以追溯到`store.hotUpdate`这个方法上，热更新时用到，可以不用太在意

## forEachXXX

```javascript
export default class Module {
  forEachChild (fn) {
    forEachValue(this._children, fn)
  }
  
  forEachGetter (fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  forEachAction (fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  forEachMutation (fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
```

这四个函数非常简单，依赖了工具函数`forEachValue`，

每个函数对特定的对象进行属性以及对应值的遍历

# 后记

这个文件写完基本上核心代码就写完了

接下来会整体改进这几篇文章的细节，使大家更容易懂

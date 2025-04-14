---
title: Vuex@next源码解析 - module-collection篇
key: 1603526370date: 2020-10-24 15:59:30
updated: 2023-02-13 18:28:43
tags:
 - Vue
 - Vuex
 - JavaScript
categories:
 - 笔记
---


# 前言

`Vuex4.0`源码解析的第二篇

这篇主要讲`module-collection.js`这个文件，主要是`ModuleCollection`这个类

<!-- more -->

# 前情提要

在第一篇帖子中，我们知道，在`new`一个`Store`时

构造函数`constructor`会执行`this._modules = new ModuleCollection(options)`

这个操作会挂载根模块的`state`到`this._modules.root`，然后后续在`installModule`中递归的合并各个模块的状态

在`installModule`，并不会对根模块的`state`进行安装

而是安装根模块的`getters`，`mutations`，`actions`递归安装子模块（这里就会合并状态了，如下所示）

```javascript
// installModule的里的判断
if (!isRoot && !hot) {
  // 找到父模块的state
  const parentState = getNestedState(rootState, path.slice(0, -1))
  // 找到本模块对应的名字
  const moduleName = path[path.length - 1]
  store._withCommit(() => {
    // ...
    // 在父state上添加当前模块的state
    parentState[moduleName] = module.state
  })
}
```

前面我们说过，`installModule`的主要功能就是每个模块合并`state`成为一个单独的对象

合并所有的`getter`到`_wrappedGetters`

可以看到`if`内的逻辑是先获取父模块的`state`，然后删除子模块的`state`

如果安装根模块的`state`话，那么是无法找到它的父模块的`state`，无法找到也就无法删除

而且`Store`类的中`registerModule`，`unregisterModule`和`hasModule`可以说是直接依赖本模块实现。

# `module-collection.js`

这个类创建的对象挂载到了`store._modules`

![](https://i.loli.net/2020/10/24/F5sUd8wxaE9cvOz.png)

```javascript
export default class ModuleCollection {
  constructor (rawRootModule) {}

  get (path) {}
  getNamespace (path) {}

  update (rawRootModule) {}

  register (path, rawModule, runtime = true) {}
  unregister (path) {}
  isRegistered (path) {}
}
```

可以看到这个类相比`Store`简洁不少

## `constructor`

```javascript
export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }
}
```

在构造函数中，直接使用`register`方法来注册根模块的`state`

这里的注释也表明了传入的参数`rawRootModule`就是传入`createStore`函数的参数

在`Store`的`constructor`中的`this._modules = new ModuleCollection(options)`就执行了这段逻辑

## `register`

这个方法可以说是这个类最重要的方法也不为过，因为个人感觉很多情况下并不会卸载模块（可能我场景见得少😂）

```javascript
export default class ModuleCollection {
  register (path, rawModule, runtime = true) {
    if (__DEV__) {
      assertRawModule(path, rawModule)
    }

    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) {
      this.root = newModule
    } else {
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // register nested modules
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }
}
```

开头执行了`assertRawModule`，来判断参数是否合法（这个后面有写，可以通过右边的\'内置函数\'跳转查看）

接下来`new`了一个`Module`类（这个类下一篇会写）的对象，`Module`对象的创建完全由`Module`类来负责（因为把`rawModule`参传了进去）

```javascript
const newModule = new Module(rawModule, runtime)
if (path.length === 0) {
  this.root = newModule
} else {
  const parent = this.get(path.slice(0, -1))
  parent.addChild(path[path.length - 1], newModule)
}
```

从判断可以看出，如果`path`长度为`0`，证明当前挂载的是根模块，直接挂载到`root`属性上

如果`path`长度不为`0`，说明当前模块是某个模块的子模块

那么通过`get`方法获取了对应**父模块**（`slice(0, -1)`）的`Module`对象

最后调用`Module`对象的`addChild`方法对子模块进行添加

最后会递归的处理子模块

```javascript
// register nested modules
if (rawModule.modules) {
  forEachValue(rawModule.modules, (rawChildModule, key) => {
    this.register(path.concat(key), rawChildModule, runtime)
  })
}
```

注意这里也使用了`path`路径数组的方式，如果现在是在注册根下的`m1`模块

那么此时`path.concat(key)`为`['m1']`

这里注意这个方法是支持挂载静态或者动态模块的，他的第三个参数是可以传入`true`或者`false`的（默认为`true`）

但是对于`Store`暴露的`registerModule`，它里面的逻辑是不传第三个参数

```javascript
export class Store {
  registerModule (path, rawModule, options = {}) {
    // ...
  
    this._modules.register(path, rawModule)
    
    // ...
  }
}
```

所以导致了我们只能注册一个动态的模块

而在这个类的构造器中的注册模块是传入第三个参数为`false`的

```javascript
export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }
}
```

## `unregister`

和`register`的作用相反，用于卸载一个模块对象

```javascript
export default class ModuleCollection {
  unregister (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    const child = parent.getChild(key)

    if (!child) {
      if (__DEV__) {
        console.warn(
          `[vuex] trying to unregister module '${key}', which is ` +
          `not registered`
        )
      }
      return
    }

    if (!child.runtime) {
      return
    }

    parent.removeChild(key)
  }
}  
```

先通过`get`方法获取了对应**父模块**（`slice(0, -1)`）的`Module`对象

```javascript
const parent = this.get(path.slice(0, -1))
```

然后取`path`的最后一个元素，对应着要删除模块的名字

```javascript
const key = path[path.length - 1]
```

调用`Module`对象的`getChild`方法来获取这个要删除的子模块

```javascript
const child = parent.getChild(key)
```

接着对模块进行是否存在的判断，以及是否为运行时注入模块`child.runtime`

只有动态模块（`runtime`为`true`）才能被卸载（也就是删除）

最后调用`Module`对象的`removeChild`来删除一个这个模块

## `isRegistered`

```javascript
export default class ModuleCollection {
  isRegistered (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]

    return parent.hasChild(key)
  }
}  
```

这个函数非常简单，找到父模块对象，通过`Module`对象的`hasChild`判断是否存在

## `update`

```javascript
export default class ModuleCollection {
  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }
}
```

可以看到这个函数的实现依赖了内部函数`update`，在`Store`类中的`hotUpdate`调用了这个方法

可以看出这个`update`是用来更新根模块的，因为`path`参数传入了一个空数组，`targetModule`传入了`this.root`，也就是根模块对象

详情可以看左侧内部函数`update`部分

## `get`

```javascript
export default class ModuleCollection {
  get (path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }
}
```

这个函数可以看出，想要取得某个`Module`对象

都是通过根模块`this.root`开始，根据`path`参数来进行一层一层的通过`reduce`迭代的，每次的迭代都会通过`Module`的`getChild`来获取他的子模块

## `getNamespace`

简单点讲，这和函数就是根据`path`来生成命名空间

```javascript
export default class ModuleCollection {
  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      // 不是命名空间模块，加空字符串，也就是不变
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }
}
```

注意这里会判断每个`module`的`namespaced`，也就是是否开启命名空间

来确定如何添加命名空间，对于`namespaced`为`false`的，一律不添加，（也就是三元判断`:`之后的部分）

这会有一种很有趣的现象，如下

```javascript
const store = createStore({
  modules: {
    m1: {
      namespaced: true
    },
    m2: {
      modules: {
        m1: {
          namespaced: true
        }
      }
    }
  }
})
```

上面这段代码会报错，因为存在了相同的命名空间`m1`，按照人的思维，`m2`里面的`m1`和根里面的`m1`不是同一个模块才对

![](https://i.loli.net/2020/10/29/Ll42YGkWNmbwHyh.png)

原因就是`Vuex`只会对配置`namespaced`为`true`的模块添加其名字到命名空间路径字符串中

而不是说某个模块`namespaced`为`true`，那么生成的命名空间路径字符串是它当前的具体位置，比如例题`m2`模块下的`m1`命名空间路径字符串不为`m2/m1/`

# 内部函数

## `assertRawModule`

这个函数主要是对各个模块内的输入类型进行判定

```javascript
function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return

    const assertOptions = assertTypes[key]

    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}
```

`Vuex`中会判断`getters`，`mutation`，`actions`的输入合法性，这里使用的是一种策略模式

把验证策略定义在了`assertTypes`变量中

```javascript
const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}

const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}
```

这里有两种策略`functionAssert`和`objectAssert`

其中`getters`和`mutations`，都对应了`functionAssert`，可以从策略的`assert`验证函数看出该策略判断是否为函数

而`actionAssert`对应`objectAssert`，该策略允许函数或者带`handler`属性（且`handler`为一个函数）的对象

`assertRawModule`函数通过`Object.keys`对`assertTypes`遍历来对每一种类型进行验证

```javascript
Object.keys(assertTypes).forEach(key => {
  // 这里的key就是'getters'，'mutations'，'actions'
})
```

如果模块没传入值，那么不用判断

```javascript
if (!rawModule[key]) return
```

如果传入值了，那么获取对应类型的策略对象

```javascript
const assertOptions = assertTypes[key]
```

然后通过一个工具`forEachValue`函数遍历，用`assert`（这个函数工具篇讲过）进行判断，

```javascript
forEachValue(rawModule[key], (value, type) => {
  assert(
    assertOptions.assert(value),
    makeAssertionMessage(path, key, type, value, assertOptions.expected)
  )
})
```

报错的内容根据`makeAssertionMessage`这个函数进行生成

```javascript
function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
```

这个函数的`key`就是策略的类型名字字符串，就是`getters`，`mutations`，`actions`中的一个

`type`就是这种类型对应一个属性的名字，`value`就对应这个属性的值

比如现在给`getters`配置一个对象，如下

```javascript
const store = createStore({
  getters: {
    g1: {}
  }
})
```

那么此时不符合`getters`策略的验证函数，通过`makeAssertionMessage`生成了

```text
getters should be function but getters.g1 in module is {}`
```

我们可以试验一下

```javascript
const store = createStore({
  getters: {
    g1: {}
  }
});
```

发现控制台确实报了错误

![](https://i.loli.net/2020/10/24/7VrSKinHte682J4.png)

## `update`

在这个函数中，对`targetModule`（`Module`对象）进行递归的更新

新的模块为`newModule`，就类似我们传入`createStore`的对象。

```javascript
function update (path, targetModule, newModule) {
  if (__DEV__) {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (__DEV__) {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}
```

开头依然是通过`assertRawModule`来判断参数是否合法

```javascript
if (__DEV__) {
  assertRawModule(path, newModule)
}
```

然后调用`Module`对象的`update`来更新模块

```javascript
// update target module
targetModule.update(newModule)
```

接着就是如果存在`modules`属性，也就是存在子模块

那么遍历这些模块，然后递归的调用`update`来更新接下来的模块

这里注意如果父模块不存在子模块，那么更新会失败，因为此时不应该叫更新了，而应该是注册一个新的模块

不过这里有一点奇怪的地方，对于不存在的子模块，跳过更新遍历下一个可能更符合逻辑？

直接`return`，如果下个模块存在，也更新不到了，感觉这不符合更新的逻辑欸...

```javascript
if (newModule.modules) {
  for (const key in newModule.modules) {
    if (!targetModule.getChild(key)) {
      if (__DEV__) {
        console.warn(
          `[vuex] trying to add a new module '${key}' on hot reloading, ` +
          'manual reload is needed'
        )
      }
      // 不应该是continue？
      return
    }
    update(
      path.concat(key),
      targetModule.getChild(key),
      newModule.modules[key]
    )
  }
}
```

# 后记

这是`Vuex`的第二篇了，这篇的篇幅就比`Store`篇短了许多

今天翻了翻`Vuex`的`Issue`，发现已经有`Vuex5`的相关提案了，感觉Vuex4会是个过渡的版本

不过我觉得应该没那么快出到`Vuex5`，可能会加入新的功能到`Vuex4`中，`Vuex5`应该还比较远

> [Proposal for Vuex 5](https://github.com/vuejs/vuex/issues/1763)

看了下API的提案，发现越来越有函数式的味道了，以下为提案的创建`Store`例子

```javascript
const category1 = createStore(() => {
  const innerState = {
    id: "1",
    name: "Flowers"
  }

  const getters = {
    double: () => innerState.name + innerState.name,
  }

  const mutations = {
    SET_NAME(name) {
      innerState.name = name
    },
  }

  return {
    innerState,
    getters,
    mutations
  }
})
```

只能说人还是太能折腾了哈哈哈哈哈哈，不过折腾的最终目标都是为了产出更加优秀的代码

这点我觉得是非常重要的，希望`Vue`越来越好~~~
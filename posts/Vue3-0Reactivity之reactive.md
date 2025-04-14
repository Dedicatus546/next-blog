---
title: Vue3.0Reactivity之reactive
key: 1591931561date: 2020-06-12 11:12:41
updated: 2023-02-13 18:28:43
tags:
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

开始来写一些关于Vue3的reactivity包源码的理解了，可能某些地方会有错误，希望可以指出，感激不尽~

<!-- more -->

因为这个包中其实是没有`watchEffect`和`watch`这两个API的，这两个API在别的包中，所以可能在后面再讲，因为我还没看…

对于这个包，主要的API为`reactive`，`readonly`，`ref`，`computed`以及没有在全局Vue对象暴露的`effect`。

# `reactive`

首先，需要去单独的把这个包编译成一个在浏览器端可以引入的文件，这里可以看这个包下面的`README.md`，

可以结合之前的帖子 Vue3.0尝鲜这个帖子。

直接在vue-next下直接运行`yarn build reactivity --types`就可以编译出文件，选择`reactivity.global.js`即可。

![](https://i.loli.net/2020/04/27/qdIn4zOsF6NZMKk.png)

这次讲下`reactive`方法。在前面关于Reactivity主要API的翻译可以知道，`reactive`这个函数主要是包装一个对象，返回一个响应式的对象。

在Reactivity的包中的src下，可以找到reactive的ts文件，其中对`reactive`的定义如下

```typescript
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  // 如果尝试去观察一个只读的代理，直接返回只读的版本即可
  if (readonlyToRaw.has(target)) {
    return target
  }
  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers,
    mutableCollectionHandlers
  )
}
```

这里可以看到，主要的创建逻辑是`createReactiveObject`这个方法，但是这个`readonlyToRaw`是什么东西呢

可以在前面的定义中，发现有四个WeakMap的定义

```typescript
// WeakMaps that store {raw <-> observed} pairs.
// 存储原生对象（raw） <-> 观察者对象（observed）
const rawToReactive = new WeakMap<any, any>()
const reactiveToRaw = new WeakMap<any, any>()
const rawToReadonly = new WeakMap<any, any>()
const readonlyToRaw = new WeakMap<any, any>()
```

根据官方的注释和变量的名字不难看出，这四个WeakMap用来存储原生对象和观察者对象之间的_双向关系_

其中

* `rawToReactive`： 原生对象 -&gt; 响应式对象
* `reactiveToRaw`： 响应式对象 -&gt; 原生对象
* `rawToReadonly`： 原生对象 -&gt; 只读对象
* `readonlyToRaw`： 只读对象 -&gt; 原生对象

可以猜测，每创建一个代理，就会通过这些WeakMap建立代理与源对象的双向关系。

ok，我们继续看`createReactiveObject`这个方法，这个方法传入了五个参数，分别是target（源对象），两个关于响应式对象的WeakMap，以及两个handlers，

这两个handlers又是什么东西呢，可以看到头部引用了另一个文件的好几个不同的handlers

```typescript
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'
import {
  mutableCollectionHandlers,
  readonlyCollectionHandlers
} from './collectionHandlers'
```

从文件名来看，`baseHandlers`应该是基础的一种handlers，而`collectionHandlers`应该是关于集合的一种handlers，

然后从引入的handlers名字来看，

* `mutableHandlers`：可变handlers
* `readonlyHandlers`：只读handlers
* `shallowReactiveHandlers`：浅响应handlers
* `shallowReadonlyHandlers`：浅只读handlers
* `mutableCollectionHandlers`：可变集合handlers
* `readonlyCollectionHandlers`：只读集合handlers

这里我们可以看到`mutableHandlers`的定义

```typescript
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```

是不是很熟悉，就是Proxy第二个参数中可以配置的拦截函数。

对于这个handler，先不讲那么深，只要知道，这个handlers就拦截了操作

先看之前说的`createReactiveObject`函数，它的定义为

```typescript
function createReactiveObject(
  target: unknown,
  toProxy: WeakMap<any, any>,
  toRaw: WeakMap<any, any>,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // target already has corresponding Proxy
  let observed = toProxy.get(target)
  if (observed !== void 0) {
    return observed
  }
  // target is already a Proxy
  if (toRaw.has(target)) {
    return target
  }
  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target
  }
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers
  observed = new Proxy(target, handlers)
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
}
```

首先是第一段

```typescript
function createReactiveObject(
  // ...
) {
  if (!isObject(target)) {
    if (__DEV__) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
    }
    return target
  }
  // ...
}
```

很明显，根据函数名就可以判断，如果不是对象的话，直接返回源对象，也就是不能对基本类型进行响应式包装。

`__DEV__`是一个开发环境的变量，如果在开发环境下，就会打印一则警告来提醒用户。

```typescript
function createReactiveObject(
  // ...
) {
  // ...
  // target already has corresponding Proxy
  // 目标早已有相应的代理
  let observed = toProxy.get(target)
  if (observed !== void 0) {
    return observed
  }
  // target is already a Proxy
  // 目标本身就是一个代理
  if (toRaw.has(target)) {
    return target
  }
  // ...
}
```

如果源对象存在代理对象或者源对象已是一个代理时，就直接返回，防止创建多个响应式对象。

```typescript
function createReactiveObject(
  // ...
) {
  // ...
  // only a whitelist of value types can be observed.
  // 只要在白名单中的类型才可以被观察
  if (!canObserve(target)) {
    return target
  }
  // ...
}
```

这句不难理解，判断对象是否可以被观察，这个函数的定义为

```typescript
const canObserve = (value: any): boolean => {
  return (
    !value._isVue &&
    !value._isVNode &&
    isObservableType(toRawType(value)) &&
    !rawValues.has(value) &&
    !Object.isFrozen(value)
  )
}
```

根据变量名可以读出，这个对象必须

* 不是`Vue`对象
* 不是`VNode`对象
* 在可响应式的类型中
* 没被冻结
* 原生对象Map不含这个对象

转到`isObservableType`的实现，可以确定可观察的类型只有
`Object`,`Array`,`Map`,`Set`,`WeakMap`,`WeakSet`这几种类型

```typescript
const isObservableType = /*#__PURE__*/ makeMap(
  'Object,Array,Map,Set,WeakMap,WeakSet'
)
```

最后一段，便是创建代理对象了

```typescript
function createReactiveObject(
  // ...
) {
  // ...
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers
  observed = new Proxy(target, handlers)
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
  // ...
}
```

首先是判断源对象的类型，用构造器去判断，然后使用对应的handlers创建Proxy代理对象。然后保存代理对象和源对象的关系（通过前文说到的WeakMap），最后返回这个响应式对象。

至此，对于响应式对象创建的基本流程已经明朗

回过头来，为什么返回的这个代理对象就是响应式的呢？

这需要我们去看创建响应式的handlers的内容了

我们在前面有说到，这个文件引入了多个handlers，其中一个为

```typescript
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```

接下来，我们就从这里入手，探究何为响应式。

我们可以去看Vue的RFC文档

[Composition API RFC | Vue Composition API](https://vue-composition-api-rfc.netlify.app/#api-introduction)

里面关于Detailed Design（详细设计）中的API Introduction（API介绍）有一段我觉得很好的解释了关于响应式这个含义

```typescript
import { reactive, watchEffect } from 'vue'

const state = reactive({
  count: 0
})

watchEffect(() => {
  document.body.innerHTML = `count is ${state.count}`
})
```

这一段话中我觉得下面这句话（以及简短的代码段）间接明了地解释了响应式

> Thanks to dependency tracking, the view automatically updates when reactive state changes.

这句话大意是：多亏了依赖的收集，视图可以自动地在响应式状态的值发生改变时而更新。

对应到代码中，就是当`state.count`发生改变时，使用到`state.count`的函数便会自动的重新执行。

那么现在其实问题就很明了了，如何收集依赖？也就是收集变量改变的函数？
如何触发依赖？也就是在变量改变时重新执行跟它有关的函数？

这里我用`effect`代替`watchEffect`（`watchEffect`就是在`effect`上扩展的，包中是没有`watchEffect`的），测试的动图如下：

![](https://i.loli.net/2020/04/28/ElmtjcoKY94AZnD.gif)

ok，我们开始来看`mutableHandlers`中的`get`属性，发现它的定义为

```typescript
const get = /*#__PURE__*/ createGetter()
```

我们接着看`createGetter`这个函数

```typescript
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    const targetIsArray = isArray(target)
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) && builtInSymbols.has(key)) {
      return res
    }

    if (shallow) {
      !isReadonly && track(target, TrackOpTypes.GET, key)
      return res
    }

    if (isRef(res)) {
      if (targetIsArray) {
        !isReadonly && track(target, TrackOpTypes.GET, key)
        return res
      } else {
        // ref unwrapping, only for Objects, not for Arrays.
        return res.value
      }
    }

    !isReadonly && track(target, TrackOpTypes.GET, key)
    return isObject(res)
      ? isReadonly
        ? // need to lazy access readonly and reactive here to avoid
          // circular dependency
          readonly(res)
        : reactive(res)
      : res
  }
}
```

哇，这么长，我看不懂啊啊啊啊

其实，现在并不需要全部都看，我们可以发现函数中除了一个`track`函数

也就是所谓的收集依赖函数，我们可以点进去看，发现这个函数定义在`effect.ts`文件中

```typescript
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
    if (__DEV__ && activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      })
    }
  }
}
```

这里出现几个全局定义的变量，分别是`shouldTrack`，`activeEffect`，`targetMap`

我们可以往前找，找到这三个的定义

```typescript
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()
```

```typescript
const effectStack: ReactiveEffect[] = []
let activeEffect: ReactiveEffect | undefined
```

```typescript
let shouldTrack = true
const trackStack: boolean[] = []
```

根据变量的语义不难推出意思，

其中`targetMap`存储：对象 -&gt; 属性，而这个属性也是一个Map，存储 属性 -&gt; ReactiveEffect，这个ReactiveEffect是一个Set。

`activeEffect`表示当前的活动Effect。

`shouldTrack`表示应不应该收集依赖。

ok，接着我们分析这个函数，

```typescript
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  // ...
}
```

开头先判断如果不应该收集，或者当前活动的Effect为`undefined`，直接返回

```typescript
export function track(target: object, type: TrackOpTypes, key: unknown) {
  // ...
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 第一次为空，就初始化
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    // 第一次为空，就初始化
    depsMap.set(key, (dep = new Set()))
  }
  // ...
}
```

这一段，找出对象的依赖Map，也就是 `Map&lt;属性名,Set&lt;Effect&gt;&gt;`，

再找出对应属性名的Set，也就是`Set&lt;Effect&gt;`

并且对这两个做了空判断并初始化。

```typescript
export function track(target: object, type: TrackOpTypes, key: unknown) {
  // ...
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
    if (__DEV__ && activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      })
    }
  }
}
```

最后，判断如果当前的effect不在`Set&lt;Effect&gt;`中，就把这个effect存进去，并且在当前effect上的deps上把拥有自己的Set也给存进去。然后就是在开发模式下调用用户传入的`onTrack`函数了。

这里可能会疑问，如何知道当前的effect就是这个target的key的依赖呢？

这里需要把目光先转向`effect`函数

在前面的一个浏览器跑的例子，我们知道

往`effect`传入一个函数，函数内部使用响应式变量就能收集这个函数作为依赖。

在同一个文件内可以找到

```typescript
export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ
): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}
```

发现`effect`的实现不难，主要的逻辑在`createReactiveEffect`函数中。找到它

```typescript
function createReactiveEffect<T = any>(
  fn: (...args: any[]) => T,
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    if (!effect.active) {
      return options.scheduler ? undefined : fn(...args)
    }
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect
        return fn(...args)
      } finally {
        effectStack.pop()
        resetTracking()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.id = uid++
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = []
  effect.options = options
  return effect
}
```

对于这么长的代码，只需关注最重要的一部分

```typescript
function createReactiveEffect<T = any>(
  fn: (...args: any[]) => T,
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    // ...
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect
        return fn(...args)
      } finally {
        effectStack.pop()
        resetTracking()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  // ...
}
```

首先判断自己是不是在effect的栈中，如果在栈中，要对这个effect进行清理初始化，

然后`enableTracking()`，保存上一个`shouldTrack`的状态，并把当前`shouldTrack`置为true，然后把自己保存到effect栈的栈顶，并将`activeEffect`指向自身。

接着，直接运行这个传进来的函数

注意，还记得吗，这里运行就会触发响应式对象`get`拦截方法中的`track`方法，而`track`方法会将当前的effect与对应对象的属性名进行关联，

最后在finally块中将当前的effect弹出，重置`shouldTrack`为上一次的状态的，把当前的effect指向栈的倒数第二个effect。恢复了上一次的状态。

为什么要保存历史的`shouldTrack`状态，因为在一个函数中，可能会触发多个响应式变量属性的`get`。

所以，对于前面的如何知道当前的effect就是这个target的key的依赖呢？这个问题，到这里基本就解决了。

接着，我们需要理明白如何在改变响应式对象的值之后，触发依赖（也就是执行对应的函数）

我们回到`mutableHandlers`，这次我们看下`set`的实现

```typescript
const set = /*#__PURE__*/ createSetter()
```

发现他也是运行一个函数，我们转到这个函数

```typescript
function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    const oldValue = (target as any)[key]
    if (!shallow) {
      value = toRaw(value)
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    const hadKey = hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
```

这段代码中，我们注意到一个`trigger`的函数，根据英文知道它的意思是触发的意思。可以判断它应该就是触发依赖的函数。我们转到这个函数

```typescript
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  const effects = new Set<ReactiveEffect>()
  const computedRunners = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || !shouldTrack) {
          if (effect.options.computed) {
            computedRunners.add(effect)
          } else {
            effects.add(effect)
          }
        } else {
          // the effect mutated its own dependency during its execution.
          // this can be caused by operations like foo.value++
          // do not trigger or we end in an infinite loop
        }
      })
    }
  }

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add)
  } else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        add(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key))
    }
    // also run for iteration key on ADD | DELETE | Map.SET
    const isAddOrDelete =
      type === TriggerOpTypes.ADD ||
      (type === TriggerOpTypes.DELETE && !isArray(target))
    if (
      isAddOrDelete ||
      (type === TriggerOpTypes.SET && target instanceof Map)
    ) {
      add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
    }
    if (isAddOrDelete && target instanceof Map) {
      add(depsMap.get(MAP_KEY_ITERATE_KEY))
    }
  }

  const run = (effect: ReactiveEffect) => {
    if (__DEV__ && effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget
      })
    }
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }

  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  computedRunners.forEach(run)
  effects.forEach(run)
}
```

这么长的函数，只需关注重要的地方即可。

我们发现开头就是把对象的属性Map给取了出来。

然后我们只需注意`add`函数和`run`函数，`add`函数把传进来的依赖添加到`effects`和`computedRunners`（这个是计算属性，也是由`effect`实现，之后会将），

然后中间是一大堆的if判断，我们只需看其中的一句

```javascript
export function trigger(
  // ...
) {
  // ...
  if (/* ... */) {
    // ...
  } else if (/* ... */) {
    // ...
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key))
    }
    // ...
  }
}
```

我们发现，这里把获取了传进来属性名（`key`）的`Set<Effect>`，并且添加在上面说到的两个数组中。

然后定义了一个`run`函数，这个函数开头处理了开发模式下的`onTrigger`函数，最后，执行了传进来的effect

最后遍历两个前面说到的数组，执行了全部和`target`的`key`有关的effect。

至此，响应式的原理基本上已经明了了。

我们可以用一段很简单的代码来梳理整个流程

```javascript
const {reactive, effect} = VueReactivity;

const state = reactive({
  count: 0
});

effect(() => {
  console.log(state.count);
});
```

首先我们通过`reactive`函数创建一个响应式对象，这个响应式对象代理了源对象，它的`set`和`get`中分别有`track`（收集依赖）和`trigger`（触发依赖）这两个操作。

然后我们通过`effect`来执行我们的函数，在执行中，会标记这个函数，也就是`activeEffect`，然后运行它，

一运行，如果使用了响应式的变量，就会触发代理对象的`get`，执行了`track`函数

就把当前运行的函数和这个响应式对象建立一个双向的连接。

当我们修改响应式变量，比如执行`state.count++`时，会触发代理对象的`set`，执行了`trigger`函数，

`trigger`函数会通过之前建立的连接，找到和自己相关的effect，然后执行。

我感觉如果明白了基本的流程，那源代码看起来应该不难，因为知道下一步要干什么，剩下的就是一些判断之类的代码了。

# 后记

第一次写这么长的笔记，如果哪里写的不好希望提出来，非常感谢！
---
title: Vue3.0Reactivity之readonly  
key: 1591933558date: 2020-06-12 11:45:58  
updated: 2023-02-13 18:28:43
tags: 
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

最后一个`readonly`API了，这个API还是蛮容易理解的。

<!-- more -->

# `readonly`

老规矩，找到它的定义

```typescript
export function readonly<T extends object>(
  target: T
): Readonly<UnwrapNestedRefs<T>> {
  return createReactiveObject(
    target,
    rawToReadonly,
    readonlyToRaw,
    readonlyHandlers,
    readonlyCollectionHandlers
  )
}
```

这里和我们之前看`reactive`的实现其实很像，都是主要由另一个函数`createReactiveObject`来传入参数进行实现

```typescript
export function reactive(target: object) {
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

那么我们只要关注参数即可。

这里传入了两个WeakMap，不过这两个WeakMap是建立只读代理到原生对象之间的关系。还传入了两个handlers，这里我们直接找到`readonlyHandlers`。

```typescript
export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  has,
  ownKeys,
  set(target, key) {
    if (__DEV__) {
      console.warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  },
  deleteProperty(target, key) {
    if (__DEV__) {
      console.warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}
```

这里我们可以对比`reactive`使用到的`mutableHandlers`

```typescript
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```

发现不同的地方在`get`，`set`和`deleteProperty`参数上。

我们先看`set`，`deleteProperty`参数，它们直接就在这个对象里面实现。

对于只读的代理对象，当我们尝试对他设置值的时候，`set`就会在开发环境下打印一个警告，删除属性的操作也是如此。

接下来我们看这个`readonly`这个函数的实现

```typescript
// mutableHandlers用到的get
const get = /*#__PURE__*/ createGetter()
// readonlyHandlers用到的get
const readonlyGet = /*#__PURE__*/ createGetter(true)
```

发现其实和`mutableHandlers`的实现都是通过`createGetter`这个函数，只不过传入的参数不同而已。

找到这个`createGetter`函数

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
      // 判断不是只读的就收集依赖。
      !isReadonly && track(target, TrackOpTypes.GET, key)
      return res
    }

    if (isRef(res)) {
      if (targetIsArray) {
        // 判断不是只读的就收集依赖。
        !isReadonly && track(target, TrackOpTypes.GET, key)
        return res
      } else {
        // ref unwrapping, only for Objects, not for Arrays.
        return res.value
      }
    }
    
    // 判断不是只读的就收集依赖。
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

这个函数传入两个参数

* `isReadOnly` 是否只读
* `shallow` 是否为浅代理

所以其实我们可以发现有几种实现，比如`reactive`，`shallowReactive`，`readonly`，`shallowReadonly`，就是通过参数的真假组合出来的get所实现的。

这里我们不讲整个流程，我们发现当需要收集依赖，也就是执行`track`函数的时候，都会先做一个判断，判断传进来的`isReadonly`的真假。

也就是说，如果一个代理是只读的话，那么就没有必要对它执行依赖收集。因为它的`set`和`deleteProperty`没有触发它的依赖，不用触发，自然也就没必要收集。

至此，`readonly`的实现基本上已经明朗，和`reactive`的实现有相似之处，都返回了一个Proxy代理对象，不同的是对于`get`，`set`，`deleteProperty`所使用的函数不相同。

通过拦截`set`和`deleteProperty`来使得赋值和删除属性无效，也避免了无意义的依赖收集。

# 后记

今天重新地同步了vue-next的仓库，发现已经出到`beta.9`版本了，我也发现了一些代码做出了细微的改动，但是万变不离其宗，基本的原理还是一毛一样的。我看到的好像是增加了一些类型声明，还有一些函数的重构。

之后的话会写一些`reactivity`实现上的一些细节的理解。如果看得懂virtual-dom的话，到时也会写写。
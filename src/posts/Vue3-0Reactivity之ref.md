---
title: Vue3.0Reactivity之ref
key: 1591932555date: 2020-06-12 11:29:15
updated: 2023-02-13 18:28:43
tags: 
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

这次讲讲`ref`这个API，如果没有看过`reactive`API的，建议先看下我之前写的关于`reactive`的一些理解，对这个`ref`的理解会更容易

<!-- more -->

# `ref`

同样，我们可以在包中找到`ref.ts`文件，里面定义了`ref`API，

在前面我们翻译`ref`API的文章中，我们知道`ref`函数其实做的事情和`reactive`差不多

区别就是`ref`把传进来的对象挂载到它的`value`属性上，建立响应式，`ref`对于传入的类型基本没有限制，基本类型也可以通过`ref`包装成一个响应式对象。

```typescript
export function ref(value?: unknown) {
  return createRef(value)
}
```

这个API的实现直接返回了`createRef`，找到它

```typescript
function createRef(rawValue: unknown, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue
  }
  let value = shallow ? rawValue : convert(rawValue)
  const r = {
    _isRef: true,
    get value() {
      track(r, TrackOpTypes.GET, 'value')
      return value
    },
    set value(newVal) {
      if (hasChanged(toRaw(newVal), rawValue)) {
        rawValue = newVal
        value = shallow ? newVal : convert(newVal)
        trigger(
          r,
          TriggerOpTypes.SET,
          'value',
          __DEV__ ? { newValue: newVal } : void 0
        )
      }
    }
  }
  return r
}
```

这个函数的实现不难，我们一段一段看

```typescript
function createRef(rawValue: unknown, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue
  }
  // ...
}
```

先判断传进来的值，如果是ref对象了，直接返回

这个`isRef`的实现其实也非常的简单，如下

```typescript
export function isRef(r: any): r is Ref {
  return r ? r._isRef === true : false
}
```

也就是判断对象`_isRef`属性的值（`true`或者`false`）来判定。

```typescript
function createRef(rawValue: unknown, shallow = false) {
  // ...
  let value = shallow ? rawValue : convert(rawValue)
  // ...
}
```

接下来的一行也不难，判断传进来`shallow`这个标记（这个标记的意义为否建立浅的响应式）。

如果`shallow`为真，直接返回原值，否则调用`convert`（意思为转化）函数。

这个函数是什么呢，其实它的实现也很简单。如下

```typescript
const convert = <T extends unknown>(val: T): T =>
  isObject(val) ? reactive(val) : val
```

可能在ts的泛型下会觉得有些奇怪，把泛型去掉，再把箭头函数转为`function`来定义

```typescript
function convert(val){
  return isObject(val) ? reactive(val) : val
}
```

是不是感觉非常清晰，判断传进来的值是不是对象，是的话就用`reactive`包装这个对象，否则直接返回。

回到之前，

```typescript
function createRef(rawValue: unknown, shallow = false) {
  // ...
  const r = {
    _isRef: true,
    get value() {
      track(r, TrackOpTypes.GET, 'value')
      return value
    },
    set value(newVal) {
      if (hasChanged(toRaw(newVal), rawValue)) {
        rawValue = newVal
        value = shallow ? newVal : convert(newVal)
        trigger(
          r,
          TriggerOpTypes.SET,
          'value',
          __DEV__ ? { newValue: newVal } : void 0
        )
      }
    }
  }
  return r
}
```

这个函数最后构建了一个Ref对象，在Vue的实现中，一个Ref对象即存在`._isRef`属性，并且这个属性的值为`true`

这个对象使用了属性的getter和setter，跟`reactive`的做法差不多，get的时候收集依赖，调用`track`，set的时候触发依赖，调用`trigger`

set的实现简单，主要在get的逻辑上存在一些判断

首先判断新值和旧值是不是相等，可能有人疑惑，为啥不直接比较而要用函数呢？

我们可以看下`hasChange`函数

```typescript
export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue)
```

把泛型去掉，转成`function`

```typescript
function hasChanged (value, oldValue) {
  value !== oldValue && (value === value || oldValue === oldValue)
}
```

聪明的人应该看出来了，为了判断`NaN`这个值，在JavaScript中，`NaN`和自己是不相等的。而对于人的逻辑来说，当我多次给响应式对象的一个属性赋`NaN`值，我希望它不应该触发依赖，因为我认为`NaN === NaN`的。

当新值和旧值都是`NaN`，进行比较时，`&amp;&amp;`左边会为真，但是`&amp;&amp;`右边会为假，总体上就返回了假，也就是值没有改变。

对于传进`hasChange`，其中一个使用了`toRaw`，这个函数又是什么呢？

```typescript
export function toRaw<T>(observed: T): T {
  observed = readonlyToRaw.get(observed) || observed
  return reactiveToRaw.get(observed) || observed
}
```

还记得我们写`reactive`API时候的那四个`WeakMap`吗，也就是尝试对传入对象寻找它的源对象，如果有就返回源对象，如果没有就返回自身。

在git中对于添加这个判断的的提交文本是：`ref should not trigger if value did not change`。这里比较的原因就是为了防止赋相同的值重复的触发依赖。

然后把新增赋值给`rawValue`，作为下次的判断，然后再判断`shallow`（浅响应）来对新的值进行处理。

最后便是`trigger`来触发依赖了。

# 后记

这个`ref`如果看过`reactive`的那篇文章会更加容易理解。

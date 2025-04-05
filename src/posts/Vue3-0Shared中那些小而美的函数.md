---
title: Vue3.0Shared中那些小而美的函数  
key: 1591934701date: 2020-06-12 12:05:01  
updated: 2023-02-13 18:28:43
tags: 
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

写一写我认为vue3.0的shared包中那些小而美的函数。

<!-- more -->

# 正文

## `makeMap`

这个函数在其他包中可以看到很多次。它的定义为

```typescript
function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => boolean {
  const map: Record<string, boolean> = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}
```

在顶部有一段注释解释了这个函数的功能

> Make a map and return a function for checking if a key is in that map.
>   构建一个Map返回一个能够检查一个key是否在此Map里的函数。

可能ts下读起来比较晦涩，去掉ts

```typescript
function makeMap(str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}
```

参数

* `str` 是一个由`,`分隔开的字符串
* `expectsLowerCase` 是否以小写方式验证

先创建了一个没有原型的对象，然后把传入的字符串以`,`为分隔符，分割成一个字符串数组，往创建的原型上挂载以字符串数组中的字符为属性名，对这些属性的值置为`true`，最后根据第二个参数判断返回的函数是否对传入参数做小写转换再进行验证

在之前的Reactivity包中的`reactive.ts`中就有一个例子

```typescript
const isObservableType = /*#__PURE__*/ makeMap(
  'Object,Array,Map,Set,WeakMap,WeakSet'
)
```

上面构建了一个判断是否为可观察类型的函数，传入了`&#39;Object,Array,Map,Set,WeakMap,WeakSet&#39;`，当函数执行完时，里面`map`变量就长下面这样

```typescript
map = {
  Object: true,
  Array: true,
  Map: true,
  Set: true,
  WeakMap: true,
  WeakSet: true
}
```

## `cacheStringFunction`

```typescript
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as any
}
```

这个乍看可能很蒙，但是去掉ts和等价地改写下代码，就会很清晰。

```typescript
const cacheStringFunction = (fn) => {
  const cache = Object.create(null)
  return str => {
    const hit = cache[str]
    if(hit){
      return hit;
    }
    cache[str] = fn(str)
    return cache[str]
  }
}
```

简单点讲就是对传入函数的运行结果进行缓存，防止重复的计算，这里的函数名应该是隐含了一个规定，就是只缓存字符类型的值。

参数 

*   `fn` 需要缓存返回值的函数，这个函数只有一个参数，就是一个字符串

在这个函数的下面，就用使用了这个函数的例子（已去掉ts）

```typescript
const capitalize = cacheStringFunction(
  str => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
)
```

这个函数把传入的字符串参数转为首字符大写。

```typescript
capitalize('hello'); // 输出 Hello
```

## `hasChange`

这个之前也有说到过，判断值是否改变的函数

```typescript
const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue)
```

参数

* `value` 新的值
* `oldValue` 旧的值

这个函数主要对`NaN`进行了特殊的判断，在JS中，`NaN`和自身并不相等，但是从一个人的视角来看，`NaN === NaN`是应该成立的。

```typescript
hasChange(1, 2); // 输出 true
hasChange(NaN, 1); // 输出 true
hasChange(1, NaN); // 输出 true
hasChange(NaN, NaN); // 输出 false
```

## 后记

暂时就发现这么多，接下来会不定时更新~
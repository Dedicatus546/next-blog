---
title: Vue3.0的Reactivity-APIs（译）  
key: 1591930658date: 2020-06-12 10:57:38  
updated: 2023-07-26 23:09:43
tags: 
 - JavaScript
 - Vue
categories:
 - 翻译
---



# 前言

Vue3.0的API文档

> [Vue Composition API](https://vue-composition-api-rfc.netlify.app/api.html)

来译下Reactivity APIs的部分

<!-- more -->

# 正文

这个目录下有六个API，分别是

* `reactive`
* `ref`
* `computed`
* `readonly`
* `watchEffect`
* `watch`

## `reactive`

Takes an object and returns a reactive proxy of the original. This is equivalent to 2.x’s `Vue.observable()`.

接收一个对象，返回它的一个响应式代理对象。此API和2.x版本的`Vue.observable()`相同。

```typescript
const obj = reactive({ count: 0 })
```

The reactive conversion is “deep”: it affects all nested properties. In the ES2015 Proxy based implementation, the returned proxy is not equal to the original object. It is recommended to work exclusively with the reactive proxy and avoid relying on the original object.

响应式的转化是”深层次”的：它会影响全部的嵌套属性。在ES2015Proxy的实现下，返回的代理对象和源对象不相等。推荐直接操作响应式代理对象，避免依赖源对象。

*   Typing（类型定义）

```typescript
function reactive<T extends object>(raw: T): T
```

## `ref`

Takes an inner value and returns a reactive and mutable ref object. The ref object has a single property `.value` that points to the inner value.

接收一个内部值，返回一个响应式且可变的ref对象，ref对象有一个单一的属性`.value`，这个属性指向接收的内部值。

```typescript
const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1
```

If an object is assigned as a ref’s value, the object is made deeply reactive by the reactive method.

如果一个对象被分配为一个ref的value，这个对象会通过reactive方法建立深层次的响应式。

*   Access in Templates（在模板中使用）

    When a ref is returned as a property on the render context (the object returned from `setup()`) and accessed in the template, it automatically unwraps to the inner value. There is no need to append `.value` in the template:

    当一个ref对象在渲染上下文中以一个属性返回（这个返回指`setup()`返回的对象）并且在模板中使用时，它会自动地拆开，指向内部的value。所以不需要再模板中加上`.value`来取值：

```html
<template>
  <!-- 这里不用.value取值，自动取到.value -->
  <div>{{ count }}</div>
</template>

<script>
  export default {
    setup() {
      return {
        count: ref(0)
      }
    }
  }
</script>
```

*   Access in Reactive Objects（在响应式对象中使用）

    When a ref is accessed or mutated as a property of a `reactive` object, it automatically unwraps to the inner value so it behaves like a normal property:

    当一个ref对象作为一个响应式对象被使用和改变时，它会自动地拆开，并指向内部的value，所以它行为上就像一个普通的属性：

```typescript
const count = ref(0)
const state = reactive({
  count
})

console.log(state.count) // 0

state.count = 1
console.log(count.value) // 1
```

  Note that if a new ref is assigned to a property linked to an existing ref, it will replace the old ref:

  注意如果一个已存在的ref属性被分配给一个新的ref对象时，它会替换掉旧的ref对象。

```typescript
const otherCount = ref(2)

state.count = otherCount
console.log(state.count) // 2
console.log(count.value) // 1
```

  Note that ref unwrapping only happens when nested inside a reactive `Object`. There is no unwrapping performed when the ref is accessed from an `Array` or a native collection type like `Map`:

  注意ref对象的拆开只会当发生在嵌套的响应式对象中，当ref对象从一个数组中或者从一个原生的集合类型比如Map中获取时不会表现出拆开这一动作。

```typescript
const arr = reactive([ref(0)])
// need .value here
// 需要.value取值
console.log(arr[0].value)

const map = reactive(new Map([['foo', ref(0)]]))
// need .value here
console.log(map.get('foo').value)
```

*   Typing（类型）

```typescript
interface Ref<T> {
  value: T
}

function ref<T>(value: T): Ref<T>
```

  Sometimes we may need to specify complex types for a ref’s inner value. We can do that succinctly by passing a generics argument when calling ref to override the default inference:

  有些时候我们需要为一个ref的内部值指明复杂的类型。我们可以在调用ref函数时通过传递泛型参数来覆盖默认的推断，从而简洁地实现这个效果：

```typescript
// foo变量可以为string类型或者number类型
const foo = ref<string | number>('foo') // foo's type: Ref<string | number>

foo.value = 123 // ok!
// 下面也可以，ts不会出现错误
foo.value = '123' // ok!
```

## `computed`

Takes a getter function and returns an immutable reactive ref object for the returned value from the getter.

接收一个getter函数，为这个getter的返回值创建一个可变的响应式ref对象，返回这个响应式ref对象。

```typescript
const count = ref(1)
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 2

plusOne.value++ // error 错误，原因没有setter函数
```

Alternatively, it can take an object with `get` and `set` functions to create a writable ref object.

或者，可以接收`get`和`set`函数组成的对象来创建一个可写的ref对象。

```typescript
const count = ref(1)
const plusOne = computed({
  get: () => count.value + 1,
  set: val => {
    count.value = val - 1
  }
})

plusOne.value = 1
console.log(count.value) // 0
```

*   Typing（类型）

```typescript
// read-only
// 只读
function computed<T>(getter: () => T): Readonly<Ref<Readonly<T>>>

// writable
// 可写
function computed<T>(options: {
  get: () => T
  set: (value: T) => void
}): Ref<T>
```

## `readonly`

Takes an object (reactive or plain) or a ref and returns a readonly proxy to the original. A readonly proxy is deep: any nested property accessed will be readonly as well.

接收一个对象（响应式对象或者普通的对象）或者一个ref对象，返回一个原始对象（即传入的对象）的只读的代理对象。一个只读的代理对象为深层次的，使用任何嵌套的属性都将设为只读。

```typescript
const original = reactive({ count: 0 })

const copy = readonly(original)

watchEffect(() => {
  // works for reactivity tracking
  console.log(copy.count)
})

// mutating original will trigger watchers relying on the copy
original.count++

// mutating the copy will fail and result in a warning
copy.count++ // warning!
```

## `watchEffect`

Run a function immediately while reactively tracking its dependencies, and re-run it whenever the dependencies have changed.

立即执行一个函数来响应式地追踪依赖，每当依赖变化时重新执行。

```typescript
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```

### Stopping the Watcher （停止观察者）

When `watchEffect` is called during a component’s `setup()` function or lifecycle hooks, the watcher is linked to the component’s lifecycle, and will be automatically stopped when the component is unmounted.

当`watchEffect`在一个组件的setup中或者生命周期的钩子中调用时，这个观察者会连接到组件的生命周期，会在组件卸载时自动地停止。

In other cases, it returns a stop handle which can be called to explicitly stop the watcher:

在其他情况下，它会返回一个用于停止的处理程序，这个处理程序可以被调用来显示地停止这个观察者。

```typescript
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```

### Side Effect Invalidation （副作用失效）

Sometimes the watched effect function will perform async side effects that need to be cleaned up when it is invalidated (i.e state changed before the effects can be completed). The effect function receives an `onInvalidate` function that can be used to register a invalidation callback. The invalidation callback is called when:

有时候被观察的effect函数会表现出异步的副作用，这个副作用需要在它失效时被清理（即在effects函数之前完成之前state已经改变）。effect函数接收一个`onInvalidate`函数，这个函数可以注册一个失效的回调。这个失效的回调将在以下情况被调用：

*   the effect is about to re-run

    effect即将重新执行

*   the watcher is stopped (i.e. when the component is unmounted if `watchEffect` is used inside `setup()` or lifecycle hooks)

    观察者已经停止（即如果`watchEffect`在`setup()`函数或者生命周期钩子中使用，组件被卸载时）

```typescript
watchEffect(onInvalidate => {
  const token = performAsyncOperation(id.value)
  onInvalidate(() => {
    // id has changed or watcher is stopped.
    // invalidate previously pending async operation
    token.cancel()
  })
})
```

We are registering the invalidation callback via a passed-in function instead of returning it from the callback (like React `useEffect`) because the return value is important for async error handling. It is very common for the effect function to be an async function when performing data fetching:

我们通过一个传入的函数而不是从回调中返回这个函数来注册一个失效的回调（这里的从返回函数注册失效回调是react的做法），是因为对于异步的错误处理返回值是非常重要的。当执行数据获取时，effect函数作为一个异步的函数是普遍的：

```typescript
const data = ref(null)
watchEffect(async () => {
  data.value = await fetchData(props.id)
})
```

An async function implicitly returns a Promise, but the cleanup function needs to be registered immediately before the Promise resolves. In addition, Vue relies on the returned Promise to automatically handle potential errors in the Promise chain.

一个异步的函数会隐式地返回一个Promise，但是清理函数需要在Promise解决之前立即注册。此外，Vue依赖返回的Promise去自动地处理位于Promise链中潜在的错误。

### Effect Flush Timing（Effect刷新的时间点）

Vue’s reactivity system buffers invalidated effects and flush them asynchronously to avoid unnecessary duplicate invocation when there are many state mutations happening in the same “tick”. Internally, a component’s update function is also a watched effect. When a user effect is queued, it is always invoked after all component update effects:

Vue的响应式系统缓冲失效的effects，当有多个状态变化发生在同一个”tick”中异步地刷新它们来避免不必要重复的调用。在内部，一个组件的更新函数也是一个被观察的effect。当一个用户的effect进入队列时，它总是会在组件的所有更新effects之后执行：

```html
<template>
  <div>{{ count }}</div>
</template>

<script>
  export default {
    setup() {
      const count = ref(0)

      watchEffect(() => {
        console.log(count.value)
      })

      return {
        count
      }
    }
  }
</script>
```

In this example:

在这个例子中：

*   The `count` will be logged synchronously on initial run.

    `count`变量会在初始执行时同步地打印。

*   When `count` is mutated, the callback will be called after the component has updated.

    当`count`被改变时，回调会在组件被更新之后调用。

Note the first run is executed before the component is mounted. So if you wish to access the DOM (or template refs) in a watched effect, do it in the mounted hook:

注意第一次run在组件被挂载之前执行。所以如果你想在一个观察的effect中获取DOM（或者模板的refs）时，可以在`onMounted`这个钩子中调用`watchEffect`

```typescript
onMounted(() => {
  watchEffect(() => {
    // access the DOM or template refs
  })
})
```

In cases where a watcher effect needs to be re-run synchronously or before component updates, we can pass an additional options object with the `flush` option (default is `&#39;post&#39;`):

某些情况下一个观察的effect需要同步的或者在组件更新之前重新执行，可以传入一个带有`flush`参数的额外的参数对象（`flush`默认的值为`&#39;post&#39;&#39;`）

```typescript
// fire synchronously
watchEffect(
  () => {
    /* ... */
  },
  {
    flush: 'sync'
  }
)

// fire before component updates
watchEffect(
  () => {
    /* ... */
  },
  {
    flush: 'pre'
  }
)
```

### Watcher Debugging（观察者调试）

The `onTrack` and `onTrigger` options can be used to debug a watcher’s behavior.

使用`onTrack`和`onTrigger`参数可以调试一个观察者的行为。

*   `onTrack` will be called when a reactive property or ref is tracked as a dependency

    `onTrack`将会在当响应式属性或者ref对象作为一个依赖被收集时被调用

*   `onTrigger` will be called when the watcher callback is triggered by the mutation of a dependency

    `onTrigger`将会在当观察者回调在一个依赖改变时触发时被调用。

Both callbacks will receive a debugger event which contains information on the dependency in question. It is recommended to place a `debugger` statement in these callbacks to interactively inspect the dependency:

两个回调函数都会接收一个包含相关依赖信息的debugge事件。推荐书写一条`debugger`语句在这些回调中来互动式地检查这些依赖：

```typescript
watchEffect(
  () => {
    /* side effect */
  },
  {
    onTrigger(e) {
      debugger
    }
  }
)
```

`onTrack` and `onTrigger` only works in development mode.

`onTrack`和`onTrigger`只能工作在开发模式下。

*   Typing（类型）

```typescript
function watchEffect(
  effect: (onInvalidate: InvalidateCbRegistrator) => void,
  options?: WatchEffectOptions
): StopHandle

interface WatchEffectOptions {
  flush?: 'pre' | 'post' | 'sync'
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
}

interface DebuggerEvent {
  effect: ReactiveEffect
  target: any
  type: OperationTypes
  key: string | symbol | undefined
}

type InvalidateCbRegistrator = (invalidate: () => void) => void

type StopHandle = () => void
```

## `watch`

The `watch` API is the exact equivalent of the 2.x `this.$watch` (and the corresponding `watch` option). `watch` requires watching a specific data source, and applies side effects in a separate callback function. It also is lazy by default - i.e. the callback is only called when the watched source has changed.

`watch`这个API和2.x版本的`this.$watch`准确的相等（和相应的`watch`参数）。`watch`需要观察一个具体的数据源，并在一个分离的回调函数中执行副作用。它也是默认惰性的 - 即回调只有在观察的源被改变时才会执行。

*   Compared to `watchEffect`, `watch` allows us to:

    和`watchEffect`比较，`watch`允许我们：

        *   Perform the side effect lazily;

    惰性地执行一个副作用的effect；

        *   Be more specific about what state should trigger the watcher to re-run;

    在哪一个状态应该触发观察者去重新执行这个方面更加的具体；

        *   Access both the previous and current value of the watched state.

    可以获取观察状态的前一个值和当前值。

*   Watching a Single Source

    观察一个单独的源

    A watcher data source can either be a getter function that returns a value, or directly a ref:

    一个观察者的数据源可以是返回一个值的getter函数，或者时直接一个ref对象：

```typescript
// watching a getter
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (count, prevCount) => {
    /* ... */
  }
)

// directly watching a ref
const count = ref(0)
watch(count, (count, prevCount) => {
  /* ... */
})
```

*   Watching Multiple Sources

    观察多个源

    A watcher can also watch multiple sources at the same time using an Array:

    一个观察者也可以使用数组在同一时间观察多个源：

```typescript
watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
  /* ... */
})
```

*   Shared Behavior with `watchEffect`

    和`watchEffect`共享的行为

    `watch` shares behavior with `watchEffect` in terms of <a href>manual stoppage</a>, <a href>side effect invalidation</a> (with `onInvalidate` passed to the callback as the 3rd argument instead), <a href>flush timing</a> and <a href>debugging</a>.

    `watch`就手动停止，副作用失效回调（`onInvalidate`作为回调函数的第三个参数传递进来），刷新时间点和调试方面来说具有共享的行为。

* Typing（类型）

```typescript
// wacthing single source
function watch<T>(
  source: WatcherSource<T>,
  callback: (
    value: T,
    oldValue: T,
    onInvalidate: InvalidateCbRegistrator
  ) => void,
  options?: WatchOptions
): StopHandle

// watching multiple sources
function watch<T extends WatcherSource<unknown>[]>(
  sources: T
  callback: (
    values: MapSources<T>,
    oldValues: MapSources<T>,
    onInvalidate: InvalidateCbRegistrator
  ) => void,
  options? : WatchOptions
): StopHandle

type WatcherSource<T> = Ref<T> | (() => T)

type MapSources<T> = {
  [K in keyof T]: T[K] extends WatcherSource<infer V> ? V : never
}

// see `watchEffect` typing for shared options
interface WatchOptions extends WatchEffectOptions {
  immediate?: boolean // default: false
  deep?: boolean
}
```

## 后记

终于翻译完了，有疑问的地方是我在reactivity这个包中没有看见`watch`和`watchEffect`这两个API，不过看到了应该是它们两个的基础的`effect`API，这阵子也在看这个包的源码，也是看懂了一些。

真的是很奇怪，明明每一行代码基本看得懂，但是连在一起就是一头雾水…
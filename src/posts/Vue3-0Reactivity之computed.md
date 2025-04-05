---
title: Vue3.0Reactivity之computed
key: 1591932799date: 2020-06-12 11:33:19
updated: 2023-02-13 18:28:43
tags: 
 - JavaScript
 - Vue
categories:
 - 编程
---


# 前言

这次讲讲`computed`这个API

<!-- more -->

# `computed`

`computed`在Vue2也有体现，基本上是一个缓存比较大的计算量的值的一种方法，并且能在依赖的值发生变化的时候自动的计算更新后的值。

在我们前面的翻译API的文章中知道了Vue3中`computed`接收一个getter函数，返回了一个`ref`的对象。

可以用一个例子来简单的看下Vue3中`computed`的使用。

```typescript
const {reactive, effect, computed} = VueReactivity;

const o = {
  name: "lwf"
};

const r = reactive(o);

const c = computed(() => r.name + " --- computed");

effect(() => {
  console.log(r.name);
});
```

这时候我们尝试改变`r.name`的值，然后再输出`c.value`的值

![](https://i.loli.net/2020/05/04/FZPTJUfeywNV9mS.gif)

在更新了响应式对象`r`的`name`属性之后，它的依赖，也就是我们写的effect便执行了，然后再打印`c.value`，发现它的值已经发生了改变。

接下来，我们就来探究这个API是如何做到这种效果的。

首先，老套路，找到它的定义

```typescript
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly')
        }
      : NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  let dirty = true
  let value: T
  let computed: ComputedRef<T>

  const runner = effect(getter, {
    lazy: true,
    // mark effect as computed so that it gets priority during trigger
    computed: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(computed, TriggerOpTypes.SET, 'value')
      }
    }
  })
  computed = {
    _isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      track(computed, TrackOpTypes.GET, 'value')
      return value
    },
    set value(newValue: T) {
      setter(newValue)
    }
  } as any
  return computed
}
```

这个函数很长，但总体上可以分成三个部分

* 匹配参数
* 建立依赖
* 返回构建的`computed`对象（也就是`ref`对象）

## 匹配参数

```typescript
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly')
        }
      : NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  // ...
}
```

这里判断了传进来的参数是不是一个函数，如果是，那么这个函数就作为一个getter（此时就是只读的），如果不是，那就分别取`get`和`set`属性做为getter和setter。

一般而言，使用`computed`时，都是直接传递一个函数进去，也就是上面我举的例子一样，基本上用不到setter。

## 建立effect（依赖）

```typescript
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  // ...
  let dirty = true
  let value: T
  let computed: ComputedRef<T>
  const runner = effect(getter, {
    lazy: true,
    // mark effect as computed so that it gets priority during trigger
    computed: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(computed, TriggerOpTypes.SET, 'value')
      }
    }
  })
  // ...
}
```

这里构建了一个effect，把传进来的getter传进了`effect`这个API，通过之前`reactive`API的学习，我们知道，

`effect`传进一个函数，把这个函数和这个函数内部使用的响应式变量建立关联，当这些响应式变量发生改变时，就重新执行这个传进来的函数。

但是这个构建的effect和我们之前似乎有点不同，额外的传入了一个参数。

首先是`lazy`，这个参数的意思是，不马上执行（也就是自动）这个函数来建立依赖，而是通过返回的函数来手动的来收集依赖。

这里的`lazy`在`effect`的源码中非常简单

```typescript
export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ
): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  // 下面为lazy参数
  if (!options.lazy) {
    effect()
  }
  return effect
}
```

可以简单的理解，`lazy`为假，就自动帮你执行了这个在函数内部创建出来的effect，也就是自动的收集依赖。如果为真，直接返回，可以由用户自己执行来改变收集依赖的时机。

第二个参数为`computed`，这个参数上面有一个注释，翻译过来为：给这个effect添加一个标记，以至于它可以在trigger时，优先的执行。

第三个参数为`scheduler`，传入的为一个函数。

这里我们可以回到前面看`trigger`函数的实现。

```typescript
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  // ...
  const effects = new Set<ReactiveEffect>()
  // 这是一个计算属性的effect的Set
  const computedRunners = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || !shouldTrack) {
          // 根据computed这个参数来分类effect
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
  
  // ...
  
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
    // 如果scheduler有值，就执行scheduler，否则就执行effect。
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }

  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  // 重点：计算effect需要提前运行。这样可以使得计算effect的getter的值在任何一般的effect运行之前失效
  computedRunners.forEach(run)
  effects.forEach(run)
}
```

具体的重点都写在代码的注释中了，简单讲就是分effect为两类，一类是一般effect，一类是计算effect，当一个响应式对象发生变化时，先执行它的计算effect，再执行它的一般effect。

为啥要先执行计算effect呢？这个我们最后再说。

## 返回构建的`computed`对象（也就是`ref`对象）

我们再看最后一段代码

```typescript
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  // ...
  computed = {
    _isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      track(computed, TrackOpTypes.GET, 'value')
      return value
    },
    set value(newValue: T) {
      setter(newValue)
    }
  } as any
  return computed
}
```

最后就是构建一个ref对象，和一般的ref对象不同的是，计算ref有一个`effect`的属性，暴露了通过参数生成的effect对象，可以让我们停止这个effect。

这个构建的ref对象和我们之前通过`ref`构建的ref对象基本很像，但是在getter中出现了一个判断。判断了`dirty`的值来执行`runner`也就是effect。

那这个`dirty`是干什么用的呢？我们可以用开头举的例子。

```typescript
const {reactive, effect, computed} = VueReactivity;
const o = {
  name: "lwf"
};

const r = reactive(o);
const c = computed(() => r.name + " --- computed");

effect(() => {
  console.log(r.name);
});
```

当我们打印`c.value`时，这是触发了`value`的getter，也就是到了 

```typescript
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  // ...
  computed = {
    // ...
    get value() {
      // 此时运行到这里
      if (dirty) {
        value = runner()
        dirty = false
      }
      track(computed, TrackOpTypes.GET, 'value')
      return value
    },
    // ...
  } as any
  // ...
}
```

接下来我们判断了`dirty`，`dirty`初始化是`true`的，所以会执行if块。

这时候执行了`runner`，也就是响应式对象`r`会收集到传入`computed`的函数。

`runner`的返回值也就是传入函数的返回值，赋给了`value`变量，然后置`dirty`变量为`false`，接着便是收集依赖，返回`value`变量了。

到这，我们就获得了computed对象的`value`属性了

如果现在我们再一次的运行`c.value`，依然会调用这个属性的getter，但是由于`dirty`变量为`false`，直接返回了`value`对象。

聪明的人可能明白了，`dirty`是用来判断依赖到的响应式对象是否发生改变的。

没改变的话，直接返回缓存的值，也就避免了多次的计算。

ok，这时，我执行了`r.name = &#39;index&#39;`，也就是会触发响应式对象`r`的所有依赖effect执行。

这时，响应式对象`r`的依赖中是有我们传入`computed`的函数所构成的effect的。

在`trigger`函数中，有一个`run`函数

```typescript
export function trigger(
  // ...
) {
  // ...
  
  const run = (effect: ReactiveEffect) => {
    // ...
    // 如果scheduler有值，就执行scheduler，否则就执行effect。
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }

  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  // 重点：计算effect需要提前运行。这样可以使得计算effect的getter的值在任何一般的effect运行之前失效
  computedRunners.forEach(run)
  effects.forEach(run)
}
```

这个`run`函数就是执行我们的effect的，其中判断了`effect.options.scheduler`，为真就传入effect对象并执行，也就是`effect.options.scheduler(effect)`，为假就直接执行effect对象。

还记得我们之前通过传入函数生成一个计算effect时传入的额外参数吗？

```typescript
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  const runner = effect(getter, {
    // ...
    scheduler: () => {
      //这里就是当计算effect依赖的响应式对象发生改变时，会执行的代码段。
      if (!dirty) {
        dirty = true
        trigger(computed, TriggerOpTypes.SET, 'value')
      }
    }
  })
}
```

这里判断了`dirty`变量，如果为`false`，就置为`true`并触发这个计算ref的依赖，`dirty`为假的意思就是此时计算ref所依赖的响应式对象已经发生改变了。

前面我们已经打印了`c.value`的值了，这时的`dirty`就是`false`了，进入了if的代码块。置为`dirty`为`true`，触发了计算ref的依赖。

如果一直没有取`value`属性的值，那么就没有必要去触发计算ref的依赖。在第一次获取计算ref的值（`.value`）之前，它的值都是不确定的（也不能说不确定，就是会根据它所依赖响应式对象的最新值来进行计算并返回）。

这时我们再次打印`c.value`，由于响应式对象`r`的改变使得`dirty`变为了`true`，就又要再执行一次`runner`来获取最新的值。

最后，为什么要先执行响应式对象的计算effect呢？

很简单，我们用下面的代码来理解

```typescript
const {reactive, effect, computed} = VueReactivity;

const o = {
  name: "lwf"
};

const r = reactive(o);

const c = computed(() => r.name + " --- computed");

effect(() => {
  console.log(r.name);
  console.log(c.value);
});
```

这时运行`r.name = &#39;index&#39;`的话，这时会打印两次effect

```text
// r对象改变触发了effect
'index'
'index --- computed'
// c对象改变触发了effect
'index'
'index --- computed'
```

如果你没有先执行计算effect的话，此时对于该计算ref的`dirty`还是`false`，也就是没有通知到计算ref对象此时依赖的响应式对象发生了变化，使用到了旧的值。也就是打印了

```text
// r对象改变触发了effect
'index'
// c的getter中dirty还是为false，使用到了旧的值。
'lwf --- computed'
// c对象改变触发了effect
'index'
'index --- computed'
```

至此，`computed`API的基本流程基本上就讲完了。不得不说实现上确实很巧妙，用到了很多的闭包。

# 后记

还差最后一个`readonly`API了，这个和`reactive`差不多，这几天应该就可以写出来了，如果我写的有错，希望可以指出，非常感谢！~
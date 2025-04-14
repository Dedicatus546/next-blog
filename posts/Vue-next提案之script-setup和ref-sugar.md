---
title: Vue@next提案之script setup和ref sugar
key: 1604761304date: 2020-11-07 23:01:44
updated: 2023-02-13 18:28:45
tags:
 - Vue
 - JavaScript
categories:
 - 翻译
---


# 前言

针对`Vue@next`对组件的编写上的提案--`<script setup>`，以及`ref`的语法糖

这个提案感觉尤大很喜欢，大部分对`<script setup>`的特性很喜欢，因为减少了重复代码的编写

针对`ref`语法糖下面的回复基本上不喜欢的居多

本文翻译下提案以及尤大的相关回复，挺有趣的

<!-- more -->

针对此RFC的讨论：[New script setup and ref sugar](https://github.com/vuejs/rfcs/pull/222)
完整的RFC：[rfcs/0000-script-setup.md at script-setup](https://github.com/vuejs/vue-next/pull/2532)

# 正文

## Summary（摘要）

> Introduce a new script type in Single File Components: `<script setup>`, which exposes all its top level bindings to the template.
> Introduce a compiler-based syntax sugar for using refs without `.value` inside `<script setup>`.
> Note: this is intended to replace the current `<script setup>` as proposed in #182.

针对单文件组件的`script`标签的新的属性：`<script setup> ... </script>`，暴露了它自身所有的顶层变量，绑定到模板`template`上
在`<script setup>`中，一个针对使用`refs`无需`.value`的基于编译时的语法糖。
注意：这个提案的目的是为了取代[#182](https://github.com/vuejs/rfcs/pull/182)提案中的`<script setup>`部分

## Basic example（基本例子）

### `<script setup>` now directly exposes top level bindings to template

`<script setup>`现在会直接暴露顶层变量绑定到模板上，例子如下

```html
<script setup>
// imported components are also directly usable in template
// 导入的组件也可以直接在模板内使用
import Foo from './Foo.vue'
import { ref } from 'vue'

// write Composition API code just like in a normal setup()
// but no need to manually return everything
// 就像一个正常的setup()函数一样编写Composition API
// 但是不需要手动地返回任何东西
const count = ref(0)
const inc = () => { count.value++ }
</script>

<template>
  <!--使用了Foo组件，类型为ref的count变量，以及inc函数-->
  <Foo :count="count" @click="inc" />
</template>
```

经过编译之后如下

```html
<script setup>
import Foo from './Foo.vue'
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(1)
    const inc = () => { count.value++ }

    return {
      Foo, // see note below
      count,
      inc
    }
  }
}
</script>

<template>
  <Foo :count="count" @click="inc" />
</template>
```

### `ref:` sugar makes use of refs more succinct

`ref:`语法糖使得refs对象的使用变得更加的简洁，例子如下

```html
<script setup>
// declaring a variable that compiles to a ref
// 声明一个在编译时转为ref类型的一个变量
ref: count = 1

function inc() {
  // the variable can be used like a plain value
  // 变量可以像一个普通的值一样使用
  // 注：ref在模板中是可以自动拆箱的，但是如果我们在setup函数内的逻辑，是需要.value来取值进行操作的
  count++
}

// access the raw ref object by prefixing with $
// 通过添加前缀$来获取一个原ref对象
console.log($count.value)
</script>

<template>
  <button @click="inc">{{ count }}</button>
</template>
```

经过编译之后

```html
<script setup>
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(1)

    function inc() {
      count.value++
    }

    console.log(count.value)

    return {
      count,
      inc
    }
  }
}
</script>

<template>
  <button @click="inc">{{ count }}</button>
</template>
```

## Motivation（动机）

> This proposal has two main goals:

这个提案主要有两个目的

> Reduce verbosity of Single File Component `<script>` by directly exposing its context to the template.

> We have a prior proposal for `<script setup>` [here](https://github.com/vuejs/rfcs/blob/sfc-improvements/active-rfcs/0000-sfc-script-setup.md), which is currently implemented (but marked as experimental). The old proposal opted for the `export` syntax so that the code would play well with unused variable checks.

> This proposal takes a different direction based on the premise that we can offer customized linter rules in `eslint-plugin-vue`. This allows us to aim for the most succinct syntax possible.

通过直接暴露自身上下文给模板来减少单文件组件中冗长的`<script>`标签中的代码

之前有过一个对`<script setup>`的提案，[点我跳转](https://github.com/vuejs/rfcs/blob/sfc-improvements/active-rfcs/0000-sfc-script-setup.md)，现在这个特性已经实现了（但是标记为实验性质的特性）。旧的提案选择了`export`语法，因此代码可以在没有使用变量检查的情况下很好的运行。

这个提案选择了一个不同的方向，基于如果我们可以在`eslint-plugin-vue`提供一个定制的linter规则。这样使得我们可以尽可能使用最简单的语法。

> Improve ergonomics of refs with the `ref:` syntax sugar.

> Ever since the introduction of the Composition API, one of the primary unresolved questions is the use of refs vs. reactive objects. It can be cumbersome to use `.value` everywhere, and it is easy to miss if not using a type system. Some users specifically lean towards using `reactive()` exclusively so that they don't have to deal with refs.

> The existence of ref is mostly a design trade-off due to the constraints of the language we are working with: JavaScript. JavaScript does not provide a native way to pass reactive bindings around without wrapping it with an object. This means that **it is impossible to use refs like normal variable bindings without altering or augmenting JavaScript semantics**.

通过`ref:`语法糖使得refs类型更加符合人的直觉。

自从Composition API的产生，一个没有解决的主要问题就是使用ref还是reactive。在每个地方`.value`是很麻烦的，在没有使用类型系统的情况下很容易忘记添加`.value`。一些用户明确只使用`reactive()`这样就可以避免去处理ref情况

由于我们所使用的JavaScript语言的约束，ref的存在大体上是的一个设计权衡。JavaScript无法提供一个原生的方式，即无法在没有通过一个对象包装的情况下进行响应式地绑定。这意味着在**没有改变和增加JavaScript语义的情况下像正常变量绑定一样使用ref是不可能的**

> - There has been a proposal for [adding native refs to JavaScript](https://github.com/rbuckton/proposal-refs), but it was designed to address a slightly different problem and doesn't seem to have received much attention.
> - A prominent example of altering JavaScript semantics in return for succinct syntax is `Svelte`. It [appropriates a number of JavaScript syntax to express framework-specific behavior](https://github.com/vuejs/rfcs/blob/script-setup/active-rfcs/0000-script-setup.md#svelte-syntax-details).

- 虽然有一个添加原生JavaScript的ref类型的提案，但是它只是被用于解决一个略微不同的问题，似乎没有受到太多的关注
- 改变JavaScript返回语义使其简洁的一个著名的例子是`Svelte`，它挪用了JavaScript中的数字语法来表示框架特定的行为。

> In the past, we have tried to stick to strict JavaScript semantics as much as possible. Deviating from standard JavaScript semantics has number of drawbacks, but we believe there is room for a pragmatic trade-off where "breaking out of the box" a little bit can result in substantial improvements in developer experience.

在过去，我们试着尽可能地坚持严格的JavaScript语义。偏离标准地JavaScript语义会带来许多的缺点，但是我们相信稍微的跳出一点实用权衡“屋子”可以为开发者的实践带来实质性的改善。

## Detailed Design（详细的设计）

### `<script setup>`

> To opt-in to the syntax, add the setup attribute to the `<script>` block:

为了加入语法，在`<script>`块上加入`setup`属性

```html
<script setup>
// syntax enabled
</script>
```

> **Top level bindings are exposed to template**

> Any top-level bindings (both variables and imports) declared inside `<script setup>` are directly exposed to the template render context:

**顶层的绑定会暴露给模板**

声明在`<script setup>`块中的任何顶层的绑定（变量和import）会直接暴露给模板渲染的上下文

```html
<script setup>
import Foo from './Foo.vue'
const msg = 'Hello!'
</script>

<template>
  <!--使用了Foo组件和msg变量-->
  <Foo>{{ msg }}</Foo>
</template>
```

经过编译之后如下

```html
<script>
import Foo from './Foo.vue'

export default {
  setup() {
    const msg = 'Hello!'

    return {
      // 导出了组件
      Foo,
      // 导出了变量
      msg
    }
  }
}
</script>

<template>
  <Foo>{{ msg }}</Foo>
</template>
```

> Note: The SFC compiler also extracts binding metadata from `<script setup>` and use it during template compilation. Therefore in the template, `Foo` can be used as a component even though it's returned from `setup()` instead of registered via `components` option.

注意：单文件组件编译器也会提取`<script setup>`中绑定的元数据，并在模板编译的时候使用。因此在模板中，`Foo`可以被当成一个组件来使用，即使它是通过`setup()`返回的而不是在`components`选项中注册的。

> **Setup Signature**

> The value of the `setup` attribute will be used as the arguments of the `setup()` function:

**`setup`标识**

`setup`属性的值被用作`setup()`函数的参数

```html
<!--这里给setup设置的值可以理解为和setup()函数的参数一样-->
<script setup="props, { emit }">
// 使用props
console.log(props.msg)
emit('foo')
</script>
```

经过编译之后如下

```html
<script>
export default {
  setup(props, { emit }) {
    console.log(props.msg)
    emit('foo')
  }
}
</script>
```

> **Declaring Component Options**

> `export default` can still be used inside `<script setup>` for declaring component options such as props. Note that the exported expression will be hoisted out of `setup()` scope so it won't be able to reference variables declared in `<script setup>` (a compile error will be emitted in this case).

**声明组件的选项**

`export default`仍然可以在`<script setup>`中使用，来声明组件的选项比如props。注意导出表达式会被提升到`setup()`作用域之外，所以它不能引用到声明在`<script setup>`的变量。（在这个情况下会报编译错误）

```html
<script setup="props">
export default {
  props: {
    msg: String
  } 
}

console.log(props.msg)
</script>
```

经过编译之后如下

```html
<script>
export default {
  ...({
    props: {
      msg: String
    }
  }),
  setup(props) {
    console.log(props.msg)
  }
}
</script>
```

> **Top level await**

> Top level `await` can be used inside `<script setup>`. The resulting `setup()` function will be made `async`:

顶层的await

在`<script setup>`内顶层使用`await`语法，最终的`setup()`函数会被设置为`async`

```html
<script setup>
const post = await fetch(`/api/post/1`).then(r => r.json())
</script>
```

经过编译后如下

```html
<script>
export default {
  async setup() {
    const post = await fetch(`/api/post/1`).then(r => r.json())

    return { post }
  }
}
</script>
```

> **Ref Syntax**

> Code inside `<script setup>` can use a special `ref:` declaration to declare variables that can be used as a normal variable, but are compiled into refs:

**Ref语法**

在`<script setup>`内可以使用特殊的`ref:`声明来声明正常的变量，但是会被编译成ref类型

```html
<script setup>
ref: count = 0

function inc() {
  count++
}
</script>

<template>
  <button @click="inc">{{ count }}</button>
</template>
```

> `ref: count = 0` is a [labeled statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label) which is syntactically valid in both JS/TS. However, we are using it as a variable declaration here. The compiler will:
> 1. Convert it to a proper variable declaration
> 2. Wrap its initial value with ref()
> 3. Rewrite all references to count into count.value.

`ref: count = 0`是基于标记语句，这种语句在JS和TS上都是语义上合法的，然而在这里我们把它作为变量声明来使用，经过编译后如下

```javascript
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    function inc() {
      count.value++
    }

    return {
      count,
      inc
    }
  }
}
```

> Note that the syntax is opt-in: all Composition APIs can be used inside `<script setup>` without ref sugar:

注意语法是可选的，所有的Composition API可以在`<script setup>`内不使用ref的语法糖

```html
<script setup>
import { ref } from 'vue'

const count = ref(0)

function inc() {
  count.value++
}
</script>

<template>
  <button @click="inc">{{ count }}</button>
</template>
```

> **Accessing Raw Ref**

> It is common for an external composition function to expect a raw ref object as argument, so we need a way to access the raw underlying ref object for bindings declared via `ref:`. To deal with that, every `ref:` binding will have a corresponding `$`-prefixed counter part that exposes the raw ref:

**获取原来的ref**

在一个外部的composition函数接收一个原生的ref对象作为参数是很常见的行为，所以我们需要有一种方式来获取通过`ref:`声明的原生的底层ref对象进行绑定。为了解决这个问题，每个`ref:`绑定会有一个相应的前缀`$`名称来暴露原生的ref

```javascript
ref: count = 1
console.log($count.value) // 1

// $count 表示原生的ref对象，可以使用.value来进行取值
$count.value++
// 直接输出，会被编译成count.value
console.log(count) // 2

watch($count, newCount => {
  console.log('new count is: ', newCount)
})
```

经过编译之后如下

```javascript
const count = ref(1)
console.log(count.value) // 1

count.value++
console.log(count.value) // 2

watch(count, newCount => {
  console.log('new count is: ', newCount)
})
```

> **Interaction with Non-Literals**

> `ref:` will wrap assignment values with `ref()`. If the value is already a ref, it will be returned as-is. This means we can use `ref:` with any function that returns a ref, for example `computed:`

**非字面量相互作用（emmm，这里不知道要怎么翻译...）**

`ref:`会通过`ref()`函数包装分配的值，如果值早已是一个ref对象，它会按原样被返回，这意味着我们可以在任何返回一个ref对象的函数使用`ref:`，比如`computed`

```javascript
import { computed } from 'vue'

ref: count = 0
ref: plusOne = computed(() => count + 1)
// 直接使用plusOne，而不需要plusOne.value
// 也就是ref: 定义不管值是基本类型还是ref类型，一律可以直接使用（无需.value），会自动编译成.value
console.log(plusOne) // 1
```

经过编译之后如下

```javascript
import { computed, ref } from 'vue'

const count = ref(0)
// `ref()` around `computed()` is a no-op here since return value
// from `computed()` is already a ref.
// `ref()`包装`computed()`并不会产生操作，因为从`computed()`返回的值已经是一个ref对象了。
// 也就是说，下面的语句，等同于const plusOne = computed(() => count.value + 1)，并且这两个对象相等（===）
// 因为在创建ref时，会判断对象上是否存在__v_isRef标志，如果有直接返回，而computed的返回值是存在这个标志的，可以说成computed是一种特殊的ref
const plusOne = ref(computed(() => count.value + 1))
```

> Or, any custom composition function that returns a ref:

或者，任何返回一个ref的composition函数

```javascript
import { useMyRef } from './composables'

ref: myRef = useMyRef()
console.log(myRef) // 不需要去 .value
```

经过编译后如下

```javascript
import { useMyRef } from './composables'
import { ref } from 'vue'

// if useMyRef() returns a ref, it will be untouched
// otherwise it's wrapped into a ref
// 如果useMyRef()返回了一个ref，那么不变，否则会被包装成一个ref对象
const myRef = ref(useMyRef())
console.log(myRef.value)
```

> Note: if using TypeScript, this behavior creates a typing mismatch which we will discuss in TypeScript Integration below.

注意：如果使用Typescript，这种行为导致类型不匹配，我们将会在下文的TypeScript Integration进行讨论

> **Destructuring**

> It is common for a composition function to return an object of refs. To declare multiple ref bindings with destructuring, we can use [Destructuring Assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment):

**解构**

对于一个composition函数来说，返回一个ref对象是很常见的，为了使用解构来声明多重ref绑定，我们可以使用解构赋值

```javascript
ref: ({ x, y } = useMouse())
```

经过编译之后如下

```javascript
import { ref } from 'vue'

const { x: __x, y: __x } = useMouse()
const x = ref(__x)
const y = toRef(__y)
```

> Note: object destructuring must be wrapped in parens - this is JavaScript's own syntax requirement to avoid ambiguity with a block statement.

注意，对象解构必须用括号包起来，这时Js自身语法的要求，为了避免在一个块声明中产生模棱两可的语义。

> **TypeScript Integration**

> To type setup arguments like props, slots and emit, simply declare them:

**TypeScript集成**

为了给setup的参数，比如props，slots和emit赋予类型，可以简单地声明

```html
<script setup="props, { emit, slots }" lang="ts">
import { VNode } from 'vue'

// declare props using TypeScript syntax
// this will be auto compiled into runtime equivalent!
// 使用TypeScript声明props，
// 在运行环境会被自动编译
declare const props: {
  msg: string
}

// declare allowed emit signatures via overload
// 声明允许emit签名进行重载
declare function emit(e: 'add', msg: string): void
declare function emit(e: 'remove', id: number): void

// you can even declare slot types
// 甚至可以声明slot的类型
declare const slots: {
  default: () => VNode[]
}

emit('add', props.msg)
</script>
```

> Runtime props and emits declaration is automatically generated from TS typing to remove the need of double declaration and still ensure correct runtime behavior. Note that the props type declaration value cannot be an imported type, because the SFC compiler does not process external files to extract the prop names.

运行时props和emits的声明从TS类型中自动生成，删除重复的声明以确保正确的运行时的行为。注意，props类型声明不能是一个导入的类型，因为单文件组件编译器无法处理外部的文件来提取prop的字段

经过编译后如下

```html
<script lang="ts">
import { VNode, defineComponent } from 'vue'

declare function __emit__(e: 'add', msg: string): void
declare function __emit__(e: 'remove', id: number): void

declare const slots: {
  default: () => VNode[]
}

export default defineComponent({
  // runtime declaration for props
  // 运行时的props声明，在编译前是没写这个的
  props: {
    msg: { type: String, required: true }
  } as unknown as undefined,

  // runtime declaration for emits
  // 运行时的emit声明
  emits: ["add"] as unknown as undefined,

  setup(props: { msg: string }, { emit }: {
    emit: typeof __emit__,
    slots: slots,
    attrs: Record<string, any>
  }) {
    emit('add', props.msg)
    return {}
  }
})
</script>
```

> Details on runtime props generation:
> - In dev mode, the compiler will try to infer corresponding runtime validation from the types. For example here `msg: String` is inferred from the `msg: string` type.
> - In prod mode, the compiler will generate the array format declaration to reduce bundle size (the props here will be compiled into `['msg']`)
> - The generated props declaration is force casted into `undefined` to ensure the user provided type is used in the emitted code.
> - The emitted code is still TypeScript with valid typing, which can be further processed by other tools.

在生成的运行时props的细节
- 开发模式下，编译器尝试从类型中推断对应的运行时校验。比如例子的`msg: String`，从`msg: string`类型推导而来。
- 生产模式下，编译器会生成数组格式的props声明，目的为减少打包生成的体积（在这里props会被编译成`['msg']`）
- 生成的props声明被强制转成`undefined`，以确保生成的代码使用了用户提供的类型。
- 生成的代码仍然是合法类型的Typescript，可以被其他工具进一步的处理。

> **Ref Declaration and Raw Ref Access**

> Unlike normal variable declarations, the `ref:` syntax has some special behavior in terms of typing:
> - The declared variable always has the raw value type, regardless of whether the assigned value is a `Ref` type or not (always unwraps)
> - The accompanying `$`-prefixed raw access variable always has a `Ref` type. If the right hand side value type already extends `Ref`, it will be used as-is; otherwise it will be wrapped as `Ref<T>`.
> The following table demonstrates the resulting types of different usage:

**Ref的声明以及原生Ref对象的获取**

和普通的变量声明不同，就类型而言`ref:`语法有一些特别的行为：
- 声明变量总是含有原始值的类型，尽管被分配的值是一个Ref类型或则不是一个Ref类型（总是会被解除包装）
- 伴随的`$`前缀的原生访问的变量总为一个`Ref`类型。如果右值类型早已为一个继承自Ref的类型，将会直接使用它，否则将会被`Ref<T>`函数所包装

| source                                           | resulting type for `count`                                | esulting type for `$count`    |
|:-------------------------------------------------|:----------------------------------------------------------|:------------------------------|
| `ref: count = 1`                                 | `number`                                                  | `Ref<number>`                 |
| `ref: count = ref(1)`                            | `number`                                                  | `Ref<number>`                 |
| `ref: count = computed(() => 1)`                 | `number`                                                  | `ComputedRef<number>`         |
| `ref: count = computed({ get:()=>1, set:_=>_ })` | `number`                                                  | `WritableComputedRef<number>` |

> How to support this in Vetur is discussed in the appendix.

如何使得Vetur支持这个特性在附录中讨论

> **Usage alongside normal `<script>`**

> There are some cases where the code must be executed in the module scope, for example:
> - Declaring named exports
> - Global side effects that should only execute once.
> In such cases, a normal `<script>` block can be used alongside `<script setup>`:

**和正常的`<script>`标签使用**

在一些情况代码必须在模块作用域下执行，比如
- 声明具名的导出
- 只会执行一次的全局副作用
在这些情况下，一个正常的`<script>`块可以与`<script setup>`一起使用

```html
<script>
performGlobalSideEffect()

// this can be imported as `import { named } from './*.vue'`
export const named = 1
</script>

<script setup>
let count = 0
</script>
```

经过编译后如下

```javascript
import { ref } from 'vue'

performGlobalSideEffect()

export const named = 1

export default {
  setup() {
    const count = ref(0)
    return {
      count
    }
  }
}
```

> **Usage restrictions**

> Due to the difference in module execution semantics, code inside `<script setup>` relies on the context of an SFC. When moved into external `.js` or `.ts` files, it may lead to confusions for both developers and tools. Therefore, `<script setup>` cannot be used with the `src` attribute.

**限制条件**

由于模块执行语义的不同，在`<script setup>`中的代码依赖单文件组件的上下文。当移动到外部的`.js`或者`.ts`文件时，它会使开发者和工具发生混乱，因此，`<script setup>`不能和src属性一起使用

### Drawbacks（缺点）

**Non-standard semantics**

**非标准的语义**

> Some users may have strong aversion against non-standard semantics in their code. Many of the Vue team members held such concerns as well. However, consider that:

一些用户可能强烈地厌恶代码中的非标准语义。许多Vue团队成员也有这样的顾虑，然而，考虑：

> - Single file components look like HTML but isn't actually HTML. It already has its own required structure and implied behavior on how it works as a Vue component. When you see a `*.vue` file, you know it works differently from plain HTML.
> - Vue templates are syntactically valid HTML, but the directives are essentially syntax extensions to express framework-specific intent.
> - JSX has a spec, but isn't a standard. It's a non-standard syntax extension to JavaScript.
> - TypeScript isn't a standard. It's a proprietary superset of JavaScript.
> - Decorators has struggled to advance into the spec, yet is being widely used and Angular is completely built on top of it.

- 单文件组件看起来像HTML但是实际上不是HTML，它早已拥有自己需要的结构和隐含的行为，隐含行为指它如何以一个Vue组件进行工作。当你看见一个`*.vue`文件，你明白它的运作与普通的HTML不同。
- Vue的模板语法上是合法的HTML，但是指令本质上是为了表达框架特定的意图的语法的扩展
- JSX是一种规范，但不是一种标准。是一种扩展了JavaScript的非标准语法
- TypeScript不是一种标准。是JavaScript的一个专门的超集。
- 装饰器特性还在努力地进入规范，但是它已经被广泛使用并且Angular在此之上进行完整构建

> Granted, adding non-standard semantics to JavaScript still creates added learning cost and mental overhead, so we should carefully evaluate the trade-offs of each addition.

即使这样，给JavaScript添加一个非标准的语义仍然增加了学习成本和精神负担，所以我们对每个添加的特性都小心地评估权衡。

> With that in mind, we believe `ref:`'s ergonomics value easily outweighs the cost. This is also why we are limiting this proposal to `ref:` only, since ref access is the only problem that requires alternative semantics to solve.

考虑到这一点，我们相信`ref:`的工程价值简单地胜过成本。这也是为什么我们仅限制提案为`ref:`，因为ref的访问是需要选择使用语义来解决的唯一问题。

> It can also be argued that the `ref:` syntax isn't far too removed from standard JavaScript. The following code is actually valid JavaScript in non-strict mode - if you copy it into an `.html` file, it will run as expected:

也可以说`ref:`语法和标准的JavaScript相距不远。下面的代码实际上在非严格模式下是合法的JavaScript代码，如果你把它复制到一个html文件中，它会按照预期执行

```html
<script>
ref: count = 0
console.log(count)
</script>
```

> **Yet Another Way of Doing Things**

**另一种编码方式**

> Some may think that Vue already has Options API, Composition API, and Class API (outside of core, as a library) - and this RFC is adding yet another way of authoring a component. This is a valid concern, but it does not warrant an instant dismissal. When we talk about the drawbacks of "different ways of doing the same thing", the more fundamental issue is the learning cost incurred when a user encounters code written in another format he/she is not familiar with. It is therefore important to evaluate the addition based on the trade-off between:

一些用于可能认为Vue已经有了基于配置的API, 基于组合的API, 和基于类的API（在核心代码外部，作为一个库），现在这个RFC又添加了另一种书写组件的方式。这是合理的忧虑，但是并不能保证立即得到解决。当我们讨论做相同事情的不同方式的缺点时，更基本的问题是带来了学习成本，用户会遇到以另一种他不熟悉的格式书写的代码，因此，通过以下方面的权衡来评估添加进来的特性非常的重要

> - How much benefit does the new way provide?
> - How much learning cost does the new way introduce?

- 新方式可以提供多大的益处
- 新方式的学习成本有多高

> This is what we did with the Composition API because we believed the scaling benefits provided by Composition API outweighs its learning cost.

我们使用Composition API因为我们认为Composition API带来的优势超过了它的学习成本。

> Unlike the relatively significant paradigm difference between Options API and Composition API, this RFC is merely syntax sugar with the primary goal of reducing verbosity. It does not fundamentally alter the mental model. Without the ref sugar, Composition API code inside `<script setup>` will be 100% the same with normal Composition API usage (except for the lack of the return object, which is tedious and unnecessary in the first place). The `ref:` sugar is an extension of the ref concept: for a user with prior knowledge of Composition API, it shouldn't be difficult to quickly understand how it works.

不像Options API和Composition API那样相对重大的样式差距，这个RFC仅仅是一个主要目的为减少冗长的一个语法糖，并不会从根本上改变心智模型。没有ref语法糖，在`<script setup>`书写的Composition API和普通的Composition API用法100%相同（除了缺少一个返回的对象，首先它就是啰嗦和没有必要的）。`ref:`语法糖是对ref概念的扩展，对于有先了解过Composition API的用户来说，快速地理解它地工作方式应该不会困难。

> That is to say - the syntax proposed in this RFC will not make the code more difficult to understand for someone who already knows Composition API. The initial time needed for a user to learn the syntax should be trivial compared to the improved DX in the long run.

也就是说，本RFC地语法提案不会使得那些已经知道Composition API的用户理解代码变得更困难。刚开始对于用户去学习语法与长远上改善相比是不重要的。

> **Requires dedicated tooling support**

**需要专门的工具支持**

> Appropriating the labeled statement syntax creates a semantic mismatch that leads to integration issues with tooling (linter, TypeScript, IDE support).

挪用了标签语句语法造成语义不匹配，导致工具整合问题（工具包括linter，TypeScript，IDE支持插件）

> This was also one of the primary reservations we had about Svelte 3's design when it was initially proposed. However since then, the Svelte team has managed to provide good tooling/IDE support via its language tools, even for TypeScript.

在提案最初提出时，借用了Svelte 3的设计也是一个主要的预想，但是自从那时起，Svelte的团队设法通过它的语言工具提供很棒的工具或者IDE的支持甚至是TypeScript支持。

> Vue's single file component also already requires dedicated tooling like `eslint-plugin-vue` and Vetur. The team has already discussed the technical feasibility of providing such support and there should be no hard technical blocks to make it work. We are confident that we can provide:

Vue的单文件组件也已经需要专用的工具比如`eslint-plugin-vue`和Vetur。Vue团队已经讨论提供支持的技术可行性，使它能够工作应该没有技术难点。我们有信心能够提供如下的特性：

> - Special syntax highlight of `ref:` declared variables in Vetur (so that it's more obvious it's a reactive variable)
> - Proper type check via Vetur and dedicated command line checker
> - Proper linting via `eslint-plugin-vue`

- 在Vetur中，对`ref:`定义的变量有特殊的语法高亮。（以便更明显的表示它是一个响应式的变量）
- 通过Vetur可以有正确的类型检查以及专门的命令行检查工具
- 通过`eslint-plugin-vue`可以有正确的代码规范

> **Extracting in-component logic**

**提取组件内的逻辑**

> The `ref:` syntax sugar is only available inside single file components. Different syntax in and out of components makes it difficult to extract and reuse cross-component logic from existing components.

`ref:`语法糖只能在单文件组件中使用。组件内外的不同语法使得从存在的组件中提取和重用跨组件的逻辑变得困难。

> This is still an issue for Svelte, since Svelte compilation strategy only works inside Svelte components. The generated code assumes a component context and isn't human-maintainable.

对于Svelte这仍然是一个问题，因为Svelte编译策略只可以在Svelte组件中工作。生成的代码是组件的上下文了，也就是无法进行人为的维护。

> In Vue's case, what we are proposing here is a very thin syntax sugar on top of idiomatic Composition API code. The most important thing to note here is that the code written with the sugar can be easily de-sugared into what a developer would have written without the sugar, and extracted into external JavaScript files for composition.

在Vue的情况下，这个提案是常用Composition API代码中的一个非常薄的语法糖。最重要的是书写带有语法糖的代码可以被简单地去糖，就像开发者编写不带语法糖的代码，然后提取到外部的文件中进行整合。

> Given a piece of code written using the `ref:` sugar, the workflow of extracting it into an external composition function could be:

一段使用了`ref:`语法糖的代码，提取到外部组合函数的工作流如下：

> - Select code range for the code to be extracted
> - In VSCode command input: `>vetur de-sugar ref usage`
> - Code gets de-sugared
> - Cut-paste code into external file and wrap into an exported function
> - Import the function in original file and replace original code.

- 选择提取代码的范围
- 在VSCode命令行输入`>vetur de-sugar ref usage`
- 代码被去糖
- 粘贴代码到外部文件中，包裹在一个导出函数中
- 在源文件中导入函数，然后取代源代码

## Alternatives（可选方案）

> **Comment-based syntax**

基于注释的语法

```html
<script setup>
import Foo from './Foo.vue'
import { computed } from 'vue'

// 添加'@ref'注释来表示

// @ref
let count = 1

function inc() {
  count++
}
</script>

<template>
  <Foo :count="count" @click="inc" />
</template>
```

> **Other related proposals**

其他相关的提案

> - [https://github.com/vuejs/rfcs/pull/182](https://github.com/vuejs/rfcs/pull/182) (current `<script setup>` implementation（当前`<script setup>`的实现）)
> - [https://github.com/vuejs/rfcs/pull/213](https://github.com/vuejs/rfcs/pull/213)
> - [https://github.com/vuejs/rfcs/pull/214](https://github.com/vuejs/rfcs/pull/214)

## Adoption strategy（采纳的策略）

> This feature is opt-in. Existing SFC usage is unaffected.

本特性是可选的，已存在的单文件组件用法不受影响。

## Unresolved questions（未解决的问题）

> Ref Usage in Nested Function Scopes

嵌套函数作用域下Ref的用法。

> Technically, `ref:` doesn't have to be limited to root level scope and can be used anywhere `let` declarations can be used, including nested function scope:

在技术上，`ref:`不能被限制在根作用下，应该可以在`let`定义之后的任何地方使用，包括嵌套的函数作用域：

```javascript
function useMouse() {
  ref: x = 0
  ref: y = 0

  function update(e) {
    x = e.pageX
    y = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return {
    x: $x,
    y: $y
  }
}
```

经过编译后如下

```javascript
function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(e) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return {
    x,
    y
  }
}
```

> This will make the compilation (and accompanying linter / language service support) more complicated - I'm not sure if it's better to limit `ref:` usage to top scope bindings only.

这会使得编译过程（伴随检测/语言服务的支持）变得复杂。我不确定限制`ref:`只在顶层作用域绑定的用法是否更好。

## Appendix（附录）

> **Transform API**

> The `@vue/compiler-sfc` package exposes the `compileScript` method for processing `<script setup>`:

**转换的API**

`@vue/compiler-sfc`包暴露了编译脚本的方法来处理`<script setup>`

```javascript
import { parse, compileScript } from '@vue/compiler-sfc'

const descriptor = parse(`...`)

if (descriptor.script || descriptor.scriptSetup) {
  const result = compileScript(descriptor) // returns SFCScriptBlock
  console.log(result.code)
  console.log(result.bindings) // see next section
}
```

> The compilation requires the entire descriptor to be provided, and the resulting code will include sources from both `<script setup>` and normal `<script>` (if present). It is the higher level tools' (e.g. vite or vue-loader) responsibility to properly assemble the compiled output.

编译过程需要提供整个描述符，结果代码将会包含从`<script setup>`和正常`<script>`（如果存在的话）的源代码。正确地组合编译输出地代码是一个高级工具（比如`vite`或者`vue-loader`）的责任

> **Template binding optimization**

> The `SFCScriptBlock` returned by `compiledScript` also exposes a `bindings` object, which is the exported binding metadata gathered during the compilation. For example, given the following `<script setup>`:

**模板绑定优化**

通过`compiledScript`返回的单文件组件的脚本块暴露了一个`bindings`对象，这个对象导出了绑定的在编译时收集的元数据。比如下面这段`<script setup>`代码

```html
<script setup="props">
export const foo = 1

export default {
  props: ['bar']
}
</script>
```

> The `bindings` object will be:

`bindings`对象将会是：

```javascript
{
  foo: 'setup',
  bar: 'props'
}
```

> This object can then be passed to the template compiler:

这个对象之后可以传递给模板编译器。

```javascript
import { compile } from '@vue/compiler-dom'

compile(template, {
  bindingMetadata: bindings
})
```

> With the binding metadata available, the template compiler can generate code that directly access template variables from the corresponding source, without having to go through the render context proxy:

通过获得的元数据，模板编译器可以生成直接从对应源文件获取模板变量的代码，无需再去查找渲染上下文：

```html
<div>{{ foo + bar }}</div>
```

```javascript
// code generated without bindingMetadata
// here _ctx is a Proxy object that dynamically dispatches property access
// 没有绑定元数据的代码
// 这里 _ctx 是一个代理对象，可以动态地取出属性
function render(_ctx) {
  return createVNode('div', null, _ctx.foo + _ctx.bar)
}

// code generated with bindingMetadata
// bypasses the render context proxy
// 绑定了元数据的代码
// 绕过了渲染上下文代理对象
function render(_ctx, _cache, $setup, $props, $data) {
  return createVNode('div', null, $setup.foo + $props.bar)
}
```

> **Ref TypeScript Support Implementation Details**

> There are two issues that prevent `ref:` from working out of the box with TypeScript. Given the following code:

**Ref的TypeScript支持的实现细节**

这有两个问题在防止`ref:`与TypeScript直接使用。比如下面代码

```javascript
ref: count = x
```

> - TS won't know `count` should be treated as a local variable
> - If `x` has type `Ref<T>`, there will be a type mismatch since we expect to use `count` as `T`.

- TS不知道`count`应该被当成一个局部变量来处理
- 如果x的类型为`Ref<T>`，当我们希望使用count作为泛型T时会产生类型不匹配

> The general idea is to pre-transform the code into alternative TypeScript for type checking only (different from runtime-oriented output), get the diagnostics, and map them back. This will be performed by Vetur for IDE intellisense, and via a dedicated command line tool for type checking `*.vue` files (e.g. VTI or `@vuedx/typecheck`).

一般的想法是预先把代码转换为只为了类型检查的TypeScript代码（与面向运行时的输出不同）。得到检查结果，然后映射回去。这个过程会被Vetur执行由IDE进行提示。通过一个专门的命令行工具对`*.vue`文件进行类型检查（比如VTI或者`@vuedx/typecheck`）。

例子如下

```javascript
// 源代码
ref: count = x

// 转换之后
import { ref, unref } from 'vue'

let count = unref(x)
let $count = ref(x)
```

> `ref` and `unref` here are used solely for type conversion purposes since their signatures are:

`ref`和`unref`方法仅用作对类型转换因为它们的函数签名为：

```typescript
function ref<T>(value: T): T extends Ref ? T : Ref<T>
function unref<T>(value: T): T extends Ref<infer V> ? V : T
```

对于解构

```javascript
// 源代码
ref: ({ foo, bar } = useX())

// 转换之后
import { ref, unref } from 'vue'

const { foo: __foo, bar: __bar } = useX()
let foo = unref(__foo)
let $foo = ref(__foo)
let bar = unref(__bar)
let $bar = ref(__bar)
```

> **Svelte Syntax Details**

**Svelte语法的细节**

> - `export` is used to created component props [\[details\]](https://svelte.dev/docs#1_export_creates_a_component_prop)
> - `let` bindings are considered reactive (invalidation calls are automatically injected after assignments to `let` bindings during compilation). [\[details\]](https://svelte.dev/docs#2_Assignments_are_reactive)
> - Labeled statements starting with `$` are used to denote computed values / reactive statements. [\[details\]](https://svelte.dev/docs#3_$_marks_a_statement_as_reactive)
> - Imported svelte stores (the loose equivalent of a ref in Vue) can be used like a normal variable by using its `$`-prefixed counterpart. [\[details\]](https://svelte.dev/docs#4_Prefix_stores_with_$_to_access_their_values)

- `export`用于创建一个组件的props
- `let`绑定的变量被认为是响应式的（编译过程中在分配给`let`绑定之后无效的操作会被自动地注入）
- 以`$`开始的标签语句被用于表示计算属性值或者响应式语句。
- 导入svelte的stores包（和Vue内的ref相像），通过使用对应`$`前缀变量，可以像一个正常变量一样使用，

# 评论

## 1

> A drawback of this RFC, which was also a drawback of `<script setup>` on its own but has become worse now, is the vast amount of options to write the exact same thing. Experienced Vue users (such as the people commenting on this RFC) know all the options, understand how they relate to each other etc., this will however not be the case for a big part of Vue's userbase.

这个RFC的一个缺点，它自身也是`<script setup>`的缺点，但是现在变得更糟糕了，因为有大量的选择来书写完全一样的东西。有经验的Vue用户（比如在这个RFC下面评论的）知道所有的方式，理解这些方式之间的联系。但对于大部分用户而言，情况并非如此。

> In Vue 2, you only the had the Options API, and eventually we got the class component plugin. With this RFC, you'd have the following options:

在Vue2版本中，你只有配置式的API，最终也有了基于类的组件的插件。在本RFC中，你可以有如下的选择：

> - Options API
> - Class API (still an official plugin AFAIK)
> - Composition API (Vue 2 & Vue 3 versions which are also different!)
> - `<script setup>` w/o ref sugaring
> - `<script setup>` w/ ref sugaring

- 配置式API
- 类API（据我所知仍然是一个官方的插件）
- 组合API（Vue2和Vue3版本是不一样的！）
- 使用`<script setup>`且使用ref语法糖
- 使用`<script setup>`不使用ref语法糖

> This fragments the userbase a lot, making it harder to get started, to search for help on SO and to pick which one you should use. It'd be much easier if you're just starting out with Vue that you know: "Options API for the magic reactivity, composition API for more standard JS, better compositions and better TS support".

用户接触了太多的方式，很难去上手，得去在网上搜索应该选择哪一个。如果刚开始使用Vue，且知道“魔法的响应式的配置API，更加标准的组合API，更好的代码编写和更好的TS支持”，这会变得容易上手

> However: it is clear that people like this "magic" VCA syntax (see the linked RFCS). Isn't it possible to extend the custom block API a bit more so that if people really want this syntax, it can also be achieved outside of Vue core, in a (third) party library? If this lands in Vue core it would need to be supported throughout future versions of Vue, so I'm not sure if you'd even want that, considering the very valid points already mentioned and the fact that you'd need to support many APIs.

然而，明显用户喜欢这种魔法的语法，如果用户真想要这个语法，可以扩展成自定义的API包吗？这个API可以在Vue的核心包之外获得，比如在第三方的库中？如果放到Vue的核心中，那么必须在Vue之后的版本进行支持，我不确定你们是否真的想要这样，考虑到已经提及到很多合法的书写方式，事实上你们需要去支持很多的API

> Going into the API itself a bit: I think the `$` is very confusing if you don't perfectly understand why it's there! I.e. you need to KNOW a function requires an actual ref and you need to understand that you are dealing with a sugared ref and in that case you need to prefix it with `$`, but not in other cases when you need to pass a value. I'm convinced this will cause a lot of problems with many users and to me it just sounds like a hack to get around [#214 (comment)](https://github.com/vuejs/rfcs/pull/214#issuecomment-699680052)评论。

回到API本身：我认为`$`符号非常令人困惑，如果你不能完全的理解为什么它在这里的话！即你不仅需要知道他是一个ref的函数，而且需要去理解在处理带糖的ref时需要使用`$`前缀进行修饰，但在其他的情况下，比如传递一个值，则不需要添加前缀`$`，我觉得这将会给用户造成许多的问题。但对于我来说它只是一个hack（标记），比如214下面的[这个](https://github.com/vuejs/rfcs/pull/214#issuecomment-699680052)评论。

> To conclude; why don't we just say to the users that don't like the verbosity of the composition API: use the Options API?

结论就是：为什么我们不对那些讨厌冗长的组合式API的用户说：使用配置式API吧？

**尤大的回复**

> the vast amount of options to write the exact same thing
> - Options API
> - Class API (still an official plugin AFAIK)
> - Composition API (Vue 2 & Vue 3 versions which are also different!)
> - `<script setup>` w/o ref sugaring
> - `<script setup>` w/ ref sugaring

（上面这段为引用原作者的话）

> This is vastly exaggerating.

这是及其夸大的。

> - The Class API is an official plugin, but is a plugin. It's not part of the core API and only attracts users who specifically have strong preference towards classes. In other words, it's not "idiomatic".
> - Composition API v2 and v3 aims to be identical, and most if not all the code will look the same. The small technical differences do not count them as "two ways of doing the same thing."
> - Composition API code written in `<script setup>`, as proposed in this RFC, w/o ref sugar, **is 100% the same as normal Composition API usage** (you just don't need to manually return everything). In fact, if the user is using SFC, I can't really find a reason not to use the new `<script setup>` over a raw `export default { components: {...}, setup() { ... }}`, given that the former always results in less code.
> - `ref:` sugar is a purely additive syntax sugar. It doesn't change how `<script setup>` or Composition API works. If one already understands Composition API, it shouldn't take more than 10 minutes to understand `ref:`.


- 基于类的API是一个官方的插件，但也只是一个插件。它不是核心的API的一部分，只会吸引到那些对类方式有相当偏爱的用户。换句话说，类API不是一种常用的方式。
- 基于组合的API在2.x版本和3.x版本目的是一致的，大多数的（但不是全部）看起来是一样的。细小的技术上的差异不会使得这两种方式计算为“做相同事情的两种方式”。
- 书写在`<script setup>`组合API代码，就像这个RFC提出的一样，使用ref语法糖，和正常的组合API用法100%一样。（你只是不需要手动地返回任何东西）。事实上，如果一个用户使用单文件组件用法，我真无法找到一个不使用`<script setup>`而使用`export default { components: {...}, setup() { ... }}`的理由，前者使用了更少的代码。
- `ref:`语法糖是一个纯的新增语法糖。它不会改变`<script setup>`或者基于组合的API的使用方式。如果一个人已经理解了基于组合的API，那么理解`ref:`语法糖不会超过10分钟。

> To sum up - there are two "paradigms": (1) Options API and (2) Composition API. `<script setup>` and `ref:` sugar are not different APIs or paradigms. They are extensions of the Composition API - compiler-based sugar to allow you to express the same logic with less code.

综上，在Vue中有两种”范式“，（1）基于配置的API和（2）基于组合的API，`<script setup>`和`ref:`语法糖不是不同的API或者范式。他们只是基于组合API的扩展 - 基于编译的语法糖，允许你以更少的代码来表达相同的逻辑。

> Isn't it possible to extend the custom block API a bit more so that if people really want this syntax, it can also be achieved outside of Vue core, in a (third) party library?（引用评论）

> So - you agree that many people want a ref syntax sugar, but then suggest not supporting it in core, and instead encouraging them to each implement their own. Isn't this going to only lead to more fragmentation? Think CSS-in-JS in the React ecosystem.

你都认为很多用户会想要ref语法糖了，但是却建议不要在核心包中支持它，而是鼓励他们各自的实现。这不是会导致更多碎片化的信息吗？比如React生态中的CSS-in-JS。

> I think the `$` is very confusing... you need to KNOW a function requires an actual ref and you need to understand that you are dealing with a sugared ref and in that case you need to prefix it with `$`, but not in other cases when you need to pass a value.（引用评论）

> You literally summed it up in a single sentence. I can also make it even simpler: `$foo` to `foo` is like `foo` to `foo.value`. Is it really that confusing? With TypeScript (assuming the IDE support is done), if an external function expects `Ref<any>`, you'll get an error passing a `ref:` binding without the `$`.

你用了一句话来总结，那我也可以简单地说：`$foo`对于`foo`就像`foo`对于`foo.value`。这真的很令人困惑吗？使用TypeScript（假定IDE支持已经实现），如果一个外部的函数接收了`Ref<any>`类型的参数，传入一个不加`$`前缀的的`ref:`绑定的变量将会报错。

> I'm convinced this will cause a lot of problems with many users（引用评论）

> What exact, concrete problems can this lead to? Forgetting to add the `$` when they should? Note that even without the sugar we already have the problem of forgetting `.value` when you should and the latter is much more likely to happen. Specifically, even with TS, `foo` can still sometimes be type-valid where `foo.value` is actually expected (e.g. in a ternary expression `foo ? bar : baz` where `foo` is `Ref<boolean>`), but with ref sugar it's **always** going to result in a type error if you forget the `$` prefix.

精确的讲这到底会导致什么具体的问题？当需要添加`$`的时候忘记了？注意即使不使用语法糖，仍然会存在忘记添加`.value`这个问题，而且后者更可能发生。特别对于TS，某些时候期待传入`foo.value`的地方使用了`foo`，但此时类型合法（比如，在一个三元表达式`foo ? bar : baz`中`foo`的类型为`Ref<boolean>`）,但如果使用语法糖，如果忘记添加`$`那么总是会导致一个类型错误。

> why don't we just say to the users that don't like the verbosity of the composition API: use the Options API?（引用评论）

> You are asking users to give up the benefits of Composition API because you don't like a syntax sugar that makes Composition API less verbose for them. I don't think that really makes sense.

你要用户去放弃基于组合API的优点，因为你不喜欢一个对于用户而言使得组合API更加简洁的语法糖。我不认为这说得通。

## 2

> `<script setup>` now directly exposes top level bindings to template （引用RFC的话）

> What would we do for intermediate variables?

如何处理一些中间变量

```javascript
const store = inject('my-store')

ref: stateICareAbout = computed(() => store.state.myState)

function addState(newState) {
  store.add(newState)
}
```

> This would expose `store` to the template even though i don't really need it to. But is that actually a problem?

上面的代码暴露了`store`变量给模板，即使我真的不需要`store`这个变量。但，这算是一个问题吗？

> **On the downside**, it will make the generated code bigger as it makes the object returned by setup larger, and we loose a bit of "clarity" about what's being exposed to the template.

缺点：会使得代码变得更多因为通过setup函数返回的对象变得更大了。我们失去了如何暴露给模板的一点清晰性。

> **On the upside**, one could argue that explicitly defining what gets exposed to the templates is tedious, and this change would make SFCs act a bit more like JSX in that every(*) variable in `<script setup>` is automatically in the "scope" of the template.

优点：有些人也可以争辩说，明确地定义暴露给模板地变量这个操作是乏味的。这个改变使得单文件组件的运作有点像JSX，任何定义在`<script setup>`里面的变量自动地成为模板的作用域。

(\*) except imports of non-vue files, if I'm right.

如果我想没错的话，任何非vue文件的导入都会被暴露给模板（注：个人认为这里的vue文件应该是指vue的API，比如`reactive`这些不会暴露给模板）。

**尤大回复**

> yes, they are always exposed. Technically, if this is merged, we can also introduce a different template compilation mode where the render function is returned directly from setup. This makes the scoping even more direct and avoids the need of the render proxy.

对的，你说的这些总是会被暴露给模板。技术上讲，如果提案合并进来，我们也可以使用一个不同的模板编译模式来让render函数直接从setup函数返回，这样也就不需要render代理对象。

## 3

> From the proposal:

在提案中有

```text
// if useMyRef() returns a ref, it will be untouched
// otherwise it's wrapped into a ref
// 如果useMyRef函数返回一个ref类型对象，那么它不会被操作
// 否则它会被包装成一个ref
```

> Just to clarify something here: does this mean that given a composable function returning, say, one refs and two functions (e.g. `function useTimer(): { time: Ref<number>, start: () => void, stop: () => void }`), the ref AND also the functions will wrapped in ref? Wrapping in ref essentially has no impact on the one ref that's returned. But the functions will also be wrapped in a ref, is that correct?

这里应该讲清楚：是指组合函数的返回吗，比如，一个refs和两个函数（比如`function useTimer(): { time: Ref<number>, start: () => void, stop: () => void }`），ref对象和函数都会被包装成ref吗？包装成ref本质上不会影响返回的ref对象吗？但是函数也会被包装成一个ref对象，这也是正确的吗？

> example:（例子）

```javascript
ref: ({ time, start, stop } = useTimer()) 
// does start and stop get wrapped in a ref?
// start函数和stop函数会包装成一个ref吗？
```

> I know it doesn't make much of difference in this example (a function getting wrapped doesn't cause any issue), but it seems a little weird like you could end up with some amount of accidental code bloat or unintended behavior, so wanted to confirm. If it were a problem I guess you would just assign the refs separately.

我知道在这个例子中其实没有什么不同（一个函数被包装成ref不会造成任何问题）。但它就是有点奇怪，就感觉会得到一些膨胀意外的代码。所以我想确认下，如果真的算问题的话，我猜想你们会单独地去包装成ref

**尤大的回复**

```javascript
ref: ({ time, start, stop } = useTimer()) // （引用）
```

> You are correct, all three will be wrapped in refs, although you can use `start()` and `stop()` just fine. It does create a bit of unnecessary overhead, although the overhead should be fairly acceptable (some bench numbers here).

你是对的，这三个对象都会被包装成ref类型，即使这样你也可以正常地使用start和stop函数。它的确会生成一些没必要开销，即使这些开销是相等可以接受的。

> To avoid the wrapping you'd have to write three lines:

为了避免包装你可以写成下面三行

```javascript
const timer = useTimer()
const { start, stop } = timer
ref: ({ time }) = timer
```

> This is a problem I've thought about as well. Maybe we can introduce extra syntax to deal with it but I want to keep it minimal for now.

这个问题我也想过。可能我们可以采用一种额外的语法来解决它，但现在我想先暂时把它放在一边。

# 后记

个人感觉提案很有趣，毕竟我也没有做过大的项目，对于非标准语义的加入只能说很有趣

使用了标签语句（[Labeled Statement](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/label)）来表示Vue中特定的语义，标签语句是JavaScript一个原生的语法，但是基本用不到。

这里也提到了另一个前端框架`Svelte`，这个框架和Vue，React相比，最大的不同就是没有虚拟dom，编写的代码会生成直接操作dom的代码。最大的特点就是减少了运行时依赖库的体积（基本可以不依赖）

`<script setup>`减少了样板代码的编写，更加的专注于组合函数逻辑的编写，不过如何声明props和其他的配置感觉是一个比较不好处理（也不能说是难处理，RFC中提到直接导出一个对象来声明props，不过感觉又回到了之前的样子...），很期待可以解决这方面的问题

现在Vue也开始由很多的方式来编写一个组件了，Vue2最普通的基于配置的组件，Vue3基于组合API的组件，基于类组件，还可以基于JSX组件，感觉开始有点React的味道，这么多方式感觉对开发者其实不是特别的友好

如果Vue3可以大力推广组合API组件，逐步地减少对配置式组件的支持，在某个版本完全放弃，我觉得是非常需要的一步

当然上面纯属我的yy，当作乐子就完事

TS/IDE工具的支持也是一个问题，但我感觉问题不大，能用代码实现的东西问题都不会很大，大的问题是如何决定Vue之后的整体走向，到底是百花齐放，还是一枝独秀？

我非常期待Vue的后续发展，开源社区的力量可能没有公司支持的力量大，但是不同人的想法碰撞在一起，总能出现别具一格的想法~

作为一个初步进入软件开发的开发者，我很敬佩框架开发者~

（评论会逐步地翻译） 
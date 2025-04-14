---
title: computed 可能成为一个错误的工具（译文）
key: 1646060181date: 2022-02-28 22:56:21
updated: 2023-02-13 18:28:44
tags:
- Vue
- JavaScript
categories:
- 翻译
---


# 前言

起因是在看 `vueuse/core` 里面的 `eagerComputed` 函数时，在文档下面有一篇文章

看完发现相当的有意思，所以挑一些段落来翻译，随便写写

<!-- more -->

> 文章地址：[Vue: When a computed property can be the wrong tool](https://dev.to/linusborg/vue-when-a-computed-property-can-be-the-wrong-tool-195j)

# 正文

如果你是一个 `Vue` 玩家，你大概知道计算属性，并且和我一样，认为它太棒了，就跟它的名字一样理所当然

对于我来说，计算属性是处理派生状态（派生状态可以理解为由其他的状态生成的状态，这里的其他状态可以理解为这个派生状态的依赖 `dependencies`）的一种非常符合人体工程学以及优雅的方式。但是在一些场景下，有可能降低性能，我意识到许多人可能不知道，所以尝试写下这篇文章来解释为什么计算属性可能会降低性能

当我们在 `Vue` 中讨论计算属性 `computed properties` 时，为了搞清楚我们在讨论什么，这里使用下面的例子来说明：

```javascript
const todos = reactive([
  { title: 'Wahs Dishes', done: true},
  { title: 'Throw out trash', done: false }
])

const openTodos = computed(
  () => todos.filter(todo => !todo.done)
)

const hasOpenTodos = computed(
  () => !!openTodos.value.length
)
```

上面的代码中，`openTodos` 派生自 `todos` ， `hasOpenTodos` 又派生自 `openTodos` 。看起来非常的 `nice` ，因为现在我们传递和使用这些响应式对象，每当它们依赖的（响应式）对象发生改变的时候它们就会自动地更新。

如果我们使用这些响应式对象在一个响应式的上下文中，比如一个 `Vue` 的模板，一个渲染 `render` 函数或者是一个 `watch` 函数，这些操作也会对计算属性的改变而反应，然后更新，这就是我们熟悉的 `Vue` 核心的一种魔力。

**注意：**我使用了组合式（`composition`）的 API 是因为刚好这几天我在使用它。文章中描述对于计算属性的行为同样适用于配置式（`options`）的 API ，毕竟使用的是相同的响应式系统。

## 计算属性特殊的地方

有两点使得计算属性变得特殊，并且这两点和本文的要点相关：

- 计算属性的结果是缓存的，只有它依赖的响应式对象发生了改变，它才就会重新地计算
- 获取结果的计算过程是惰性的

### 缓存

计算属性的结果是缓存的。在上面的例子中，只要不改变 `todos` 数组， 多次调用 `openTodos.value` 都会返回相同的值，这个值是不用重新调用 `filter` 方法来计算的。对于昂贵的任务来说这特别的棒，因为这确保了任务只在必须的时候才被重新执行，这里的“必须”可以理解为它依赖的响应式对象发生了改变。

### 惰性计算

计算属性也是惰性计算的，但真的是这样吗？

惰性计算可以理解为一旦计算属性的值被读取（初始化或者由于它的依赖发生改变而被标记为更新），计算属性的回调函数会执行。

所以如果一个带有昂贵计算的计算属性在任何地方都没被使用，这个昂贵的操作不会被执行，这是处理大量数据时的另一个性能优势。

## 惰性计算何时会提高性能

根据文章先前部分的解释，计算属性的惰性计算通常来说是一个优点，特别是对于昂贵的（计算代价大）操作：它确保了真的需要结果的时候才会去计算。

这意味着某些操作，比如过滤一个大的列表，如果过滤的结果不被你写的代码的任何一部分读取和使用的话，会简单地跳过这个计算过程。

```html
<template>
  <input type="text" v-model="newTodo">
  <button type="button" v-on:click="addTodo">Save</button>
  <button @click="showList = !showList">
    Toggle ListView
  </button>
  <template v-if="showList">
    <template v-if="hasOpenTodos">
      <h2>{{ openTodos.length }} Todos:</h2> 
      <ul>
        <li v-for="todo in openTodos">
          {{ todo.title }}
        </li>
      </ul>
    </template>
    <span v-else>No todos yet. Add one!</span>
  </template>
</template>

<script setup>
const showListView = ref(false)

const todos = reactive([
  { title: 'Wahs Dishes', done: true},
  { title: 'Throw out trash', done: false }
])
const openTodos = computed(
  () => todos.filter(todo => !todo.done)
)
const hasOpenTodos = computed(
  () => !!openTodos.value.length
)

const newTodo = ref('')
function addTodo() {
  todos.push({
    title: todo.value,
    done: false
  })
}
</script>
```

可以戳这里查看在线代码 [SFC Playground](https://sfc.vuejs.org/#eyJBcHAudnVlIjoiPHNjcmlwdCBzZXR1cD5cbmltcG9ydCB7IHJlYWN0aXZlLCByZWYsIGNvbXB1dGVkIH0gZnJvbSAndnVlJ1xuXG5jb25zdCBzaG93TGlzdCA9IHJlZihmYWxzZSlcbiAgXG5jb25zdCB0b2RvcyA9IHJlYWN0aXZlKFtcbiAgeyB0aXRsZTogJ1dhaHMgRGlzaGVzJywgZG9uZTogdHJ1ZX0sXG4gIHsgdGl0bGU6ICdUaHJvdyBvdXQgdHJhc2gnLCBkb25lOiBmYWxzZSB9XG5dKVxuXG5jb25zdCBvcGVuVG9kb3MgPSBjb21wdXRlZCgoKSA9PiB0b2Rvcy5maWx0ZXIodG9kbyA9PiAhdG9kby5kb25lKSlcbmNvbnN0IGhhc09wZW5Ub2RvcyA9IGNvbXB1dGVkKCgpID0+ICEhb3BlblRvZG9zLnZhbHVlLmxlbmd0aClcblxuY29uc3QgbmV3VG9kbyA9IHJlZignJylcbmZ1bmN0aW9uIGFkZFRvZG8oKSB7XG4gIHRvZG9zLnB1c2goe1xuICAgIHRpdGxlOiBuZXdUb2RvLnZhbHVlLFxuICAgIGRvbmU6IGZhbHNlXG4gIH0pXG4gIGNvbnNvbGUubG9nKHRvZG9zKVxufVxuXG48L3NjcmlwdD5cblxuPHRlbXBsYXRlPlxuICA8aW5wdXQgdHlwZT1cInRleHRcIiB2LW1vZGVsPVwibmV3VG9kb1wiPlxuXHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiB2LW9uOmNsaWNrPVwiYWRkVG9kb1wiPlNhdmU8L2J1dHRvbj5cbiAgPGJ1dHRvbiBAY2xpY2s9XCJzaG93TGlzdCA9ICFzaG93TGlzdFwiPlxuICAgIFRvZ2dsZSBMaXN0Vmlld1xuICA8L2J1dHRvbj5cbiAgPHRlbXBsYXRlIHYtaWY9XCJzaG93TGlzdFwiPlxuICBcdDx0ZW1wbGF0ZSB2LWlmPVwiaGFzT3BlblRvZG9zXCI+XG4gICAgICA8aDI+e3sgb3BlblRvZG9zLmxlbmd0aCB9fSBUb2Rvczo8L2gyPiBcbiAgICAgIDx1bD5cbiAgICAgICAgPGxpIHYtZm9yPVwidG9kbyBpbiBvcGVuVG9kb3NcIj5cbiAgICAgICAgICB7eyB0b2RvLnRpdGxlIH19XG4gICAgICAgIDwvbGk+XG4gICAgICA8L3VsPlxuICAgIDwvdGVtcGxhdGU+XG4gICAgPHNwYW4gdi1lbHNlPk5vIHRvZG9zIHlldC4gQWRkIG9uZSE8L3NwYW4+XG4gIDwvdGVtcGxhdGU+XG4gIFxuPC90ZW1wbGF0ZT4ifQ==)

当 `showList` 初始化为 `false` 的时候，模板或者渲染函数不会读取到 `openTodos` ，相应地，过滤的操作不会发生，无论是初始或者添加了一个新的 `todo` ，并且 `todos.length` 发生了改变。只有在 `showList` 设置为 `true` 之后，这些计算属性才会被读取，然后才会触发它们的计算。

当然在这个简单的例子中，过滤操作的工作量很小，但是你可以想象一下更加昂贵的操作，这是一个巨大的优势。

## 惰性计算何时会降低性能

不利的一面：如果计算属性返回的结果只能在使用它之后才能知道，这意味着 `Vue` 的响应式系统无法事先知道这个返回值。

换句话说，`Vue` 可以意识到一个或者多个计算属性的依赖发生改变，所以可以在下次值被读取的时候重新计算，但是 `Vue` 无法知道，在那个时刻，计算属性返回的值是否是不同的。

### 为什么这会成为一个问题？

你的代码的其他部分可能依赖了这个计算属性，或者可能是另一个计算属性，可能是一个 `watch` ，可能是一个模板或者渲染函数。

所以 `Vue` 没办法，只能把这些依赖也标记为更新的，防止返回值不同。

如果这些依赖这个计算属性的过程存在一些昂贵的操作，可能就会触发昂贵地重计算，尽管被依赖的计算属性的返回了和上一次相同值，即重计算是没有必要的。

## 复现问题

下面是一个简单的例子：想象一下，我们有一个列表，有一个按钮用来增加次数。一旦次数达到 `100` ，我们逆序去展示这个列表（是的，这个例子有点蠢。）

[SFC playground](https://sfc.vuejs.org/#eyJBcHAudnVlIjoiPHNjcmlwdCBzZXR1cD5cbiAgaW1wb3J0IHsgcmVmLCByZWFjdGl2ZSwgY29tcHV0ZWQsIG9uVXBkYXRlZCB9IGZyb20gJ3Z1ZSdcblxuICBjb25zdCBsaXN0ID0gcmVhY3RpdmUoWzEsMiwzLDQsNV0pXG4gIFxuICBjb25zdCBjb3VudCA9IHJlZigwKVxuICBmdW5jdGlvbiBpbmNyZWFzZSgpIHtcbiAgICBjb3VudC52YWx1ZSsrXG4gIH1cbiAgXG4gIGNvbnN0IGlzT3ZlcjEwMCA9IGNvbXB1dGVkKCgpID0+IGNvdW50LnZhbHVlID4gMTAwKVxuICBcbiAgY29uc3Qgc29ydGVkTGlzdCA9IGNvbXB1dGVkKCgpID0+IHtcbiAgICAvLyBpbWFnaW5lIHRoaXMgdG8gYmUgZXhwZW5zaXZlXG4gICAgcmV0dXJuIGlzT3ZlcjEwMC52YWx1ZSA/IFsuLi5saXN0XS5yZXZlcnNlKCkgOiBbLi4ubGlzdF1cbiAgfSlcbiAgXG4gIG9uVXBkYXRlZCgoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ2NvbXBvbmVudCByZS1yZW5kZXJlZCEnKVxuICB9KVxuICBcbjwvc2NyaXB0PlxuXG48dGVtcGxhdGU+XG4gIDxidXR0b24gQGNsaWNrPVwiaW5jcmVhc2VcIj5cbiAgICBDbGljayBtZVxuICA8L2J1dHRvbj5cbiAgPGJyPlxuICA8aDM+XG4gICAgTGlzdFxuICA8L2gzPlxuICA8dWw+XG4gICAgPGxpIHYtZm9yPVwiaXRlbSBpbiBzb3J0ZWRMaXN0XCI+XG4gICAgICB7eyBpdGVtIH19XG4gICAgPC9saT5cbiAgPC91bD5cbjwvdGVtcGxhdGU+In0=)

```html
<template>
  <button @click="increase">
    Click me
  </button>
  <br>
  <h3>
    List
  </h3>
  <ul>
    <li v-for="item in sortedList">
      {{ item }}
    </li>
  </ul>
</template>

<script setup>
import { ref, reactive, computed, onUpdated } from 'vue'

const list = reactive([1,2,3,4,5])

const count = ref(0)
function increase() {
  count.value++
}

const isOver100 = computed(() => count.value > 100)

const sortedList = computed(() => {
  // 想象这是一个昂贵的操作
  return isOver100.value ? [...list].reverse() : [...list]
})

onUpdated(() => {
  // 在更新组件时打印
  console.log('component re-rendered!')
})
</script>
```

**提问：**点击了 `101` 次按钮，组件会重渲染多少次？

脑袋里已经浮现出答案了吗？确定吗？

**答案：** 组件会重新渲染 **`101`** 次

我猜有些人可能会猜想一个不同的答案，比如：“组件渲染一次，即使点击了 `101` 次按钮”。但这是错误的，原因是计算属性的惰性计算。

很疑惑？我们一步步地梳理下，看看到底发生了什么：

1.当我们点击了按钮， `count` 增加了。组件不会重渲染，因为我们没有在模板中使用 `count` 。
2.但是当 `count` 改变，计算属性 `isOver100` 被标记为 `dirty` 脏的，这里的 `dirty` 意思是该计算属性的一个响应式的依赖发生了改变，所以它的返回值必须重新计算。
3.由于惰性计算，重新计算只有在读取 `isOver100.value` 的时候才会发生，在发生前，我们（以及 `Vue` ）无法知道计算属性会返回 `false` 还是改变成 `true` 。
4.然而 `sortedList` 依赖了 `isOver100` ，所以 `sortedList` 也被标记为 `dirty` 脏的。同样，它不会被重新计算，只有被读取时候，才会触发计算过程。
5.因为模板依赖了 `sortedList` ，同样也被标记为 `dirty` （有可能发生变化，需要重新计算），然后组件就重新渲染了。
6.渲染的过程中，读取到了 `sortedList.value` 。
7.`sortedList` 现在重新计算了，由于读取到了 `isOver100.value` ，所以 `isOver100` 也重新计算了，但是返回的值仍然是 `false` 。
8.所以现在我们重新渲染了组件，重新计算了“昂贵”的 `sortedList` 计算属性，尽管所有的操作都是没有必要的，返回的新的虚拟 `DOM` 或者模板看起来都和先前的一样。

真正的罪魁祸首是 `isOver100` ， 这是一个经常更新的值， 但通常返回和先前相同的值，最重要的是，这是一个便宜的操作，并不能从计算属性的缓存特性中获益。我们只是觉得这样使用符合人体工程学，看起来很 “`nice`” 。

当这样的计算属性（指类似 `isOver100` 的计算属性）被另一个带有昂贵计算的计算属性（能够从缓存特性中获益）或者模板依赖时，可能会触发不必要地更新，进而严重降低代码的性能。

这种情况本质上可以理解为下面行为的组合：

1.一个昂贵的计算属性，被观察者或者模板依赖
2.另一个经常重新计算返回相同值的计算属性

## 当遇到了时候，如何解决？

看到现在，你可能有两个问题：

1.哇，真的很糟吗？
2.如何避免？

第一个问题：冷静下来，这不是一个很糟的问题。

`Vue` 的响应式系统通常非常的高效，重渲染也一样，特别是现在的 `Vue3` 版本。通常，零星的不必要的更新也不会使得性能变得很差，即使默认情况下任何状态的更新都会导致重渲染。

所以这个问题只适用于频繁更新状态，进而在另一个地方触发频繁的，不必要的，昂贵的（非常大的组件，计算量很大的计算属性等）更新。

如果你遇到这样一种场景，可以使用一个自定义的工具函数来解决它。

### 自定义的 `eagerComputed` 工具函数

`Vue` 的响应式系统导出了我们所需的工具函数，使得我们可以构建一个个人版本的 `computed` ，它的计算是立即的，非惰性的。

我们称这个自定义 `computed` 为 `eagerComputed`

```javascript
import { watchEffect, shallowRef, readonly } from 'vue'
export function eagerComputed(fn) {
  const result = shallowRef()
  watchEffect(() => {
    result.value = fn()
  }, 
  {
    flush: 'sync' // 立即执行获取更新后的值
  })

  return readonly(result)
}
```

我们可以像使用计算属性一样使用这个 `eagerComputed` ，但是行为上不同的地方是 `eagerComputed` 的更新是立即的，非惰性的，避免了不必要的更新。

点击查看修复之后的例子 [SFC Playground](https://sfc.vuejs.org/#eyJBcHAudnVlIjoiPHNjcmlwdCBzZXR1cD5cbiAgaW1wb3J0IHsgcmVmLCByZWFjdGl2ZSwgc2hhbGxvd1JlZiwgcmVhZG9ubHksIGNvbXB1dGVkLCBvblVwZGF0ZWQsIHdhdGNoRWZmZWN0IH0gZnJvbSAndnVlJ1xuXG4gIGZ1bmN0aW9uIGVhZ2VyQ29tcHV0ZWQoZm4pIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaGFsbG93UmVmKClcbiAgICB3YXRjaEVmZmVjdCgoKSA9PiB7XG4gICAgICByZXN1bHQudmFsdWUgPSBmbigpXG4gICAgfSwgXG4gICAge1xuICAgICAgZmx1c2g6ICdzeW5jJyAvLyBuZWVkZWQgc28gdXBkYXRlcyBhcmUgaW1tZWRpYXRlLlxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVhZG9ubHkocmVzdWx0KVxuICB9XG4gIFxuICBjb25zdCBsaXN0ID0gcmVhY3RpdmUoWzEsMiwzLDQsNV0pXG4gIFxuICBjb25zdCBjb3VudCA9IHJlZigwKVxuICBmdW5jdGlvbiBpbmNyZWFzZSgpIHtcbiAgICBjb3VudC52YWx1ZSsrXG4gIH1cbiAgXG4gIGNvbnN0IGlzT3ZlcjEwMCA9IGVhZ2VyQ29tcHV0ZWQoKCkgPT4gY291bnQudmFsdWUgPiAxMDApXG4gIFxuICBjb25zdCBzb3J0ZWRMaXN0ID0gY29tcHV0ZWQoKCkgPT4ge1xuICAgIC8vIGltYWdpbmUgdGhpcyB0byBiZSBleHBlbnNpdmVcbiAgICByZXR1cm4gaXNPdmVyMTAwLnZhbHVlID8gWy4uLmxpc3RdLnJldmVyc2UoKSA6IFsuLi5saXN0XVxuICB9KVxuICBcbiAgb25VcGRhdGVkKCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnY29tcG9uZW50IHJlLXJlbmRlcmVkIScpXG4gIH0pXG4gIFxuPC9zY3JpcHQ+XG5cbjx0ZW1wbGF0ZT5cbiAgPGJ1dHRvbiBAY2xpY2s9XCJpbmNyZWFzZVwiPlxuICAgIENsaWNrIG1lXG4gIDwvYnV0dG9uPlxuICA8YnI+XG4gIDxoMz5cbiAgICBMaXN0XG4gIDwvaDM+XG4gIDx1bD5cbiAgICA8bGkgdi1mb3I9XCJpdGVtIGluIHNvcnRlZExpc3RcIj5cbiAgICAgIHt7IGl0ZW0gfX1cbiAgICA8L2xpPlxuICA8L3VsPlxuPC90ZW1wbGF0ZT4ifQ==)

什么时候该使用 `computed` ，什么时候又该使用 `eagerComputed` 呢？

- 当你需要复杂的计算需要执行，可以真正地从缓存和惰性计算中获益，并且只在必要的时候重新计算时，使用 `computed` 。
- 当你有一个简单的操作，这个操作很少改变返回值，并且经常是一个 `boolean` 值，使用 `eagerComputed` 。

**注意：**记住这个 `eagerComputed` 使用一个同步的观察者，意味着对于每一个响应式的改变，计算是同步且立即的，如果一个响应式依赖改变了 `3` 次，那么计算过程会重新计算 `3` 次。所以它应该被用于简单且便宜的操作。

# 后记

相当有意思的一篇文章，总结一下就是：

由于 `computed` 是惰性计算取值的，响应式系统无法第一时间知道返回的值是否改变，那么只能理解为改变了，这样才能保持结果和预期一致，如果理解为没改变，从而依然使用缓存的值，但是实际的结果发生了改变的话，就会和预期的结果不一致，造成程序错误。

很多时候很容易写出如下的代码：

```javascript
const isXXXEmpty = computed(() => XXXList.length === 0)
```

然后使用一个 `watchEffect` 来判断

```javascript
watchEffect(() => {
    if (isXXXEmpty.value) {
        // 昂贵的操作
    }
})
```

每次我们往非空的 `XXXList` 里面添加一条数据，体感上 `watchEffect` 是不应该运行的，但是实际上每次对 `XXXList` 添加元素都会执行这个 `watchEffect` 。

不过一般我们都不会去在意这种小的消耗，因为 `watchEffect` 内部只在 `isXXXEmpty.value` 为 `false` 时才执行一段昂贵的逻辑。

而使用 `watchSyncEffect` 来模拟 `computed` ，使得取值是非惰性的，这样响应式系统能够**立即**知道本次的值和上次的值是否不同，进而触发依赖它的其他响应式对象是否进行更新操作。

```javascript
const isXXXEmpty = eagerComputed(() => XXXList.length === 0)

watchEffect(() => {
    // 每次对 XXXList 添加元素已经不会再触发该 effect 了
    // 只有真的发生改变才会触发，比如从 true 变为 false ，或者从 false 变为 true 。
    if (isXXXEmpty.value) {
        // 昂贵的操作
    }
})
```

颇有一种[薛定谔的猫](https://baike.baidu.com/item/%E8%96%9B%E5%AE%9A%E8%B0%94%E7%9A%84%E7%8C%AB/554903)的感觉，你无法知道 `computed` 返回的值是否发生了改变，我们称之为“薛定谔的 `computed` 返回值” （~不是~

如果还是不明白的话，可以看看 `computed` 以及 `ref` 的实现方式，配合文章食用更佳~

PS：惨，本来可以早点发的

这两天睡眠有点不足，感觉疲惫，加上原来帖子的地址突然不能访问了...

小摆了几天😂
---
title: 让Vue.draggable支持交换式拖拽（译）
key: 1647094859date: 2022-03-12 22:20:59
updated: 2023-02-13 18:28:45
tags:
- Vue.Draggable
- Vue
- JavaScript
categories:
- 译文
---


# 前言

正好在项目中使用了 `Vue.draggable` 这个库

并且需要使用交换式拖拽来代替插入时拖拽，找了一些文章之后，找到了一个老哥写的文章不错

随手翻译翻译

<!-- more -->

# 正文

为什么需要使用这个库呢？

因为刚好项目需要用到拖拽操作，类似于微信多人视频，然后需要通过鼠标操作交换两个人的显示位置

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/12/202203122306768.avif)

## Vue.draggable

这个库应该是目前 `github` 上 `Vue` 的拖拽库中最热门的一个吧

> [Vue.draggable - github](https://github.com/SortableJS/Vue.Draggable)

所以当时毫不犹豫地就使用了。

但是后面发现了一个问题，就是官方的拖拽是插入式的拖拽，而不是交换式的拖拽。

插入式的拖拽并不符合功能的要求。

所以需要去改造一下，官方在 `issue` 上明确表明了不支持交换式拖拽。

所以没办法，找了找网上一些文章，也找到了折中的方法。

## 交换式拖拽以及插入式拖拽

首先我们需要明白什么是交换式拖拽，以及什么是插入式拖拽。

`Vue.Draggable` 基于 `sortable.js` ，而 `sortable.js` 是插入式拖拽的。

举例来说，比如现在我们有一个列表，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/13/202203131105018.avif)

对于插入式拖拽来说，如果拖动 `2` 到 `4` 的话，会变成如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/13/202203131107368.avif)

而如果拖动 `4` 到 `2` 的话，会变成如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/13/202203131109074.avif)

对于交换式拖拽来说，拖动 `2` 到 `4` 和 拖动 `4` 到 `2` 这两个操作产生的结果是一样的，也就是交换操作而已，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/13/202203131114016.avif)

## 让 Vue.Draggable 支持交换式拖拽

> 原文地址：[Making Vue.draggable to be swappable](https://okamuuu.com/posts/xjni9lf5h)

`Vue.draggable` 是一个非常有用的 `UI` 组件，是一个创建可拖动项目，展示漂亮的排序动画的很棒的工具。但有些时候你可能想要使用交换式的组件而非排序式的组件。这篇文章可能能够帮到你。

为什么我需要交换而非排序呢？

我想要持久化存储排序后的数据，我想把它存在数据库中，但是它的数据结构并不是我想要的，排序的方法会移动多个数据的索引。比如，如果我拖动第一个元素到最后一个位置，结果如下：

```javascript
// sort 排序
Before: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
After:  [2, 3, 4, 5, 6, 7, 8, 9, 10, 1]
```

然而，我想要的预期的结果如下：

```javascript
// swap 交换
Before: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
After:  [10, 2, 3, 4, 5, 6, 7, 8, 9, 1]
```

或许预期的结果取决于数据库的结构，如果你想要使用 `Vue.draggable` 然后向数据库中元素的存储顺序的话，我建议和先和后端开发工程师沟通清楚。

### `Vue.draggable` 不支持交换的特性

有一次，有人创建了 `issue` ，内容为建议维护者向 `Vue.draggable` 中加入交换的功能，但是维护者拒绝了这个请求。

> [swap feature](https://github.com/SortableJS/Vue.Draggable/issues/466)

实际上，`Sortable.js` 有支持交换操作的插件，但是当前 `v2.21.0` 版本的 `Vue.draggable` 并没有这个功能。

### Hack `Vue.draggable`

尽管我使用了 `Vue.draggable` 实现了能够交换项目排序的管理工具，但我注意到，排序后的项目的数据结构并不是后端预期想要的。所以我用下面代码 `hack` 了组件

```html
<template>
  <table>
    <draggable v-model="items" tag="tbody" :move="handleMove" @end="handleDragEnd" :options="{animation:500}">
      <tr class="movable" v-for="item in items" :key="item.id">
        <td>{{ item.id }}</td><td>{{ item.name }}</td><td>{{ item.age }}</td>
      </tr>
    </draggable>
  </table>
</template>

<script>
import draggable from "vuedraggable";

export default {
  components: {
    draggable,
  },
  data() {
    const items = [
      { id: 1, name: "Bianka Effertz", age: 37 },
      { id: 2, name: "Mckayla Bogan", age: 20 },
      { id: 3, name: "Estevan Mann", age: 17 },
      { id: 4, name: "Cloyd Ziemann", age: 55 }
    ]
    return { items }
  },

  methods: {
    handleDragEnd() {
      this.$toast.show('dragEnd')
      
      // 记录起始元素索引和目标元素索引
      this.futureItem = this.items[this.futureIndex]
      this.movingItem = this.items[this.movingIndex]
      
      // 生成交换后的数据
      const _items = Object.assign([], this.items)
      _items[this.futureIndex] = this.movingItem
      _items[this.movingIndex] = this.futureItem
      
      // 更新视图
      this.items = _items
    },
    handleMove(e) {
      const { index, futureIndex } = e.draggedContext
      this.movingIndex = index
      this.futureIndex = futureIndex
      return false // 禁止排序
    }
}
</script>
```

点击[这里](https://fir-vue-draggable.firebaseapp.com/)可以查看 `demo`

PS：记得点击左上角的 `example2` 来查看， `example1` 依然是插入式拖拽

### 解释一下代码

`Vue.draggable` 可以向 `Sortable.js` 传入 `move` 属性。当某个项目被拖动的时候 `move` 事件就会抛出。所以我们可以传入该 `move` 事件的处理函数。函数可以返回 `false` ， `-1` ， `1` 。它们对应的意思如下：

- 返回 `false` ，意味着取消拖动
- 返回 `-1` ，意味着插入元素的前面的一个位置
- 返回 `1` ，意味着插入元素的后面的一个位置

所以我对每个发出的 `onMove` 事件都返回 `false` ，排序功能就被禁止，但是我可以拦截事件上下文中包含的起始索引和目标索引，现在我们知道了所需的数据，也就使 `Vue.draggable` 支持了交换式拖拽。

## 缺点

这样 `hack` 的缺点就是缺少了一些位置提示（比如拖动过程中如果对应到某个元素就高亮显示），如果对动画的要求不高的话，这样 `hack` 我觉得就完全没有问题了

至少我目前在公司的项目中就是这么使用的

## 另一种方法

我们知道 `sortable.js` 支持插入式的拖拽。

但其实， `sortable.js` 可以通过插件让其支持交换式的拖拽。

这个也是在我写下这篇文章中才知道的。

> [Swap Plugin](https://github.com/SortableJS/Sortable/tree/master/plugins/Swap)

在这个页面下面我们可以看到一个 `demo` ，如下：

> [原 demo 的 sortable 依赖可能加载不出来，我换了 cdn 的地址](https://jsbin.com/yuzotatani/edit?html,css,js,output)

当然，既然 `sortable.js` 支持了，那么没理由 `Vue.draggable` 不支持

`18` 年就有人提了 `pr` ，但是作者并不想支持插件扩展的 `sortable.js` ，所以就没有合并

> [swap feature](https://github.com/SortableJS/Vue.Draggable/pull/817)

所以，我就想着自己尝试 `fork` 一下仓库，然后把这个 `pr` 合进去， 看看效果

当然我并不是直接 `cp` 了 `pr` 的代码，我先试了一下直接添加 `swap` 插件

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/18/202203181134277.avif)

然后在最简单的 `demo` 中设置了这个插件新增的参数 `swap` 和 `swapClass`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/18/202203181136543.avif)

把拖动过程中匹配到的元素的背景色设成红色

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/18/202203181137483.avif)

这里可能会被 `bootstrap` 的样式影响到，所以我直接把相关的类给去掉了

然后，我就发现，这样子不行...

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/18/202203181153211.gif)

很明显，把 `0` 拖到 `2` 的位置，预期的结果应该是 `2 1 0` ，但是真实的结果是 `1 0 2`

那就只能把 `pr` 剩下的代码也合并进来了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/03/18/202203181550211.gif)

看起来似乎很不错，但是依然没有动画

说实话， `Vue.draggable` 的代码看得很懵...

由于 `sortable.js` 是通过 `UI` 而不是数据来驱动的，这就导致在 `UI` 发生变化的时候，无法同步的修改数据的变化

而 `Vue.draggable` 通过 `sortable.js` 暴露的一些钩子来同步数据与 `UI` 视图，使其保持一致

不过看代码怎么感觉 `Vue.draggable` 接管了部分 `UI` 的更新...

# 后记

总的来说，通过组件外部来 `hack` 交换式拖拽，感觉比在组件内部使用 `swap` 插件来的更简单，也更方便一些

这个 `Vue.draggable` 也是很久没更新了
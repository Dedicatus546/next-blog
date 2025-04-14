---
title: 封装 vuetify 的 snackbar 组件
tags:
  - Vue
  - Vuetify
categories:
  - 编程
key: 1710731217date: 2024-03-18 11:06:57
updated: 2024-03-18 11:06:57
---

# 前言

封装 vuetify 的 snackbar 组件。

<!-- more -->

在一些组件库中，提供了一种命令的方式来让我们调用提示框，比如：

- ElementUI 的 [ElMessage](https://element-plus.org/zh-CN/component/message.html)
- NaiveUI 的 [useMessage](https://www.naiveui.com/zh-CN/os-theme/components/message)
- Ant Design Vue 的 [messageApi](https://antdv.com/components/message)

在 Vuetify 中，并没有这样的现成的接口供我们使用，但 Vuetify 提供了一个 Snackbar 组件，用来显示信息。

所以本篇文章会告诉大家如何来封装一个 Snackbar ，使得我们能够以命令的方式来调用 Snackbar 。

# 正文

## 准备

在实现之前，我们要明白给到用户侧的接口是什么，这次我们主要模仿的是 NaiveUI 的实现，也就是说我们要提供一个 Provider 组件，以及一个 composition 函数。

Provider 组件主要用来集中管理所有的 Snackbar 实例，而 useMessage 函数则是用来获取暴露的接口，用来实例化新的 Snackbar 。

我们可以暂定 useMessage 主要返回一个函数，它的声明看起来如下：

```typescript
type MessageReturnType = (msg: string) => void;

declare function useMessage(): MessageReturnType;
```

使用的时候看起来是下面这样的：

```html
<script setup>
import { useMessage } from "xxx";

const message = useMessage();

const showMessage = () => {
  message("hello world!");
}
</script>

<!-- 其他代码 -->
```

对于 Provider ，它用于包裹在顶层的组件中，提供一个渲染 Snackbar 的容器：

```html
<!-- app.vue -->
<script setup>
import { Provider } from "xxx";
</script>

<template>
  <Provider>
    <OtherComponent></OtherComponent>
  </Provider>
</template>
```

## Provider

对于 Provider ，我们需要做两件事，一个是根据响应式对象来渲染 Snackbar ，一个是通过 provide 接口来改变内部的响应式对象，从而动态的生成 Snackbar

我们先定义一个响应式的数组，这个数组只存需要显示的 message ，对应我们调用时的参数

```html
<script setup lang="ts">
// ...

const instanceList = ref<Array<{ id: number; msg: string; value: boolean }>>(
  []
);
</script>
```

接着我们根据这个数组来实例化 Snackbar

```html
<template>
  <slot></slot>
  <v-snackbar
    v-for="inst of instanceList"
    :key="inst.id"
    v-model:model-value="inst.value"
  >
    {{ inst.msg }}
  </v-snackbar>
</template>
```

接着我们需要暴露接口来更新这个 instanceList

```html

<script setup lang="ts">
// ...

let id = 0;
const message = (msg: string) => {
  instanceList.value.push({
    id: ++id,
    msg,
    value: true,
  });
};

provide("messageFn", message);
</script>
```

## useMessage

在完成 Provider 之后，我们编写一个 composition ，它的内部很简单，就是获取 Provider 组件 provide 的一个函数，然后返回

```typescript
const useMessage = () => {
  const message = inject<(msg: string) => void>("messageFn")!;
  return message;
};
```

至此，我们的核心代码基本上就写完了，当然，它的功能还很简陋，不过效果是符合预期的

测试代码如下：

```html
<script setup lang="ts">
import { useMessage } from "xxx";

const message = useMessage();

const showMessage = () => {
  message("hello world!");
};
</script>

<template>
  <div class="w-screen h-screen d-flex align-center justify-center">
    <v-btn @click="showMessage">show</v-btn>
  </div>
</template>
```

测试效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/03/18/20240318073422255.gif)

# 后记

通过这种方式，可以编写一个丰富的 message 接口。

我已经在 github 上开源了一个项目， [vuetify-message-vue3](https://github.com/Dedicatus546/vuetify-message-vue3) ，它的底层就基于本文的实现方式

而且它支持更加丰富的参数，更加人性化的调用，以及完善的类型提示。

如果你喜欢这个项目，可以点个 star ~ 希望它可以帮你更快地写出业务代码。
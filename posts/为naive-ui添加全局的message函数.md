---
title: 为naive-ui添加全局的message函数
key: 1639450899date: 2021-12-14 11:01:39
updated: 2023-02-13 18:28:44
tags:
 - JavaScript
 - Vue
 - Naive-UI
categories:
 - 编程
---


# 前言

为 `naive-ui` 添加全局的 `message` ，`notification` ， `loaddingBar` ， `dialog` 函数

<!-- more --> 

对于 `Vue3` ，个人非常喜欢 `naive-ui` 这个 `ui` 库，并且也在工作中把它应用到了相应的项目之中

虽然它看起来有点像 `ant-design` ， 不过国内的 `ui` 库大体都是以蓝色为主色，看起来就有些审美疲劳了

# 正文

我们都知道，像 `element-ui` ， `ant-design` 等都有一些通用的方法可供全局使用，即可以脱离组件的上下文

比如 `element-plus` 的 

- [ElMessage](https://element-plus.gitee.io/zh-CN/component/message.html)
- [ElNotification](https://element-plus.gitee.io/zh-CN/component/notification.html)
- [ElMessageBox](https://element-plus.gitee.io/zh-CN/component/message-box.html)

我们可以在任何地方使用这些组件，比如 `axios` 的拦截器中，或者路由守卫（ `hooks` ）中

而在 `naive-ui` 中，使用 `message` 的方法比较特别

首先是必须包在 `n-message-provider` 组件下

然后使用 `useMessage` 来获取 `message` 实例

`App.vue`
```html
<script setup lang="ts">
import { NMessageProvider } from 'naive-ui';
import Content from './Content.vue';
</script>

<template>
  <NMessageProvider>
    <Content></Content>
  </NMessageProvider>
</template>
```

`Content.vue`
```html
<script setup lang="ts">
import { useMessage } from 'naive-ui';

const message = useMessage();

const open = () => {
  message.info('我是消息')
}
</script>

<template>
  <button @click="open">打开message</button>
</template>
```

看起来有点复杂

我去翻了下历史的 `issues` 记录， 发现有人已经有提过相关的 `issue` 了

- [issue#1333 希望新增以下组件的一些方法](https://github.com/TuSimple/naive-ui/issues/1333)
- [issue#771 Loading Bar和Message全局使用](https://github.com/TuSimple/naive-ui/issues/771)
- [issue#665 Message组件在setup外调用方式](https://github.com/TuSimple/naive-ui/issues/665)

不过作者似乎并不想提供这样的 `api` ，作者在第三个 `issue` 中回复了

> If you must need to render a message before app is ready, you need to render a app outside current app and set message api globally. However remember message is a part of your app. You can't operate a phone before you turn it on.

意思是如果确实需要在 `app` 被挂在前调用 `message`， 那么需要在原 `app` 外部额外渲染一个 `app` ，并且把相关的 `api` 全局化

作者的意思很简单，想用 `message`， 就是得 `app` 挂载了才能用，因为 `message` 就是整个 `app` 的一个部分

作者还举了个例子：**你不能在手机还没开机的时候就操作它**

所以，我们需要按照作者说的来进行 `hack` 

## 干掉 `useXXX`

每次都要 `useMessage` 很麻烦，那么如何才能导出一个全局变量呢？

可以通过添加一个空的组件来把 `message` 提升到全局

`MessageInjectWindow.vue`
```html
<script setup lang="ts">
import { useMessage } from "naive-ui";

window["$message"] = useMessage();
</script>

<template></template>
```

然后我们把上面的组件放到 `App.vue` 中

```html
<script setup lang="ts">
import { NMessageProvider } from 'naive-ui';
import Content from './Content.vue';
</script>

<template>
  <NMessageProvider>
    <MessageInjectWindow></MessageInjectWindow>
    <Content></Content>
  </NMessageProvider>
</template>
```

然后在 `Content.vue` 中就可以使用 `$message` 了

```html
<script setup lang="ts">
const open = () => {
  $message.info('我是消息');
}
</script>

<template>
  <button @click="open">打开message</button>
</template>
```

不过在代码的过程中总觉得缺了点啥？没错，就是代码提示

这是一个 `ts` 的项目，通过添加 `d.ts` 可以为 `$message` 赋予类型提示

创建 `global.d.ts` 然后输入以下内容

```ts
declare global {
  // 可以直接使用 $message
  const $message: import("naive-ui").MessageApi;
  const $dialog: import("naive-ui").DialogApi;
  const $notification: import("naive-ui").NotificationApi;
  const $loadingBar: import("naive-ui").LoadingBarApi;

  interface Window {
    // 挂载需要的类型提示
    // 或者通过 window.$message 使用
    $message: import("naive-ui").MessageApi;
    $dialog: import("naive-ui").DialogApi;
    $notification: import("naive-ui").NotificationApi;
    $loadingBar: import("naive-ui").LoadingBarApi;
  }
}
export {};
```

在 `Window` 下定义是因为需要通过 `window['$xxx'] = useXXX()` 来挂载， 不加的话在 `ts` 项目下就会有红线

在 `global` 下定义意味着除了 `window['$xxx']` 来调用之外，也可以直接使用 `$xxx` 直接使用

这样子代码就有不错的提示了

![](https://s4.ax1x.com/2021/12/14/ovKKRH.png)

![](https://s4.ax1x.com/2021/12/14/ovKUJg.png)

## 干掉只能在app内使用

虽然我们已经提取了全局的 `api` 了，但是依然无法在没有 `app` 的上下文下使用

比如如果我想在 `mount` 之前调用一个接口，这个接口要使用 `message` 来显示一些信息，那么就会报错

```ts
import { createApp } from "vue";
import App from "./App.vue";

const bootstrap = async () => {
  // 想在挂在前调用一个接口
  await Promise.resolve().then(() => {
    $message.info("hello");
  });
  // 接口完成再挂载 app
  createApp(App).mount("#app");
};

bootstrap();
```

结果显而易见，报错

![](https://s4.ax1x.com/2021/12/14/ovMdAK.png)

原因很简单，都没挂载 `app` ，那么 `MessageInjectWindow.vue` 的 `setup` 不会执行，自然也就没有注入 `message` 实例了

那么这时候就需要构建一个空的 `app` ，在目标 `app` 之前挂载，然后全局化 `api`

创建 AppProvider.vue

```html
<script lang="ts" setup>
import { NMessageProvider } from "naive-ui";
import MessageInjectWindow from "./MessageInjectWindow.vue";
</script>

<template>
  <NMessageProvider>
    <MessageInjectWindow></MessageInjectWindow>
  </NMessageProvider>
</template>
```

内容基本一样，不过没有 `Content.vue` ，因为作为一个空的 app ，不需要渲染真正的内容节点

然后修改 `main.ts`

```ts
import { createApp } from "vue";
import App from "./App.vue";
import AppProvider from './AppProvider.vue';

const bootstrap = async () => {
  // 挂载一个空的 app
  createApp(AppProvider).mount('#app-provider');
  // 想在挂在前调用一个接口
  await Promise.resolve().then(() => {
    $message.info("hello");
  });
  // 接口完成再挂载 app
  createApp(App).mount("#app");
};

bootstrap();
```

然后就可以愉快的使用全局的 `$message` 了

# 后记

这个方法是从 `Naive-ui-admin` 以及相关的 `issues` 查找到的

目前已经用在公司的项目中

如果只是讨厌每次调用接口时写 `useXXX`

`issues` 中也有用户提议可以封装通用的 `useRequest` 

反正，萝卜青菜各有所爱吧~
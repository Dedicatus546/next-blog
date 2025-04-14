---
title: 如何流畅的使用在 Vue3 中使用 TypeScript
key: 1662971442date: 2022-09-12 16:30:42
updated: 2023-02-13 18:28:45
tags:
- Vue
- TypeScript
- JSX
- TSX
categories:
- 编程
---




# 前言

如何流畅的使用在 `Vue3` 中使用 `TypeScript`

<!-- more -->

# 正文

既然使用了 `TypeScript` ，当然我们就希望能尽可能的对组件支持类型提示

在 `Vue3` 中，我们可以使用 `SFC`（单文件组件） 或者 `JSX` 组件

或者手写 `h` 函数，当然，我觉得应该没有人会这么做哈哈哈哈，毕竟太烦琐了，不过组件到最后都是编译成 `h` 函数的形式的，所以还是要知道是如何写的

## 非 TypeScript 下的 SFC

在单文件组件中，我们可以使用 `defineProps`, `defineEmits`, `defineExpose` 等辅助函数来绑定相应的属性

在非 `ts` 下，我们使用传入参数的方式来指定相应的值，如下：

```html
<script setup>
const props = defineProps({
  p1: {
    type: String,
    required: true,
  },
});

const emits = defineEmits(["update:p1"]);
</script>

<template>
  <div>p1 = {{ props.p1 }}</div>
  <div>p1 = {{ p1 }}</div>
</template>
```

在 `VSCode` 中，引入组件使用时，依然对 `p1` 的提示为 `string | undefined` ，按理说这里既然制定了 `required` 为 `true` 了，类型推断应该为 `string` 才对

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111051035.avif)

而在 `Webstorm` 中，对类型的推断就正确了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111053013.avif)

并且 `VSCode` 对传入类型的推断也没有 `Webstorm` 来的友好，即使我们对 `p1` 传了数字，也依然没有提示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111100731.avif)

而 `Webstorm` 就很好的提示了类型的不合适

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111101246.avif)

当然我也不确定是不是我没有设置什么东西，挺奇怪的，插件 `Volar` 和 `TypeScript Vue Plugin` 都安装了

对于 `emit` ，也是只能推断出事件名，对于事件参数就无能为力了

`VSCode` 下可以很好提示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111107431.avif)

`Webstorm` 下就不行了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111109171.avif)

当然除了常用的 `props` 和 `emit` 之外，有些时候我们需要暴露组件的方法给外界，在 `SFC` 中，我们使用 `defineExpose` 来定义

```html
<script setup>
const props = defineProps({
  p1: {
    type: String,
    required: true,
  },
});

defineExpose({
  getP1() {
    return props.p1;
  },
});
</script>

<template></template>
```

这样子我们就暴露了一个 `getP1` 的方法，这样我们通过 `ref` 来绑定组件实例时就能调用这个方法了

当然，由于我们无法指定类型，所以即使 `appCompRef` 绑到了 `ref` 属性上，代码段里的类型依然是 `null`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111120307.avif)

当然我们可以曲线救国，使用 `jsdoc` 来标记变量

不过这里似乎 `VSCode` 在 `script` 内无法使用 `jsdoc` 语法

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111139340.avif)

而 `Webstorm` 可以支持，所以我们可以通过 `jsdoc` 来获得类型支持

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111141898.avif)

都这样了，我是真觉得写 `jsdoc` 不如写类型声明...

当然，如果本身项目已经是基于 `js` 的话，可以先添加一些 `jsdoc` 来获得提示

然后引入 `TypeScript` ，逐步完善类型定义也行，如果不让引入 `TypeScript` ，那就只能 `jsdoc` 了

## TypeScript 下的 SFC

在 `TypeScript` 下，使用 `defineProps` ， `defineEmits` 就不必传值了，我们可以直接定义类型

```html
<script setup lang="ts">
const props = defineProps<{
  p1: string;
}>();

const emit = defineEmits<{
  (e: "update:p1", val: string): void;
}>();
</script>

<template>
  <div>p1 = {{ props.p1 }}</div>
</template>

```

不传 `p1` 出现错误提示

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111212650.avif)

传 `p1` 为数字 `2` ，不符合类型定义报错

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111215587.avif)

事件支持完整定义，现在参数类型必须和定义一致，不然报错

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111218380.avif)

对于 `defineExpose` ，依然无法很好的自动推断，所以我们需要新建一个类型来代表组件暴露的方法

```typescript
export type AppCompInst = {
  getP1: () => string;
};
```

然后我们在组件内引入，然后实现它

```html
<script setup lang="ts">
import { AppCompInst } from "../types";

const props = defineProps<{
  p1: string;
}>();

const emit = defineEmits<{
  (e: "update:p1", val: string): void;
}>();

defineExpose<AppCompInst>({
  getP1() {
    return props.p1;
  },
});
</script>

<template>
  <div>p1 = {{ props.p1 }}</div>
</template>

```

然后我们需要在引用组件实例的地方导入 `AppCompInst` ，这些就能获得类型提示了

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111233832.avif)

个人觉得，`props` 和 `emit` 已经支持的很好了，但是 `expose` 总觉得还是差点意思

如果能够在通过 `defineExpose` 定义之后，通过某个辅助类型函数来提取 `expose` 的类型定义就好了，类似如下

```typescript
type ResolveExpose = /* 这里是内部实现，我们不管 */;

const appCompRef = ref<ResolveExpose<typeof AppComp> | null>(null);
```

写这篇的时候顺便去提了这个 `issue` ：[type auto resolve when use defineExpose in typescript](https://github.com/vuejs/core/issues/6644)

当然，如果就是不想用自定义类型，那么我们可以用 `TypeScript` 的内置类型函数 `InstanceType` 来获得组件的实例类型

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/11/202209111503996.avif)

当然这么写的缺点就是能够取到很多我们不需要的属性

## TypeScript 下的 JSX

一般我们都是用 `SFC` 来编写组件，当然，我们可能也会是使用 `JSX` 来编写组件

在 `JSX` 中就没有 `defineProps` `defineEmits` 这些工具函数了，我们需要通过 `options` 的形式来定义相关的属性

为了良好的类型提示，我们需要使用 `defineComponent` 来定义组件

```tsx
const AppComp = defineComponent({
  setup() {},
  render() {
    return <div>Hello</div>;
  },
});

export default AppComp;
```

这里 `defineComponent` 只是为了类型提示，如果你直接导出传入的对象也是可以的，`Vue` 组件定义实际上就只是一个简单的 `Record` 而已，

但是直接导出是没有任何类型提示的，对于 `jsx` 和 `tsx` 文件来说都是非常不方便的，所以我们一定要把对象放到 `defineComponent` 函数中

对于 `props` ，和之前我们写 `options` 的 `vue2` 一样

```tsx
const AppComp = defineComponent({
  props: {
    p1: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    console.log(props.p1);
  },
  render() {
    return <div>Hello</div>;
  },
});

export default AppComp;
```

只要正确的定义 `props` ，那么就能正确地推断出对应的类型，不过由于 `type` 是要设置对应的构造器的，所以对于一些自定义的类型来说，可能不够灵活

这里我们就需要使用 `PropType` 来限定类型

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209120134846.avif)

这样， `props.p1` 的类型就会限定为 `large` 和 `small` 了，

别的组件引入也能正确的推断出来

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209120136716.avif)

如果这里你想把 `props` 写到外部，那么一定要给这个对象加上 `const` 修饰，不然 `required` 属性会被推断成 `boolean` 而不是 `true` 造成类型推断错误

没加 `as const`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209121518115.avif)

加上 `as const`

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209121520385.avif)

对于 `emits` ，在 `JSX` 中，我们可以完全不使用 `emits` 属性，我们全部可以定义成 `props` 来使用

如果你想抛出一个 `success` 的事件，那么在 `props` 定义一个 `onSuccess` 的属性即可

然后在需要使用的地方，比如在 `setup` 中，使用 `props.onSuccess?.()` 即可

```tsx
import { PropType } from "vue";

const appCompProps = {
  p1: String,
  onSuccess: Function as PropType<() => void>,
} as const;

const AppComp = defineComponent({
  props: appCompProps,
  setup(props) {
    props.onSuccess?.();
  },
  render() {
    return <div>hello</div>;
  },
});
```

这样子写是有完整的类型提示的，无论是 `setup` 内，还是外部组件引入

`setup` 内

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209121534524.avif)

外部组件引入

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2022/09/12/202209121535028.avif)

对于双向绑定，`JSX` 中也可以写成如下，可以理解为一个语法糖吧

```tsx
import VueComp from "./components/VueComp.vue";

const App = defineComponent({
  setup() {
    const value = ref("hello world");
    return () => <VueComp vModel={[value.value, "value"]}></VueComp>;
  },
});

export default App;
```

对于 `expose` ，我们可以在 `setup` 中返回，这样类型就可以自动推断出来，通过 `render` 来编写 `UI` 结构

在 `render` 中，我们可以通过 `this` 来拿到暴露出来的变量

如果 `setup` 中返回 `render` 函数的话，外部组件引入，使用 `InstanceType` 的话 `expose` 的推导就会失效，这里要注意

```tsx
import VueComp from "./components/VueComp.vue";

const App = defineComponent({
  setup() {
    const value = ref("hello world");
    // 暴露的变量
    return {
      value,
    };
    // 不要直接返回 render 函数，不然 InstanceType 无法取到值
    // return () => <VueComp vModel={[this.value, "value"]}></VueComp>;
  },
  render() {
    return <VueComp vModel={[this.value, "value"]}></VueComp>;
  },
});

export default App;
```

当然前面我们说过，如果你不借助 `InstanceType` ，不在意通过编写类型来定义组件 `ref` 属性， 那么直接返回也是没有问题的

# 后记

这次也是第一次在公司的项目中用上 `TypeScript` ，有了类型约束，虽然整体代码量提高了，但是减少了很多心智负担

再也不怕边看后端接口属性边写代码了，只要事先定义好接口返回值的类型，写页面就痛快许多了

这次也是 `SFC` 和 `TSX` 混用，主要是导入了 `Naive-UI` 作为组件库，有些组件需要包装以便复用，这时候就用 `TSX` 来写，页面组件就直接 `SFC` 来写

总体上编码体验还是相当不错的~
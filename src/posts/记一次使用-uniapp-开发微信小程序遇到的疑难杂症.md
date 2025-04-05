---
title: >-
  记一次使用 uniapp 开发微信小程序遇到的疑难杂症
tags:
  - 微信小程序
  - uniapp
  - sard-uniapp
categories:
  - 编程
date: 2024-08-08 18:32:17
updated: 2024-08-20 11:07:37
key: 1723113138
---




# 前言

记一次使用 uniapp 开发微信小程序遇到的疑难杂症

<!-- more -->

# 正文

## swiper 滚动异常

在做列表的时候，很多情况下都是把类型放在顶部成为一个 tab ，然后左右滑动来切换列表。

在 uniapp 中，提供了一个 swiper 组件，它其实就是微信小程序中的 swiper 。

在使用 swiper 的时候，如果需要记录当前的 tab 值，则需要绑定 `current` 属性和 `change` 事件。

这里如果使用 `change` 事件，在开启 `autoplay` 或者连续快速滑动的情况下有很大概率在滑动的时候会出现 UI 错误。具体表现为晃动闪烁，相关的问题有

- [swiper 出现闪烁混乱](https://developers.weixin.qq.com/community/develop/doc/00044c85a401705da8c601f2256400)
- [ios16.0.3系统，苹果13pro-max机型，swiper组件滑动时，会出现内容来回滑动？](https://developers.weixin.qq.com/community/develop/doc/000ae8b6370930f4ca50bacc661400?_at=1723188365601)
- [swiper组件快速滑动会抖动是怎么会是？](https://developers.weixin.qq.com/community/develop/doc/000042f32686b0fd2369839ff51400)

原因在微信小程序的[文档](https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html#Bug-Tip)里有说明：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/09/20240809073524093.avif)

解决方法是不要使用 `change` 事件，而是 `animationfinish` 事件来更新 `current` 的值

```html
<script setup>
import { ref } from "vue";
const current = ref(0);

const animationfinish = (e) => {
  currentAdIndex.value = e.detail.current;
};
</script>

<template>
  <swiper :current="current" @animationfinish="animationfinish">
    <!-- 其他代码 -->
  </swiper>
</template>
```

或者用第三个帖子中有个老哥回复的方法：

```html
<script setup>
import { ref } from "vue";
const current = ref(0);

// 使用 setTimeout 确保不会多次调用 setData
let swiperCurrentTimeout = null;
const change = (e) => {
  if (swiperCurrentTimeout) {
    clearTimeout(swiperCurrentTimeout);
    swiperCurrentTimeout = null;
  }
  swiperCurrentTimeout = setTimeout(() => {
    current.value = e.detail.current;
  });
};
</script>

<template>
  <swiper :current="current" @change="change">
    <!-- 其他代码 -->
  </swiper>
</template>
```

目前用的第一个解决方法，看起来似乎没有出现闪烁的情况了。

操蛋的开发者工具不会出现这个 bug ，只有真机的情况下有概率出现，麻了。

## scroll-view 内 fixed 布局的内容在 IOS 下出现遮挡异常

如果要实现一个滚动列表，那么 uniapp 有一个 scroll-view 的组件可以作为滚动的容器，它在微信小程序中就是 scroll-view 。

在 IOS 中，如果在 scroll-view 中出现 `position: fixed` 布局（ 一般为弹出层 ）的元素的话，那么可能会出现遮挡异常的问题。

相关的问题有：

- [IOS scroll-view中的自定义组件fixed问题](https://developers.weixin.qq.com/community/develop/doc/0000667484c96844b83ac9c7651809?highLine=scroll-view%2520ios)
- [scroll-view包含的自定义组件中fixed元素层级问题？](https://developers.weixin.qq.com/community/develop/doc/0004aeafeccb789ac219e474756000)

原因是 IOS 对添加了 `-webkit-overflow-scrolling: touch` （滚动惯性）样式，他会和 `position: fixed` 发生冲突。

解决方法是将 `-webkit-overflow-scrolling: touch` 改为 `-webkit-overflow-scrolling: auto !important` ，如下：

```css
/* App.vue 内添加 */
/* 给 scroll-view 加上 scroll class */
.scroll .wx-scroll-view {
  -webkit-overflow-scrolling: auto !important;
}
```

这个用了之后确实有效果，弹出层不会被遮挡了。至于什么滚动惯性，体验更好，去他妈的，等客户提出来再说。

除了这个方法，也可以使用微信小程序的 root-portal 来模拟 `position: fixed` 。这样的话就不会被影响。

不过我用的组件库 sard-uniapp 似乎用的是 css fixed 的方案，并且我想还是尽量不使用一些特定平台的特性，所以我就直接用第一种方式了。

## 获取头像和昵称

当前的微信小程序已经不支持通过 `wx.getUserInfo` 来获取用户的头像和昵称了，调用 `wx.getUserInfo` 会返回统一的灰色头像和统一的昵称（微信用户），相关的链接为：[小程序登录、用户信息相关接口调整说明](https://developers.weixin.qq.com/community/develop/doc/000cacfa20ce88df04cb468bc52801) 。

如果需要使用微信头像和昵称的话，需要通过 button 指定的 `open-type` 和事件来触发：

```html
<script>
const chooseAvatar = (e) => {
  // 头像
  const { avatarUrl } = e.detail;
}
</script>
<template>
  <button open-type="chooseAvatar" @chooseavatar="chooseAvatar"></button>
</template>
```

```html
<template>
  <!-- 弹出键盘的上端会有微信昵称，可以点击直接填入  -->
  <input type="nickname" />
</template>
```

效果图可以在微信的文档中看到：[开放能力/用户信息/获取头像昵称](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html) 。

## 获取手机号码

一般小程序会通过用户 unionID 或者手机号来区分唯一用户，在我这次做的小程序中，我们使用的是手机号。

在微信小程序中，需要通过 button 指定的 `open-type` 和事件来触发：

```html
<script>
const getPhoneNumber = (e) => {
  // 把这个 code 给后端，消费后就能拿到用户的手机号，根据这个手机号
  // 如果没注册的情况下进行注册，然后返回 token 表示已登录
  // 如果已注册，直接返回 token 表示已登录
  const { code } = e.detail;
}
</script>
<template>
  <button open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">></button>
</template>
```

这里需要注意的是，可能组件库并没有将 `open-type` 作为 prop 传入，这时候要么自己用原生的 button 来写，要么就要把 button 当作 view 来使用。

这里我使用的是后面的方法，写成代码看起来如下（这里以登录为例子）：

```html
<script setup lang="ts">
import { ref } from "vue";

// 这个 checked 是比如说我们要同意协议的步骤
const checked = ref(false);
</script>

<template>
  <!-- button 套 button -->
  <button
    v-if="checked"
    class="loginButton"
    open-type="getPhoneNumber"
    @getphonenumber="getPhoneNumber"
  >
    <sar-button :loading="loading" round>手机号一键登录</sar-button>
  </button>
  <sar-button v-else :loading="loading" round @click="loginNoPermission">
    手机号一键登录
  </sar-button>
</template>
```

这里要注意的是 button 在微信小程序里面的默认样式的边框是通过伪类 `::after` 来设置的，这里覆盖要从 `::after` 覆盖：

```html
<style lang="scss" scoped>
.loginButton {
  padding: 0;
  margin: 0;
  border: none;
  font-size: inherit;
  appearance: none;

  /* 下面的样式可以去掉 button 的边框 */
  &::after {
    border: none;
  }
}
</style>
```

看起来不是很 nice ，但确实解决了所需的功能，如果你有其他的写法，欢迎评论！

## 识别 html 代码

在 H5 中，如果要识别一段 html 代码，一般我们使用 `v-html` ，或者直接通过 dom 操作（ `innerHTML` ） 

在 uniapp 中，我们依然可以用 `v-html` ，它在微信小程序中会被编译为 `rich-text` ，如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812064135686.avif)

在什么情况下我们会要使用到这个特性呢，最常见的应该就是编写用户协议的页面。

```html
<script setup lang="ts">
import { ref } from "vue";

// 后端通过接口把 html 内容发给前端，前端赋给 content 即可显示
const content = ref("");
</script>

<template>
  <view class="page">
    <view v-html="content"></view>
  </view>
</template>
```

上面的 `v-html` 在微信小程序中会被编译为一个 rich-text 子元素：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812064923042.avif)

注意，如果需要识别 `\n` 之类的，需要使用 text 标签而不是 view 标签，在 view 标签中， `\n` 只会被识别为空格，而 text 才会识别为换行，例子如下：

```html
<script setup lang="ts"></script>

<template>
  <view class="page">
    <view>你好\n世界</view>
    <text>你好\n世界</text>
  </view>
</template>
```

效果如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812065445508.avif)

`rich-text` 无法识别 `\n` ，会报错，如果 html 代码中混入了 `\n` ，则需要 `replace` 转化一下：

```html
<script setup lang="ts"></script>

<template>
  <view class="page">
    <view v-html="'你好\n世界'"></view>
  </view>
</template>
```

报错如下：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812065702903.avif)

## vue3 中通过 import 导入组件报错

在 uniapp 中，项目的目录几乎固定，在 `components` 中编写公共组件，在 `pages` 编写页面组件，这样子写不需要写 import 语句。

但某些时候我们需要对一个很长的页面需要拆开为一些局部的组件，这些局部的组件只会被一个页面使用，这时候如果我们使用 import 导入，则会报错：

```html
<!-- pages/test/index.vue -->
<script setup lang="ts">
import HelloWorld from "./hello-world.vue";
</script>

<template>
  <HelloWorld></HelloWorld>
</template>

<!-- pages/test/hello-world.vue -->
<script setup lang="ts"></script>

<template>
  <view>hello world</view>
</template>
```

这时执行 `npm run dev:mp-weixin` 之后，控制台就会显示一个报错：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812071205214.avif)

这个问题目前看起来是 uniapp 的问题，相关 issue 为 [#4952](https://github.com/dcloudio/uni-app/issues/4952) 。

解决方法有两个：

- 降低 uniapp 版本。
- 添加一个临时的 vite 插件。

依赖的版本这种基本不会乱改，所以这里我们用第二种方法，代码如下：

```typescript
import uni from "@dcloudio/vite-plugin-uni";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    {
      // 修复微信小程序无法导入组件
      // https://github.com/dcloudio/uni-app/issues/4952
      // 自定义插件禁用vite:vue插件的devToolsEnabled，强制编译 vue 模板时 inline 为 true
      // 不然在 setup 中导入组件会报错
      name: "fix-vite-plugin-vue",
      configResolved(config) {
        const plugin = config.plugins.find((p) => p.name === "vite:vue");
        if (plugin && plugin.api && plugin.api.options) {
          plugin.api.options.devToolsEnabled = false;
        }
      },
    },
  ]
});
```

重新执行 `npm run dev:mp-weixin` 之后代码就不报错了。

## 键盘高度

当需要使用 input 弹出键盘的时候，我们需要注意键盘高度。

关于键盘高度有两个相关的属性：

- adjust-position

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812073144480.avif)

- cursor-spacing

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812073902771.avif)

一般而言只需要设置一下 `cursor-spacing` 即可，在我的项目中这个值为 `40rpx` 。

## 安全高度

在安卓和 iPhone 中，全面屏会有一个底部的线，这部分在正常情况下我们应该通过 css 来抬高相关的内容，避免和遮挡到内容

通过 css 的 `env` 来获取安全高度

```css
.safeHeight {
  height: env(safe-area-inset-bottom); // ios >= 11.2
  height: constant(safe-area-inset-bottom); // ios < 11.2
}
```

这里的 `safe-area-inset-bottom` 就是底部的应该排除的高度

在模拟器中，可以切换机型来查看，比如切换成 iPhone X

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812080510672.avif)

当然，这个样式只在需要自定义底部样式的时候才有用，如果使用配置文件来生成 tabBar ，那么会自动抬高，就跟如上截图一样，

自定义底部的情况下，没有设置安全高度，则会出现下面的情况：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812080815082.avif)

当你设置安全高度后：

![](https://fastly.jsdelivr.net/gh/Dedicatus546/image@main/2024/08/12/20240812080848889.avif)

在安卓手机中，似乎安全高度是系统层面会直接抬高，所以设不设置都没关系。

## input 弹出键盘页面上移问题

在前面键盘高度一节，提及了两个属性 `adjust-position` 和 `cursor-spacing` 。

想象一下此时你正在编写一个聊天的界面，此时一般的布局是，使用纵向 flex ，顶部和底部固定，中间 `flex-grow` 设为 1 ，底部放置一个 input ，中间能够滚动查看消息。这时代码一般长下面这样子：

```html
<template>
  <view class="page">
    <view class="top"></view>
    <view class="content">
      <scroll-view scroll-y>
        <!-- 聊天消息列表 -->
      </scroll-view>
    </view>
    <view class="footer">
      <input />
      <button>发送</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
    
  .top,
  .footer {
    flex-shrink: 0;
  }
  .content {
    flex-grow: 1;
  }
}
</style>
```

如果此时点击这个底部的 input 弹出键盘的时候，此时页面可能会造成整体上移，顶部会被上移到屏幕之外。

这时的解决办法是，将 `adjust-position` 设置为 false ，然后通过 input 的 `keyboardheightchange` 事件来获取键盘的高度， 

```html
<script setup>
import { ref } from "vue";
  
const height = ref(0);

const onBlur = () => {
  height.value = 0;
}

const onKeyboardHeightChange = (e) => {
  height.value = e.detail.height;
}
</script>

<template>
  <view class="page">
    <view class="top"></view>
    <view class="content">
      <scroll-view scroll-y>
        <!-- 聊天消息列表 -->
      </scroll-view>
    </view>
    <view 
      class="footer" 
      :style="{
        paddingBottom: `${height}px`
      }">
      <input 
        :adjust-position="false" 
        @keyboardheightchange="onKeyboardHeightChange"
        @blur="onBlur"
      />
      <button>发送</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
    
  .top,
  .footer {
    flex-shrink: 0;
  }
  .content {
    flex-grow: 1;
  }
}
</style>
```

这里需要注意要在 `blur` 事件里面重置 height ，不然某些情况下键盘收起后 `keyboardheightchange` 不触发导致 UI 异常。

# 后记

不得不说，uniapp 和微信开发者工具的配合真的很差，很多时候都是 uniapp 项目更改了某些文件，但是没有识别出来，导致微信开发者工具没法更新，有时又是 uniapp 改了某些文件，而微信开发者工具卡住，这时候就只能重启微信开发者工具。

只能说开发的感受真的让他发狂...